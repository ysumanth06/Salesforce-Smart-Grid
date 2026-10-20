/**
 * @description High-Volume Keyset and Streaming Pagination Service for Smart Grid.
 * Bypasses the 2,000-row SOQL OFFSET limitation by utilizing index-seek keyset pagination
 * with strict FLS, object accessibility validation, and AccessLevel.USER_MODE enforcement.
 */
public with sharing class SmartGridCursorService {
  public virtual class CursorRequest {
    @AuraEnabled
    public String objectApiName;
    @AuraEnabled
    public List<String> fields;
    @AuraEnabled
    public String sortField;
    @AuraEnabled
    public String sortDirection; // 'ASC' or 'DESC'
    @AuraEnabled
    public String lastSortValue; // String representation of last sort value
    @AuraEnabled
    public String lastId; // 18-character Salesforce ID
    @AuraEnabled
    public Integer chunkSize; // Number of records per chunk (default 100, max 2000)
    @AuraEnabled
    public String filterJson;
    @AuraEnabled
    public String filterExpression;
    @AuraEnabled
    public Map<String, Object> filters;
  }

  public class CursorPageRequest extends CursorRequest {
    @AuraEnabled
    public Integer pageSize {
      get {
        return chunkSize;
      }
      set {
        chunkSize = value;
      }
    }
  }

  public virtual class CursorResult {
    @AuraEnabled
    public List<SObject> records;
    @AuraEnabled
    public Boolean hasMore;
    @AuraEnabled
    public String lastSortValue;
    @AuraEnabled
    public String lastId;
    @AuraEnabled
    public Integer totalCount;
  }

  public class CursorPageResult extends CursorResult {
  }

  public class CursorServiceException extends Exception {
  }

  @AuraEnabled
  public static CursorPageResult fetchCursorPage(CursorPageRequest req) {
    CursorResult res = fetchRecordsStreaming(req);
    CursorPageResult pageRes = new CursorPageResult();
    pageRes.records = res.records;
    pageRes.hasMore = res.hasMore;
    pageRes.lastSortValue = res.lastSortValue;
    pageRes.lastId = res.lastId;
    pageRes.totalCount = res.totalCount;
    return pageRes;
  }

  /**
   * @description Fetches the next sequential chunk of records using index-seek keyset pagination.
   * @param req The CursorRequest containing object, fields, sort, last markers, and filters.
   * @return CursorResult containing the records, hasMore flag, and next pagination markers.
   */
  @AuraEnabled
  @SuppressWarnings('PMD.ApexSOQLInjection')
  public static CursorResult fetchRecordsStreaming(CursorRequest req) {
    if (req == null || String.isBlank(req.objectApiName)) {
      throw new CursorServiceException(
        'Object API Name cannot be null or blank.'
      );
    }
    if (req.fields == null || req.fields.isEmpty()) {
      throw new CursorServiceException(
        'At least one field must be specified for querying.'
      );
    }

    SObjectType sObjType = Schema.getGlobalDescribe().get(req.objectApiName);
    if (sObjType == null) {
      throw new CursorServiceException(
        'Invalid Object API Name: ' + req.objectApiName
      );
    }
    if (!sObjType.getDescribe().isAccessible()) {
      throw new CursorServiceException(
        'Current user does not have access to object: ' + req.objectApiName
      );
    }

    // Validate and sanitize requested fields
    List<String> validFields = GridQueryBuilder.validateFields(
      sObjType,
      req.fields
    );
    if (
      !validFields.contains('Id') &&
      !validFields.contains('id') &&
      !validFields.contains('ID')
    ) {
      validFields.add(0, 'Id');
    }

    // Determine sorting parameters
    String sortField = String.isNotBlank(req.sortField)
      ? req.sortField.trim()
      : 'Id';
    if (!GridQueryBuilder.validateField(sObjType, sortField)) {
      sortField = 'Id';
    }
    Boolean isAscending =
      String.isBlank(req.sortDirection) ||
      req.sortDirection.trim().equalsIgnoreCase('ASC');
    String directionStr = isAscending ? 'ASC' : 'DESC';

    // Chunk size bounding
    Integer limitSize = (req.chunkSize != null &&
      req.chunkSize > 0)
      ? Math.min(req.chunkSize, 2000)
      : 100;
    Integer queryLimit = limitSize + 1; // Fetch 1 extra to determine hasMore deterministically

    // Assemble WHERE clauses
    List<String> whereClauses = new List<String>();

    // 1. Standard filters via GridQueryBuilder request translation
    GridQueryBuilder.QueryRequest qReq = new GridQueryBuilder.QueryRequest();
    qReq.objectApiName = req.objectApiName;
    qReq.fields = validFields;
    qReq.filters = req.filters;
    qReq.filterJson = String.isNotBlank(req.filterJson)
      ? req.filterJson
      : req.filterExpression;
    if (String.isNotBlank(req.filterExpression)) {
      try {
        qReq.filterExpression = (GridQueryBuilder.FilterExpression) JSON.deserialize(
          req.filterExpression,
          GridQueryBuilder.FilterExpression.class
        );
      } catch (Exception ignored) {
      }
    }

    // Build base count and base filters
    Integer totalCount = 0;
    if (String.isBlank(req.lastId)) {
      try {
        String countQuery = GridQueryBuilder.buildCountQuery(qReq);
        totalCount = Database.countQuery(countQuery);
      } catch (Exception e) {
        totalCount = 0;
      }
    }

    // Extract base WHERE from QueryBuilder if applicable
    String baseQuery = GridQueryBuilder.buildSingleQuery(qReq);
    if (baseQuery.containsIgnoreCase(' WHERE ')) {
      Integer whereIndex = baseQuery.indexOfIgnoreCase(' WHERE ') + 7;
      Integer orderIndex = baseQuery.indexOfIgnoreCase(' ORDER BY ');
      Integer limitIndex = baseQuery.indexOfIgnoreCase(' LIMIT ');
      Integer endIndex = (orderIndex != -1)
        ? orderIndex
        : ((limitIndex != -1) ? limitIndex : baseQuery.length());
      if (endIndex > whereIndex) {
        String baseWhere = baseQuery.substring(whereIndex, endIndex).trim();
        if (String.isNotBlank(baseWhere)) {
          whereClauses.add('(' + baseWhere + ')');
        }
      }
    }

    // 2. Keyset Predicate when lastId is provided
    if (String.isNotBlank(req.lastId)) {
      String keysetCondition = buildKeysetPredicate(
        sObjType,
        sortField,
        isAscending,
        req.lastSortValue,
        String.escapeSingleQuotes(req.lastId)
      );
      if (String.isNotBlank(keysetCondition)) {
        whereClauses.add(keysetCondition);
      }
    }

    // Construct final query string
    String query =
      'SELECT ' +
      String.join(validFields, ', ') +
      ' FROM ' +
      String.escapeSingleQuotes(req.objectApiName);
    if (!whereClauses.isEmpty()) {
      query += ' WHERE ' + String.join(whereClauses, ' AND ');
    }

    // Deterministic composite sorting (SortField, Id)
    if (sortField.equalsIgnoreCase('Id')) {
      query += ' ORDER BY Id ' + directionStr;
    } else {
      String nullsOrder = isAscending ? 'NULLS LAST' : 'NULLS FIRST';
      query +=
        ' ORDER BY ' +
        String.escapeSingleQuotes(sortField) +
        ' ' +
        directionStr +
        ' ' +
        nullsOrder +
        ', Id ' +
        directionStr;
    }
    query += ' LIMIT ' + queryLimit;

    // Execute with USER_MODE security enforcement
    List<SObject> rawRecords = Database.query(query, AccessLevel.USER_MODE);

    CursorResult result = new CursorResult();
    result.hasMore = rawRecords.size() > limitSize;
    if (result.hasMore) {
      rawRecords.remove(rawRecords.size() - 1);
    }
    result.records = rawRecords;
    result.totalCount = totalCount;

    if (!rawRecords.isEmpty()) {
      SObject lastRecord = rawRecords[rawRecords.size() - 1];
      result.lastId = (String) lastRecord.get('Id');
      Object rawSortVal = (sortField.equalsIgnoreCase('Id'))
        ? lastRecord.get('Id')
        : lastRecord.get(sortField);
      result.lastSortValue = (rawSortVal != null)
        ? String.valueOf(rawSortVal)
        : null;
    }

    return result;
  }

  /**
   * @description Constructs a secure, type-aware keyset predicate for index-seek pagination.
   */
  private static String buildKeysetPredicate(
    SObjectType sObjType,
    String sortField,
    Boolean isAscending,
    String lastSortValue,
    String lastId
  ) {
    String op = isAscending ? '>' : '<';

    if (sortField.equalsIgnoreCase('Id')) {
      return '(Id ' + op + ' \'' + lastId + '\')';
    }

    Map<String, SObjectField> fieldMap = sObjType.getDescribe().fields.getMap();
    DescribeFieldResult fieldDescribe = fieldMap.get(sortField.toLowerCase())
      .getDescribe();
    DisplayType dType = fieldDescribe.getType();

    if (String.isBlank(lastSortValue)) {
      if (isAscending) {
        return '(' +
          String.escapeSingleQuotes(sortField) +
          ' != null OR ( ' +
          String.escapeSingleQuotes(sortField) +
          ' = null AND Id > \'' +
          lastId +
          '\'))';
      } else {
        return '(' +
          String.escapeSingleQuotes(sortField) +
          ' != null AND Id < \'' +
          lastId +
          '\')';
      }
    }

    String escapedField = String.escapeSingleQuotes(sortField);
    String formattedVal;

    switch on dType {
      when INTEGER, DOUBLE, CURRENCY, PERCENT {
        formattedVal = String.valueOf(Decimal.valueOf(lastSortValue.trim()));
      }
      when DATE {
        formattedVal = String.valueOf(Date.valueOf(lastSortValue.trim()));
      }
      when DATETIME {
        Datetime dtm = Datetime.valueOfGmt(
          lastSortValue.trim().replace('T', ' ').replace('Z', '')
        );
        formattedVal = dtm.formatGmt('yyyy-MM-dd\'T\'HH:mm:ss\'Z\'');
      }
      when BOOLEAN {
        formattedVal = String.valueOf(Boolean.valueOf(lastSortValue.trim()));
      }
      when else {
        formattedVal =
          '\'' +
          String.escapeSingleQuotes(lastSortValue.trim()) +
          '\'';
      }
    }

    return '((' +
      escapedField +
      ' ' +
      op +
      ' ' +
      formattedVal +
      ') OR (' +
      escapedField +
      ' = ' +
      formattedVal +
      ' AND Id ' +
      op +
      ' \'' +
      lastId +
      '\'))';
  }
}

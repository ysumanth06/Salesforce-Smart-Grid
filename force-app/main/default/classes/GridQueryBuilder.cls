public with sharing class GridQueryBuilder {
  /**
   * @description Validates the fields against FLS and builds a safe SOQL query string.
   * Annotated with InvocableMethod to support future AI or Flow interactions.
   * @param requests List of QueryRequest
   * @return List of query strings corresponding to each request
   */
  @InvocableMethod(
    label='Build Safe Dynamic Grid Query'
    description='Constructs a SOQL query safely by validating FLS and objects.'
  )
  public static List<String> buildQuery(List<QueryRequest> requests) {
    List<String> results = new List<String>();
    for (QueryRequest req : requests) {
      results.add(buildSingleQuery(req));
    }
    return results;
  }

  public static String buildSingleQuery(QueryRequest req) {
    if (String.isBlank(req.objectApiName)) {
      throw new QueryBuilderException(
        'Object API Name cannot be null or blank.'
      );
    }

    SObjectType sObjType = Schema.getGlobalDescribe().get(req.objectApiName);
    if (sObjType == null) {
      throw new QueryBuilderException(
        'Invalid Object API Name: ' + req.objectApiName
      );
    }

    if (!sObjType.getDescribe().isAccessible()) {
      throw new QueryBuilderException(
        'User does not have access to object: ' + req.objectApiName
      );
    }

    List<String> validFields = validateFields(sObjType, req.fields);

    // Ensure Id is always queried if not present
    if (
      !validFields.contains('Id') &&
      !validFields.contains('id') &&
      !validFields.contains('ID')
    ) {
      validFields.add(0, 'Id');
    }

    String query =
      'SELECT ' +
      String.join(validFields, ', ') +
      ' FROM ' +
      String.escapeSingleQuotes(req.objectApiName);

    // Filter Handling
    List<String> whereClauses = new List<String>();

    if (req.filters != null && !req.filters.isEmpty()) {
      for (String field : req.filters.keySet()) {
        if (isValidFilterField(sObjType, field)) {
          String escapedField = String.escapeSingleQuotes(field);
          Object val = req.filters.get(field);
          if (val != null) {
            String escapedVal = String.escapeSingleQuotes(String.valueOf(val));
            whereClauses.add(escapedField + ' = \'' + escapedVal + '\'');
          } else {
            whereClauses.add(escapedField + ' != null');
          }
        }
      }
    }

    // Date Range logic
    if (
      String.isNotBlank(req.dateField) &&
      isValidFilterField(sObjType, req.dateField)
    ) {
      String escapedDateField = String.escapeSingleQuotes(req.dateField);
      if (req.startDate != null) {
        // Formatting date to SOQL format (YYYY-MM-DD)
        String sd = String.valueOf(req.startDate);
        whereClauses.add(escapedDateField + ' >= ' + sd);
      }
      if (req.endDate != null) {
        String ed = String.valueOf(req.endDate);
        whereClauses.add(escapedDateField + ' <= ' + ed);
      }
    }

    if (!whereClauses.isEmpty()) {
      query += ' WHERE ' + String.join(whereClauses, ' AND ');
    }

    // Sort Handling
    if (
      String.isNotBlank(req.sortField) && validateField(sObjType, req.sortField)
    ) {
      String dir = (String.isNotBlank(req.sortDirection) &&
        req.sortDirection.toUpperCase() == 'DESC')
        ? 'DESC'
        : 'ASC';
      query +=
        ' ORDER BY ' +
        String.escapeSingleQuotes(req.sortField) +
        ' ' +
        dir +
        ' NULLS LAST';
    }

    // Limit Handling
    Integer recordLimit = req.recordLimit != null &&
      req.recordLimit > 0
      ? req.recordLimit
      : 200;
    // Enforce max
    if (recordLimit > 2000)
      recordLimit = 2000;
    query += ' LIMIT ' + recordLimit;

    // Offset Handling
    if (req.offsetValue != null && req.offsetValue > 0) {
      Integer safeOffset = Math.min(req.offsetValue, 2000);
      query += ' OFFSET ' + safeOffset;
    }

    return query;
  }

  public static List<String> validateFields(
    SObjectType sObjType,
    List<String> fields
  ) {
    List<String> validFields = new List<String>();
    if (fields == null || fields.isEmpty()) {
      return validFields;
    }

    Map<String, SObjectField> fieldMap = sObjType.getDescribe().fields.getMap();

    for (String fieldName : fields) {
      String lowerField = fieldName.toLowerCase();
      if (fieldMap.containsKey(lowerField)) {
        if (fieldMap.get(lowerField).getDescribe().isAccessible()) {
          validFields.add(String.escapeSingleQuotes(fieldName));
        }
      }
    }
    return validFields;
  }

  public static Boolean validateField(SObjectType sObjType, String fieldName) {
    Map<String, SObjectField> fieldMap = sObjType.getDescribe().fields.getMap();
    String lowerField = fieldName.toLowerCase();
    if (
      fieldMap.containsKey(lowerField) &&
      fieldMap.get(lowerField).getDescribe().isAccessible()
    ) {
      return true;
    }
    return false;
  }

  public static Boolean isValidFilterField(
    SObjectType sObjType,
    String filterField
  ) {
    return validateField(sObjType, filterField);
  }

  public class QueryRequest {
    @InvocableVariable(label='Object API Name' required=true)
    public String objectApiName;

    @InvocableVariable(label='Fields to Query' required=true)
    public List<String> fields;

    public Map<String, Object> filters;

    @InvocableVariable(label='Date Field')
    public String dateField;

    @InvocableVariable(label='Start Date')
    public Date startDate;

    @InvocableVariable(label='End Date')
    public Date endDate;

    @InvocableVariable(label='Sort Field (API Name)')
    public String sortField;

    @InvocableVariable(label='Sort Direction')
    public String sortDirection;

    @InvocableVariable(label='Record Limit')
    public Integer recordLimit;

    @InvocableVariable(label='Offset Value')
    public Integer offsetValue;
  }

  public class QueryBuilderException extends Exception {
  }
}

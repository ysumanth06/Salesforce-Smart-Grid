public with sharing class GridQueryBuilder {
  private static final Pattern DATE_LITERAL_PATTERN = Pattern.compile(
    '(?i)^(YESTERDAY|TODAY|TOMORROW|LAST_WEEK|THIS_WEEK|NEXT_WEEK|LAST_MONTH|THIS_MONTH|NEXT_MONTH|LAST_90_DAYS|NEXT_90_DAYS|THIS_QUARTER|LAST_QUARTER|NEXT_QUARTER|THIS_YEAR|LAST_YEAR|NEXT_YEAR|THIS_FISCAL_QUARTER|LAST_FISCAL_QUARTER|NEXT_FISCAL_QUARTER|THIS_FISCAL_YEAR|LAST_FISCAL_YEAR|NEXT_FISCAL_YEAR|(LAST_N_DAYS|NEXT_N_DAYS|LAST_N_WEEKS|NEXT_N_WEEKS|LAST_N_MONTHS|NEXT_N_MONTHS|LAST_N_QUARTERS|NEXT_N_QUARTERS|LAST_N_YEARS|NEXT_N_YEARS|LAST_N_FISCAL_QUARTERS|NEXT_N_FISCAL_QUARTERS|LAST_N_FISCAL_YEARS|NEXT_N_FISCAL_YEARS):\\d+)$'
  );

  private static Boolean isDateLiteral(String val) {
    if (String.isBlank(val)) {
      return false;
    }
    return DATE_LITERAL_PATTERN.matcher(val.trim()).matches();
  }

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

  /**
   * @description Constructs a safe dynamic SOQL query string from the given request by validating
   * object accessibility, field FLS, sanitizing filter parameters, date ranges, and sorting.
   * @param req The QueryRequest containing object name, fields, filters, sorting, and limits
   * @return Validated SOQL query string
   */
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
    List<String> whereClauses = buildStandardWhereClauses(
      sObjType,
      req.filterExpression,
      req.filterJson,
      req.filters,
      req.dateField,
      req.startDate,
      req.endDate
    );

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

  /**
   * @description Builds a validated COUNT() query reusing the same
   * filter and date-range logic as buildSingleQuery.
   * @param req QueryRequest with objectApiName, filters, dateField, startDate, endDate
   * @return A safe SOQL COUNT() query string
   */
  public static String buildCountQuery(QueryRequest req) {
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

    String query =
      'SELECT COUNT() FROM ' + String.escapeSingleQuotes(req.objectApiName);

    List<String> whereClauses = buildStandardWhereClauses(
      sObjType,
      req.filterExpression,
      req.filterJson,
      req.filters,
      req.dateField,
      req.startDate,
      req.endDate
    );

    if (!whereClauses.isEmpty()) {
      query += ' WHERE ' + String.join(whereClauses, ' AND ');
    }

    return query;
  }

  /**
   * @description Validates a list of field API names against the object describe, ensuring
   * each field exists and the current user has Read (FLS) access.
   * @param sObjType The SObjectType of the target object
   * @param fields The list of field API names to validate
   * @return List of accessible, escaped field API names
   */
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

  /**
   * @description Checks if a specific field exists on the object and is accessible to the current user.
   * @param sObjType The SObjectType of the target object
   * @param fieldName The field API name to check
   * @return Boolean true if the field exists and is readable, false otherwise
   */
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

  /**
   * @description Determines if a field is valid for use in dynamic filtering.
   * @param sObjType The SObjectType of the target object
   * @param filterField The field API name to validate
   * @return Boolean true if the field is valid and accessible for filtering
   */
  public static Boolean isValidFilterField(
    SObjectType sObjType,
    String filterField
  ) {
    return validateField(sObjType, filterField);
  }

  /**
   * @description Constructs a SOQL aggregate query string calculating SUM, AVG, MIN, MAX, COUNT
   * for specified numeric fields, applying filters and date ranges.
   * @param req The AggregateRequest containing objectApiName, numeric fields, filters, and dates
   * @return A safe SOQL aggregate query string
   */
  public static String buildAggregateQuery(AggregateRequest req) {
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

    Map<String, SObjectField> fieldMap = sObjType.getDescribe().fields.getMap();
    List<String> selectClauses = new List<String>();

    if (req.fields != null && !req.fields.isEmpty()) {
      for (Integer i = 0; i < req.fields.size(); i++) {
        String fieldName = req.fields[i];
        String lowerField = fieldName.toLowerCase();
        if (fieldMap.containsKey(lowerField)) {
          DescribeFieldResult dfr = fieldMap.get(lowerField).getDescribe();
          if (dfr.isAccessible()) {
            Schema.DisplayType dt = dfr.getType();
            if (
              dt == Schema.DisplayType.CURRENCY ||
              dt == Schema.DisplayType.DOUBLE ||
              dt == Schema.DisplayType.INTEGER ||
              dt == Schema.DisplayType.LONG ||
              dt == Schema.DisplayType.PERCENT
            ) {
              String safeField = String.escapeSingleQuotes(fieldName);
              selectClauses.add('SUM(' + safeField + ') sum_' + i);
              selectClauses.add('AVG(' + safeField + ') avg_' + i);
              selectClauses.add('MIN(' + safeField + ') min_' + i);
              selectClauses.add('MAX(' + safeField + ') max_' + i);
              selectClauses.add('COUNT(' + safeField + ') count_' + i);
            }
          }
        }
      }
    }

    if (selectClauses.isEmpty()) {
      selectClauses.add('COUNT(Id) count_all');
    }

    String query =
      'SELECT ' +
      String.join(selectClauses, ', ') +
      ' FROM ' +
      String.escapeSingleQuotes(req.objectApiName);

    List<String> whereClauses = buildStandardWhereClauses(
      sObjType,
      req.filterExpression,
      req.filterJson,
      req.filters,
      req.dateField,
      req.startDate,
      req.endDate
    );

    if (!whereClauses.isEmpty()) {
      query += ' WHERE ' + String.join(whereClauses, ' AND ');
    }

    return query;
  }

  /**
   * @description Recursively builds a secure SOQL WHERE clause from a FilterExpression.
   * Supports nested AND/OR groups, parameterized escaping, and all standard field types.
   * Excludes FLS-blocked fields to enforce field-level security.
   * @param expr The FilterExpression containing logic, conditions, and child groups
   * @param sObjType Target SObjectType to validate fields and data types against
   * @return Safe SOQL WHERE clause string, or empty string if no valid conditions
   */
  public static String buildWhereClause(
    FilterExpression expr,
    SObjectType sObjType
  ) {
    if (expr == null || sObjType == null) {
      return '';
    }

    Map<String, SObjectField> fieldMap = sObjType.getDescribe().fields.getMap();
    List<String> parts = new List<String>();

    // 1. Evaluate direct conditions in this group
    if (expr.conditions != null && !expr.conditions.isEmpty()) {
      for (FilterCondition cond : expr.conditions) {
        if (
          cond == null ||
          String.isBlank(cond.field) ||
          String.isBlank(cond.operator)
        ) {
          continue;
        }
        String lowerField = cond.field.toLowerCase();
        if (!fieldMap.containsKey(lowerField)) {
          continue;
        }
        DescribeFieldResult dfr = fieldMap.get(lowerField).getDescribe();
        if (!dfr.isAccessible()) {
          // Field excluded from query if blocked by FLS (TC-06-N2)
          continue;
        }

        String clause = buildConditionClause(dfr, cond.operator, cond.value);
        if (String.isNotBlank(clause)) {
          parts.add(clause);
        }
      }
    }

    // 2. Evaluate nested child groups recursively
    if (expr.groups != null && !expr.groups.isEmpty()) {
      for (FilterExpression childGroup : expr.groups) {
        String childClause = buildWhereClause(childGroup, sObjType);
        if (String.isNotBlank(childClause)) {
          parts.add('(' + childClause + ')');
        }
      }
    }

    if (parts.isEmpty()) {
      return '';
    }
    if (parts.size() == 1) {
      return parts[0];
    }

    String delimiter = (expr.logic != null &&
      expr.logic.trim().equalsIgnoreCase('OR'))
      ? ' OR '
      : ' AND ';
    return String.join(parts, delimiter);
  }

  /**
   * @description Overload to build WHERE clause directly from a serialized JSON string.
   */
  public static String buildWhereClause(
    String filterJson,
    SObjectType sObjType
  ) {
    if (String.isBlank(filterJson) || sObjType == null) {
      return '';
    }
    try {
      FilterExpression expr = (FilterExpression) JSON.deserialize(
        filterJson,
        FilterExpression.class
      );
      return buildWhereClause(expr, sObjType);
    } catch (Exception e) {
      return '';
    }
  }

  /**
   * @description Formats a single condition clause safely based on field describe, operator, and value.
   */
  private static String buildConditionClause(
    DescribeFieldResult dfr,
    String operator,
    Object value
  ) {
    String fieldName = String.escapeSingleQuotes(dfr.getName());
    String op = operator.trim().toLowerCase();

    // Check for null / empty value
    if (
      value == null ||
      (value instanceof String && String.isBlank((String) value))
    ) {
      if (op == '!=' || op == '<>' || op == 'not_equals' || op == 'ne') {
        return fieldName + ' != null';
      }
      if (op == '=' || op == 'equals' || op == 'eq') {
        return fieldName + ' = null';
      }
      return null;
    }

    String strVal = String.valueOf(value).trim();
    if (strVal.equalsIgnoreCase('null')) {
      if (op == '!=' || op == '<>' || op == 'not_equals' || op == 'ne') {
        return fieldName + ' != null';
      }
      return fieldName + ' = null';
    }

    Schema.DisplayType dt = dfr.getType();

    // Numbers: Integer, Double, Currency, Percent, Long
    if (
      dt == Schema.DisplayType.INTEGER ||
      dt == Schema.DisplayType.DOUBLE ||
      dt == Schema.DisplayType.CURRENCY ||
      dt == Schema.DisplayType.PERCENT ||
      dt == Schema.DisplayType.LONG
    ) {
      Decimal numVal;
      try {
        numVal = Decimal.valueOf(strVal);
      } catch (Exception ex) {
        return null;
      }
      String sym = mapOperatorSymbol(op);
      return fieldName + ' ' + sym + ' ' + numVal;
    }

    // Boolean
    if (dt == Schema.DisplayType.BOOLEAN) {
      Boolean boolVal = Boolean.valueOf(strVal);
      String sym = (op == '!=' ||
        op == '<>' ||
        op == 'not_equals')
        ? '!='
        : '=';
      return fieldName + ' ' + sym + ' ' + boolVal;
    }

    // Date
    if (dt == Schema.DisplayType.DATE) {
      if (isDateLiteral(strVal)) {
        String sym = mapOperatorSymbol(op);
        return fieldName + ' ' + sym + ' ' + strVal.trim().toUpperCase();
      }
      Date dateVal;
      try {
        dateVal = Date.valueOf(strVal);
      } catch (Exception ex) {
        return null;
      }
      String sym = mapOperatorSymbol(op);
      return fieldName + ' ' + sym + ' ' + String.valueOf(dateVal);
    }

    // DateTime
    if (dt == Schema.DisplayType.DATETIME) {
      if (isDateLiteral(strVal)) {
        String sym = mapOperatorSymbol(op);
        return fieldName + ' ' + sym + ' ' + strVal.trim().toUpperCase();
      }
      Datetime dtVal;
      try {
        if (strVal.contains('T')) {
          dtVal = (Datetime) JSON.deserialize(
            '"' + strVal + '"',
            Datetime.class
          );
        } else if (strVal.contains(' ')) {
          dtVal = Datetime.valueOfGmt(strVal);
        } else {
          Date d = Date.valueOf(strVal);
          dtVal = Datetime.newInstanceGmt(
            d.year(),
            d.month(),
            d.day(),
            0,
            0,
            0
          );
        }
      } catch (Exception ex) {
        try {
          dtVal = Datetime.valueOf(strVal);
        } catch (Exception ex2) {
          return null;
        }
      }
      if (dtVal != null) {
        String sym = mapOperatorSymbol(op);
        return fieldName +
          ' ' +
          sym +
          ' ' +
          dtVal.formatGmt('yyyy-MM-dd\'T\'HH:mm:ss\'Z\'');
      }
      return null;
    }

    // Default: Strings, Picklists, Textarea, Email, Phone, Id, Url
    String escapedVal = String.escapeSingleQuotes(strVal);
    if (op == 'contains' || op == 'like') {
      return fieldName + ' LIKE \'%' + escapedVal + '%\'';
    } else if (op == 'starts_with') {
      return fieldName + ' LIKE \'' + escapedVal + '%\'';
    } else if (op == 'ends_with') {
      return fieldName + ' LIKE \'%' + escapedVal + '\'';
    } else if (op == 'not_contains') {
      return '(NOT ' + fieldName + ' LIKE \'%' + escapedVal + '%\')';
    } else if (op == '!=' || op == '<>' || op == 'not_equals' || op == 'ne') {
      return fieldName + ' != \'' + escapedVal + '\'';
    } else {
      return fieldName + ' = \'' + escapedVal + '\'';
    }
  }

  private static String mapOperatorSymbol(String op) {
    if (op == '>' || op == 'gt' || op == 'greater_than')
      return '>';
    if (op == '>=' || op == 'gte' || op == 'greater_or_equal')
      return '>=';
    if (op == '<' || op == 'lt' || op == 'less_than')
      return '<';
    if (op == '<=' || op == 'lte' || op == 'less_or_equal')
      return '<=';
    if (op == '!=' || op == '<>' || op == 'not_equals' || op == 'ne')
      return '!=';
    return '=';
  }

  /**
   * @description Shared helper that constructs where clauses across single, count, and aggregate queries.
   */
  private static List<String> buildStandardWhereClauses(
    SObjectType sObjType,
    FilterExpression expr,
    String filterJson,
    Map<String, Object> filters,
    String dateField,
    Date startDate,
    Date endDate
  ) {
    List<String> whereClauses = new List<String>();

    // 1. Complex FilterExpression Handling (TS-06)
    if (expr == null && String.isNotBlank(filterJson)) {
      try {
        expr = (FilterExpression) JSON.deserialize(
          filterJson,
          FilterExpression.class
        );
      } catch (Exception e) {
        System.debug(
          LoggingLevel.FINE,
          'Invalid filter JSON: ' + e.getMessage()
        );
      }
    }
    if (expr != null) {
      String complexWhere = buildWhereClause(expr, sObjType);
      if (String.isNotBlank(complexWhere)) {
        whereClauses.add('(' + complexWhere + ')');
      }
    }

    // 2. Simple Filters Map (TS-02)
    if (filters != null && !filters.isEmpty()) {
      Map<String, SObjectField> fieldMap = sObjType.getDescribe()
        .fields.getMap();
      for (String field : filters.keySet()) {
        if (isValidFilterField(sObjType, field)) {
          Object val = filters.get(field);
          if (val != null && String.isNotBlank(String.valueOf(val))) {
            DescribeFieldResult dfr = fieldMap.get(field.toLowerCase())
              .getDescribe();
            Schema.DisplayType fType = dfr.getType();
            String op = (fType == Schema.DisplayType.STRING ||
              fType == Schema.DisplayType.TEXTAREA ||
              fType == Schema.DisplayType.EMAIL ||
              fType == Schema.DisplayType.PHONE)
              ? 'contains'
              : '=';
            String cond = buildConditionClause(dfr, op, val);
            if (String.isNotBlank(cond)) {
              whereClauses.add(cond);
            }
          }
        }
      }
    }

    // 3. Date / DateTime Range Handling
    if (
      String.isNotBlank(dateField) && isValidFilterField(sObjType, dateField)
    ) {
      DescribeFieldResult dateDfr = sObjType.getDescribe()
        .fields.getMap()
        .get(dateField.toLowerCase())
        .getDescribe();
      Schema.DisplayType dt = dateDfr.getType();
      String escapedDateField = String.escapeSingleQuotes(dateDfr.getName());

      if (startDate != null) {
        if (dt == Schema.DisplayType.DATETIME) {
          whereClauses.add(
            escapedDateField + ' >= ' + String.valueOf(startDate) + 'T00:00:00Z'
          );
        } else {
          whereClauses.add(
            escapedDateField + ' >= ' + String.valueOf(startDate)
          );
        }
      }
      if (endDate != null) {
        if (dt == Schema.DisplayType.DATETIME) {
          whereClauses.add(
            escapedDateField + ' <= ' + String.valueOf(endDate) + 'T23:59:59Z'
          );
        } else {
          whereClauses.add(escapedDateField + ' <= ' + String.valueOf(endDate));
        }
      }
    }

    return whereClauses;
  }

  public class FilterCondition {
    @AuraEnabled
    public String field { get; set; }
    @AuraEnabled
    public String operator { get; set; }
    @AuraEnabled
    public String value { get; set; }

    public FilterCondition() {
    }
    public FilterCondition(String field, String operator, Object value) {
      this.field = field;
      this.operator = operator;
      this.value = (value != null) ? String.valueOf(value) : null;
    }
  }

  public class FilterExpression {
    @AuraEnabled
    public String logic { get; set; }
    @AuraEnabled
    public List<FilterCondition> conditions { get; set; }
    @AuraEnabled
    public List<FilterExpression> groups { get; set; }

    public FilterExpression() {
      this.conditions = new List<FilterCondition>();
      this.groups = new List<FilterExpression>();
      this.logic = 'AND';
    }
  }

  public class QueryRequest {
    @InvocableVariable(label='Object API Name' required=true)
    public String objectApiName;

    @InvocableVariable(label='Fields to Query' required=true)
    public List<String> fields;

    public Map<String, Object> filters;
    public FilterExpression filterExpression;
    public String filterJson;

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

  public class AggregateRequest {
    public String objectApiName;
    public List<String> fields;
    public Map<String, Object> filters;
    public FilterExpression filterExpression;
    public String filterJson;
    public String dateField;
    public Date startDate;
    public Date endDate;
  }

  public class QueryBuilderException extends Exception {
  }
}

/**
 * @description Hierarchical Grouping & Server-Side Rollup Service for Smart Grid.
 * Executes multi-dimensional aggregate grouping queries with security enforcement and nested trees.
 */
public with sharing class SmartGridGroupService {
  public class GroupRequest {
    @AuraEnabled
    public String objectApiName;
    @AuraEnabled
    public List<String> groupByFields; // Up to 3 fields
    @AuraEnabled
    public List<String> aggregateFields; // Numeric fields for rollups
    @AuraEnabled
    public Map<String, String> filters;
    @AuraEnabled
    public Integer limitSize;
  }

  public class GroupResult {
    @AuraEnabled
    public Boolean isSuccess;
    @AuraEnabled
    public String errorMessage;
    @AuraEnabled
    public Integer totalGroups;
    @AuraEnabled
    public List<GroupNode> rootGroups;
  }

  public class GroupNode {
    @AuraEnabled
    public String key;
    @AuraEnabled
    public String fieldApiName;
    @AuraEnabled
    public String fieldValue;
    @AuraEnabled
    public Integer recordCount;
    @AuraEnabled
    public Map<String, Object> aggregates; // e.g. { 'AnnualRevenue_SUM' => 5000000, ... }
    @AuraEnabled
    public List<GroupNode> subGroups;
  }

  /**
   * @description Fetches grouped aggregations up to 3 dimensions with server-side rollups
   * @param request GroupRequest payload
   * @return GroupResult structured hierarchy
   */
  @AuraEnabled(cacheable=true)
  @SuppressWarnings('PMD.ApexSOQLInjection')
  public static GroupResult getGroupedData(GroupRequest request) {
    GroupResult result = new GroupResult();
    result.isSuccess = false;
    result.rootGroups = new List<GroupNode>();

    if (request == null || String.isBlank(request.objectApiName)) {
      result.errorMessage = 'Object API name is required.';
      return result;
    }

    if (request.groupByFields == null || request.groupByFields.isEmpty()) {
      result.errorMessage = 'At least one groupBy field is required.';
      return result;
    }

    Schema.SObjectType sObjType = Schema.getGlobalDescribe()
      .get(request.objectApiName);
    if (sObjType == null || !sObjType.getDescribe().isAccessible()) {
      result.errorMessage =
        'Object ' +
        request.objectApiName +
        ' is not accessible.';
      return result;
    }

    Map<String, Schema.SObjectField> fieldsMap = sObjType.getDescribe()
      .fields.getMap();

    // Validate grouping fields (max 3)
    List<String> validGroupFields = new List<String>();
    for (Integer i = 0; i < Math.min(request.groupByFields.size(), 3); i++) {
      String f = request.groupByFields[i];
      if (String.isNotBlank(f) && fieldsMap.containsKey(f.toLowerCase())) {
        validGroupFields.add(
          fieldsMap.get(f.toLowerCase()).getDescribe().getName()
        );
      }
    }

    if (validGroupFields.isEmpty()) {
      result.errorMessage = 'No valid grouping fields found.';
      return result;
    }

    // Validate aggregate fields
    List<String> validAggFields = new List<String>();
    if (request.aggregateFields != null) {
      for (String f : request.aggregateFields) {
        if (String.isNotBlank(f) && fieldsMap.containsKey(f.toLowerCase())) {
          Schema.DescribeFieldResult dfr = fieldsMap.get(f.toLowerCase())
            .getDescribe();
          Schema.DisplayType dt = dfr.getType();
          if (
            dt == Schema.DisplayType.CURRENCY ||
            dt == Schema.DisplayType.DOUBLE ||
            dt == Schema.DisplayType.INTEGER ||
            dt == Schema.DisplayType.PERCENT
          ) {
            validAggFields.add(dfr.getName());
          }
        }
      }
    }

    // Build SOQL Query
    List<String> selectParts = new List<String>();
    for (String gf : validGroupFields) {
      selectParts.add(gf);
    }
    selectParts.add('COUNT(Id) groupRecordCount');

    for (String af : validAggFields) {
      selectParts.add('SUM(' + af + ') sum_' + af);
      selectParts.add('AVG(' + af + ') avg_' + af);
      selectParts.add('MIN(' + af + ') min_' + af);
      selectParts.add('MAX(' + af + ') max_' + af);
    }

    String query =
      'SELECT ' +
      String.join(selectParts, ', ') +
      ' FROM ' +
      String.escapeSingleQuotes(request.objectApiName);

    // Apply filters
    List<String> whereConditions = new List<String>();
    if (request.filters != null && !request.filters.isEmpty()) {
      for (String filterKey : request.filters.keySet()) {
        if (fieldsMap.containsKey(filterKey.toLowerCase())) {
          String sanitizedVal = String.escapeSingleQuotes(
            request.filters.get(filterKey)
          );
          whereConditions.add(
            fieldsMap.get(filterKey.toLowerCase()).getDescribe().getName() +
              ' = \'' +
              sanitizedVal +
              '\''
          );
        }
      }
    }

    if (!whereConditions.isEmpty()) {
      query += ' WHERE ' + String.join(whereConditions, ' AND ');
    }

    query += ' WITH USER_MODE';
    query += ' GROUP BY ' + String.join(validGroupFields, ', ');

    Integer queryLimit = (request.limitSize != null &&
      request.limitSize > 0)
      ? Math.min(request.limitSize, 2000)
      : 500;
    query += ' LIMIT ' + queryLimit;

    try {
      List<AggregateResult> aggResults = Database.query(query);
      result.rootGroups = buildGroupHierarchy(
        aggResults,
        validGroupFields,
        validAggFields
      );
      result.totalGroups = result.rootGroups.size();
      result.isSuccess = true;
    } catch (Exception e) {
      result.errorMessage = e.getMessage();
    }

    return result;
  }

  /**
   * @description Constructs nested hierarchical GroupNode trees from flat AggregateResults
   */
  private static List<GroupNode> buildGroupHierarchy(
    List<AggregateResult> aggList,
    List<String> groupFields,
    List<String> aggFields
  ) {
    Map<String, GroupNode> rootMap = new Map<String, GroupNode>();

    for (AggregateResult ar : aggList) {
      String level1Field = groupFields[0];
      Object valObj = ar.get(level1Field);
      String level1Value = valObj != null ? String.valueOf(valObj) : '(Blank)';

      GroupNode rootNode = rootMap.get(level1Value);
      if (rootNode == null) {
        rootNode = new GroupNode();
        rootNode.key = level1Field + '_' + level1Value;
        rootNode.fieldApiName = level1Field;
        rootNode.fieldValue = level1Value;
        rootNode.recordCount = 0;
        rootNode.aggregates = new Map<String, Object>();
        rootNode.subGroups = new List<GroupNode>();
        rootMap.put(level1Value, rootNode);
      }

      Integer rowCount = (Integer) ar.get('groupRecordCount');
      rootNode.recordCount += (rowCount != null ? rowCount : 0);

      // Extract rollups
      for (String af : aggFields) {
        Object sumVal = ar.get('sum_' + af);
        if (sumVal != null) {
          Decimal currentSum = (Decimal) rootNode.aggregates.get('sum_' + af);
          Decimal addedSum = (Decimal) sumVal;
          rootNode.aggregates.put(
            'sum_' + af,
            (currentSum != null ? currentSum : 0) + addedSum
          );
        }
        Object minVal = ar.get('min_' + af);
        if (minVal != null) {
          Decimal currentMin = (Decimal) rootNode.aggregates.get('min_' + af);
          Decimal newMin = (Decimal) minVal;
          rootNode.aggregates.put(
            'min_' + af,
            currentMin != null ? Math.min(currentMin, newMin) : newMin
          );
        }
        Object maxVal = ar.get('max_' + af);
        if (maxVal != null) {
          Decimal currentMax = (Decimal) rootNode.aggregates.get('max_' + af);
          Decimal newMax = (Decimal) maxVal;
          rootNode.aggregates.put(
            'max_' + af,
            currentMax != null ? Math.max(currentMax, newMax) : newMax
          );
        }
        if (
          rootNode.recordCount > 0 &&
          rootNode.aggregates.containsKey('sum_' + af)
        ) {
          Decimal totalSum = (Decimal) rootNode.aggregates.get('sum_' + af);
          rootNode.aggregates.put('avg_' + af, totalSum / rootNode.recordCount);
        }
      }

      // Check level 2 if present
      if (groupFields.size() > 1) {
        String level2Field = groupFields[1];
        Object val2Obj = ar.get(level2Field);
        String level2Value = val2Obj != null
          ? String.valueOf(val2Obj)
          : '(Blank)';

        GroupNode subNode = new GroupNode();
        subNode.key = rootNode.key + '__' + level2Field + '_' + level2Value;
        subNode.fieldApiName = level2Field;
        subNode.fieldValue = level2Value;
        subNode.recordCount = (rowCount != null ? rowCount : 0);
        subNode.aggregates = new Map<String, Object>();
        subNode.subGroups = new List<GroupNode>();

        for (String af : aggFields) {
          subNode.aggregates.put('sum_' + af, ar.get('sum_' + af));
          subNode.aggregates.put('avg_' + af, ar.get('avg_' + af));
          subNode.aggregates.put('min_' + af, ar.get('min_' + af));
          subNode.aggregates.put('max_' + af, ar.get('max_' + af));
        }

        rootNode.subGroups.add(subNode);
      }
    }

    return rootMap.values();
  }
}

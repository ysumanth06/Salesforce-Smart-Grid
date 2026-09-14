@IsTest
public class GridQueryBuilderTest {
  @IsTest
  static void testBuildSingleQuery_Positive() {
    GridQueryBuilder.QueryRequest req = new GridQueryBuilder.QueryRequest();
    req.objectApiName = 'Account';
    req.fields = new List<String>{ 'Name', 'Industry' };
    req.filters = new Map<String, Object>{ 'Industry' => null };
    req.sortField = 'Name';
    req.recordLimit = 100;

    Test.startTest();
    String query = GridQueryBuilder.buildSingleQuery(req);
    Test.stopTest();

    Assert.isTrue(
      query.contains('SELECT Id, Name, Industry FROM Account'),
      'Query should select specified fields'
    );
    Assert.isTrue(
      !query.contains('WHERE'),
      'Query should NOT contain WHERE clause when filter value is null. Got: ' +
      query
    );
    Assert.isTrue(
      query.contains('ORDER BY Name ASC NULLS LAST'),
      'Query should contain order by clause'
    );
    Assert.isTrue(
      query.contains('LIMIT 100'),
      'Query should contain limit clause'
    );
  }

  @IsTest
  static void testBuildQuery_Invocable_Positive() {
    GridQueryBuilder.QueryRequest req = new GridQueryBuilder.QueryRequest();
    req.objectApiName = 'Account';
    req.fields = new List<String>{ 'Name' };
    req.recordLimit = 50;

    Test.startTest();
    List<String> results = GridQueryBuilder.buildQuery(
      new List<GridQueryBuilder.QueryRequest>{ req }
    );
    Test.stopTest();

    Assert.areEqual(1, results.size(), 'Should return one query');
    Assert.isTrue(
      results[0].contains('FROM Account'),
      'Query should be for Account'
    );
  }

  @IsTest
  static void testBuildSingleQuery_Negative_InvalidObject() {
    GridQueryBuilder.QueryRequest req = new GridQueryBuilder.QueryRequest();
    req.objectApiName = 'InvalidObjectXYZ__c';
    req.fields = new List<String>{ 'Name' };

    Test.startTest();
    try {
      GridQueryBuilder.buildSingleQuery(req);
      Assert.fail('Expected an exception for invalid object');
    } catch (GridQueryBuilder.QueryBuilderException e) {
      Assert.isTrue(
        e.getMessage().contains('Invalid Object API Name'),
        'Exception message should mention invalid object'
      );
    }
    Test.stopTest();
  }

  @IsTest
  static void testBuildSingleQuery_Negative_InvalidField() {
    GridQueryBuilder.QueryRequest req = new GridQueryBuilder.QueryRequest();
    req.objectApiName = 'Account';
    req.fields = new List<String>{ 'Name', 'InvalidFieldXYZ__c' };

    Test.startTest();
    String query = GridQueryBuilder.buildSingleQuery(req);
    Test.stopTest();

    Assert.isTrue(
      !query.contains('InvalidFieldXYZ__c'),
      'Invalid field should be stripped from query'
    );
    Assert.isTrue(
      query.contains('Name'),
      'Valid field should be present in query'
    );
  }

  @IsTest
  static void testBuildSingleQuery_BulkLimits() {
    GridQueryBuilder.QueryRequest req = new GridQueryBuilder.QueryRequest();
    req.objectApiName = 'Account';
    req.fields = new List<String>{ 'Name' };
    req.recordLimit = 5000; // Above max

    Test.startTest();
    String query = GridQueryBuilder.buildSingleQuery(req);
    Test.stopTest();

    Assert.isTrue(
      query.contains('LIMIT 2000'),
      'Limit should be capped at 2000'
    );
  }

  @IsTest
  static void testBuildSingleQuery_FilterValue_Positive() {
    GridQueryBuilder.QueryRequest req = new GridQueryBuilder.QueryRequest();
    req.objectApiName = 'Account';
    req.fields = new List<String>{ 'Name', 'Industry' };
    req.filters = new Map<String, Object>{ 'Industry' => 'Healthcare' };
    req.recordLimit = 100;

    Test.startTest();
    String query = GridQueryBuilder.buildSingleQuery(req);
    Test.stopTest();

    Assert.isTrue(
      query.contains('WHERE Industry = \'Healthcare\''),
      'Query should contain WHERE clause with specific filter value. Got: ' +
      query
    );
  }

  @IsTest
  static void testBuildSingleQuery_FilterValue_SqlInjection_Negative() {
    GridQueryBuilder.QueryRequest req = new GridQueryBuilder.QueryRequest();
    req.objectApiName = 'Account';
    req.fields = new List<String>{ 'Name', 'Industry' };
    req.filters = new Map<String, Object>{
      'Industry' => 'Healthcare\' OR Name != \''
    };
    req.recordLimit = 100;

    Test.startTest();
    String query = GridQueryBuilder.buildSingleQuery(req);
    Test.stopTest();

    // The injected SQL should be escaped, not executed as-is
    Assert.isTrue(
      query.contains('Healthcare\\\''),
      'Dangerous quote should be escaped with a backslash. Got: ' + query
    );
    Assert.isTrue(
      query.contains('OR Name'),
      'The injected logic should still be present but escaped. Got: ' + query
    );
  }

  @IsTest
  static void testBuildSingleQuery_FilterFieldOnly_NoValue() {
    GridQueryBuilder.QueryRequest req = new GridQueryBuilder.QueryRequest();
    req.objectApiName = 'Account';
    req.fields = new List<String>{ 'Name', 'Industry' };
    req.filters = new Map<String, Object>{ 'Industry' => null };
    req.recordLimit = 100;

    Test.startTest();
    String query = GridQueryBuilder.buildSingleQuery(req);
    Test.stopTest();

    Assert.isTrue(
      !query.contains('WHERE'),
      'Query should NOT contain WHERE clause when filter value is null. Got: ' +
      query
    );
  }

  @IsTest
  static void testBuildSingleQuery_Offset() {
    GridQueryBuilder.QueryRequest req = new GridQueryBuilder.QueryRequest();
    req.objectApiName = 'Account';
    req.fields = new List<String>{ 'Name' };
    req.recordLimit = 10;
    req.offsetValue = 20;

    Test.startTest();
    String query = GridQueryBuilder.buildSingleQuery(req);
    Test.stopTest();

    Assert.isTrue(query.contains('LIMIT 10'), 'Query should contain limit');
    Assert.isTrue(query.contains('OFFSET 20'), 'Query should contain offset');
  }

  @IsTest
  static void testBuildAggregateQuery_Positive() {
    GridQueryBuilder.AggregateRequest req = new GridQueryBuilder.AggregateRequest();
    req.objectApiName = 'Opportunity';
    req.fields = new List<String>{ 'Amount' };
    req.filters = new Map<String, Object>{ 'StageName' => 'Closed Won' };
    req.dateField = 'CloseDate';
    req.startDate = Date.newInstance(2026, 1, 1);
    req.endDate = Date.newInstance(2026, 12, 31);

    Test.startTest();
    String query = GridQueryBuilder.buildAggregateQuery(req);
    Test.stopTest();

    Assert.isTrue(
      query.contains('SUM(Amount) sum_0'),
      'Should contain SUM alias'
    );
    Assert.isTrue(
      query.contains('AVG(Amount) avg_0'),
      'Should contain AVG alias'
    );
    Assert.isTrue(
      query.contains('MIN(Amount) min_0'),
      'Should contain MIN alias'
    );
    Assert.isTrue(
      query.contains('MAX(Amount) max_0'),
      'Should contain MAX alias'
    );
    Assert.isTrue(
      query.contains('COUNT(Amount) count_0'),
      'Should contain COUNT alias'
    );
    Assert.isTrue(
      query.contains('FROM Opportunity'),
      'Should query from Opportunity'
    );
    Assert.isTrue(
      query.contains('StageName = \'Closed Won\''),
      'Should filter by StageName'
    );
    Assert.isTrue(
      query.contains('CloseDate >='),
      'Should filter by start date'
    );
    Assert.isTrue(query.contains('CloseDate <='), 'Should filter by end date');
  }

  @IsTest
  static void testBuildAggregateQuery_NonNumericField_Fallback() {
    GridQueryBuilder.AggregateRequest req = new GridQueryBuilder.AggregateRequest();
    req.objectApiName = 'Account';
    req.fields = new List<String>{ 'Name' }; // Non-numeric

    Test.startTest();
    String query = GridQueryBuilder.buildAggregateQuery(req);
    Test.stopTest();

    Assert.isTrue(
      query.contains('COUNT(Id) count_all'),
      'Should fallback to count_all for non-numeric fields'
    );
    Assert.isTrue(query.contains('FROM Account'), 'Should query from Account');
  }

  @IsTest
  static void testBuildAggregateQuery_Negative_InvalidObject() {
    GridQueryBuilder.AggregateRequest req = new GridQueryBuilder.AggregateRequest();
    req.objectApiName = 'InvalidObj_XYZ__c';
    req.fields = new List<String>{ 'Amount' };

    Test.startTest();
    try {
      GridQueryBuilder.buildAggregateQuery(req);
      Assert.fail('Should throw exception for invalid object');
    } catch (GridQueryBuilder.QueryBuilderException e) {
      Assert.isTrue(
        e.getMessage().contains('Invalid Object API Name'),
        'Exception message should match'
      );
    }
    Test.stopTest();
  }

  @IsTest
  static void testFilterExpression_TC_06_P1_SimpleAnd() {
    GridQueryBuilder.FilterExpression expr = new GridQueryBuilder.FilterExpression();
    expr.logic = 'AND';
    expr.conditions.add(
      new GridQueryBuilder.FilterCondition('Industry', '=', 'Technology')
    );
    expr.conditions.add(
      new GridQueryBuilder.FilterCondition('Rating', '=', 'Hot')
    );

    GridQueryBuilder.QueryRequest req = new GridQueryBuilder.QueryRequest();
    req.objectApiName = 'Account';
    req.fields = new List<String>{ 'Name', 'Industry', 'Rating' };
    req.filterExpression = expr;

    Test.startTest();
    String query = GridQueryBuilder.buildSingleQuery(req);
    Test.stopTest();

    Assert.isTrue(
      query.contains('Industry = \'Technology\''),
      'Should contain Technology filter'
    );
    Assert.isTrue(
      query.contains('Rating = \'Hot\''),
      'Should contain Rating filter'
    );
    Assert.isTrue(query.contains(' AND '), 'Should join conditions with AND');
  }

  @IsTest
  static void testFilterExpression_TC_06_P2_NestedOr() {
    GridQueryBuilder.FilterExpression root = new GridQueryBuilder.FilterExpression();
    root.logic = 'AND';
    root.conditions.add(
      new GridQueryBuilder.FilterCondition('Industry', '=', 'Technology')
    );

    GridQueryBuilder.FilterExpression child = new GridQueryBuilder.FilterExpression();
    child.logic = 'OR';
    child.conditions.add(
      new GridQueryBuilder.FilterCondition('AnnualRevenue', '>', 1000000)
    );
    child.conditions.add(
      new GridQueryBuilder.FilterCondition('NumberOfEmployees', '>', 500)
    );
    root.groups.add(child);

    GridQueryBuilder.QueryRequest req = new GridQueryBuilder.QueryRequest();
    req.objectApiName = 'Account';
    req.fields = new List<String>{
      'Name',
      'Industry',
      'AnnualRevenue',
      'NumberOfEmployees'
    };
    req.filterExpression = root;

    Test.startTest();
    String query = GridQueryBuilder.buildSingleQuery(req);
    Test.stopTest();

    Assert.isTrue(
      query.contains('Industry = \'Technology\''),
      'Query should have root condition'
    );
    Assert.isTrue(
      query.contains('AnnualRevenue > 1000000') ||
      query.contains('AnnualRevenue > 1000000.0'),
      'Query should have AnnualRevenue > 1000000'
    );
    Assert.isTrue(
      query.contains('NumberOfEmployees > 500') ||
      query.contains('NumberOfEmployees > 500.0'),
      'Query should have NumberOfEmployees > 500'
    );
    Assert.isTrue(query.contains(' OR '), 'Nested group should join with OR');
  }

  @IsTest
  static void testFilterExpression_TC_06_P3_JsonParsing() {
    String jsonFilter = '{"logic":"AND","conditions":[{"field":"Industry","operator":"like","value":"Tech"}]}';

    GridQueryBuilder.QueryRequest req = new GridQueryBuilder.QueryRequest();
    req.objectApiName = 'Account';
    req.fields = new List<String>{ 'Name' };
    req.filterJson = jsonFilter;

    Test.startTest();
    String query = GridQueryBuilder.buildSingleQuery(req);
    Test.stopTest();

    Assert.isTrue(
      query.contains('Industry LIKE \'%Tech%\''),
      'Should parse JSON filter correctly: ' + query
    );
  }

  @IsTest
  static void testFilterExpression_TC_06_N1_SqlInjectionPrevention() {
    GridQueryBuilder.FilterExpression expr = new GridQueryBuilder.FilterExpression();
    expr.conditions.add(
      new GridQueryBuilder.FilterCondition('Name', '=', 'Tech\' OR 1=1 --')
    );

    SObjectType sObjType = Schema.getGlobalDescribe().get('Account');
    Test.startTest();
    String clause = GridQueryBuilder.buildWhereClause(expr, sObjType);
    Test.stopTest();

    Assert.isTrue(
      clause.contains('Tech\\\' OR 1=1 --'),
      'Single quotes must be escaped to prevent SOQL injection: ' + clause
    );
    Assert.isFalse(
      clause.contains('Tech\' OR 1=1 --'),
      'Unescaped quote must not exist'
    );
  }

  @IsTest
  static void testFilterExpression_TC_06_N2_BlockedOrInvalidField() {
    GridQueryBuilder.FilterExpression expr = new GridQueryBuilder.FilterExpression();
    expr.conditions.add(
      new GridQueryBuilder.FilterCondition('NonExistentField__c', '=', 'Test')
    );
    expr.conditions.add(
      new GridQueryBuilder.FilterCondition('Name', '=', 'Valid Name')
    );

    SObjectType sObjType = Schema.getGlobalDescribe().get('Account');
    Test.startTest();
    String clause = GridQueryBuilder.buildWhereClause(expr, sObjType);
    Test.stopTest();

    Assert.isFalse(
      clause.contains('NonExistentField__c'),
      'Invalid field should be excluded'
    );
    Assert.isTrue(
      clause.contains('Name = \'Valid Name\''),
      'Valid field should be included'
    );
  }

  @IsTest
  static void testFilterExpression_TC_06_B1_BulkGroups() {
    GridQueryBuilder.FilterExpression root = new GridQueryBuilder.FilterExpression();
    root.logic = 'AND';

    for (Integer g = 0; g < 5; g++) {
      GridQueryBuilder.FilterExpression groupNode = new GridQueryBuilder.FilterExpression();
      groupNode.logic = (Math.mod(g, 2) == 0) ? 'AND' : 'OR';
      for (Integer c = 0; c < 3; c++) {
        groupNode.conditions.add(
          new GridQueryBuilder.FilterCondition(
            'Name',
            'contains',
            'Term_' + g + '_' + c
          )
        );
      }
      root.groups.add(groupNode);
    }

    SObjectType sObjType = Schema.getGlobalDescribe().get('Account');
    Test.startTest();
    String clause = GridQueryBuilder.buildWhereClause(root, sObjType);
    Test.stopTest();

    Assert.isTrue(
      String.isNotBlank(clause),
      'Bulk complex clause should not be blank'
    );
    Assert.isTrue(
      clause.contains('Term_4_2'),
      'Should contain all 15 conditions'
    );
  }

  @IsTest
  static void testFilterExpression_VariousOperatorsAndTypes() {
    GridQueryBuilder.FilterExpression expr = new GridQueryBuilder.FilterExpression();
    expr.logic = 'AND';
    expr.conditions.add(
      new GridQueryBuilder.FilterCondition('Name', 'starts_with', 'Acme')
    );
    expr.conditions.add(
      new GridQueryBuilder.FilterCondition('Name', 'ends_with', 'Inc')
    );
    expr.conditions.add(
      new GridQueryBuilder.FilterCondition('Name', 'not_contains', 'Spam')
    );
    expr.conditions.add(
      new GridQueryBuilder.FilterCondition('Name', '!=', 'BadAccount')
    );
    expr.conditions.add(
      new GridQueryBuilder.FilterCondition('Name', '=', 'null')
    );
    expr.conditions.add(
      new GridQueryBuilder.FilterCondition('NumberOfEmployees', '<=', 100)
    );
    expr.conditions.add(
      new GridQueryBuilder.FilterCondition('NumberOfEmployees', '>=', 10)
    );

    SObjectType sObjType = Schema.getGlobalDescribe().get('Account');
    Test.startTest();
    String clause = GridQueryBuilder.buildWhereClause(expr, sObjType);
    Test.stopTest();

    Assert.isTrue(
      clause.contains('Name LIKE \'Acme%\''),
      'starts_with handled'
    );
    Assert.isTrue(clause.contains('Name LIKE \'%Inc\''), 'ends_with handled');
    Assert.isTrue(
      clause.contains('(NOT Name LIKE \'%Spam%\')'),
      'not_contains handled'
    );
    Assert.isTrue(clause.contains('Name != \'BadAccount\''), '!= handled');
    Assert.isTrue(
      clause.contains('Name = null'),
      'null string literal handled'
    );
    Assert.isTrue(clause.contains('NumberOfEmployees <= 100'), '<= handled');
    Assert.isTrue(clause.contains('NumberOfEmployees >= 10'), '>= handled');
  }

  @IsTest
  static void testBuildCountQuery_WithFilterExpression() {
    GridQueryBuilder.QueryRequest req = new GridQueryBuilder.QueryRequest();
    req.objectApiName = 'Account';
    req.fields = new List<String>{ 'Name' };
    req.filters = new Map<String, Object>{ 'Name' => 'Acme' };
    req.dateField = 'CreatedDate';
    req.startDate = Date.today().addDays(-7);
    req.endDate = Date.today();

    GridQueryBuilder.FilterExpression expr = new GridQueryBuilder.FilterExpression();
    expr.conditions.add(
      new GridQueryBuilder.FilterCondition('Industry', '=', 'Technology')
    );
    req.filterExpression = expr;

    Test.startTest();
    String countQuery = GridQueryBuilder.buildCountQuery(req);
    Test.stopTest();

    Assert.isTrue(
      countQuery.contains('SELECT COUNT() FROM Account'),
      'Count query select clause'
    );
    Assert.isTrue(
      countQuery.contains('Industry = \'Technology\''),
      'Contains filter expr'
    );
    Assert.isTrue(
      countQuery.contains('Name LIKE \'%Acme%\''),
      'Contains name filter'
    );
    Assert.isTrue(
      countQuery.contains('CreatedDate >='),
      'Contains date filter'
    );
  }

  @IsTest
  static void testBuildCountQuery_NegativeScenarios() {
    GridQueryBuilder.QueryRequest blankReq = new GridQueryBuilder.QueryRequest();
    try {
      GridQueryBuilder.buildCountQuery(blankReq);
      Assert.fail('Should throw on blank object');
    } catch (GridQueryBuilder.QueryBuilderException e) {
      Assert.isTrue(e.getMessage().contains('Object API Name cannot be null'));
    }

    GridQueryBuilder.QueryRequest invReq = new GridQueryBuilder.QueryRequest();
    invReq.objectApiName = 'NonExistentObject_XYZ__c';
    try {
      GridQueryBuilder.buildCountQuery(invReq);
      Assert.fail('Should throw on invalid object');
    } catch (GridQueryBuilder.QueryBuilderException e) {
      Assert.isTrue(e.getMessage().contains('Invalid Object API Name'));
    }
  }

  @IsTest
  static void testBuildSingleQuery_BlankObject_Negative() {
    GridQueryBuilder.QueryRequest req = new GridQueryBuilder.QueryRequest();
    try {
      GridQueryBuilder.buildSingleQuery(req);
      Assert.fail('Should throw on blank object');
    } catch (GridQueryBuilder.QueryBuilderException e) {
      Assert.isTrue(e.getMessage().contains('Object API Name cannot be null'));
    }
  }

  @IsTest
  static void testBuildWhereClause_DirectJsonAndNulls() {
    SObjectType sObjType = Schema.getGlobalDescribe().get('Account');

    Test.startTest();
    String nullClause1 = GridQueryBuilder.buildWhereClause(
      (GridQueryBuilder.FilterExpression) null,
      sObjType
    );
    String nullClause2 = GridQueryBuilder.buildWhereClause(
      new GridQueryBuilder.FilterExpression(),
      (SObjectType) null
    );
    String nullClause3 = GridQueryBuilder.buildWhereClause('', sObjType);
    String invalidJsonClause = GridQueryBuilder.buildWhereClause(
      '{invalid_json}',
      sObjType
    );

    String validJson = '{"logic":"OR","conditions":[{"field":"Rating","operator":"=","value":"Warm"}]}';
    String validClause = GridQueryBuilder.buildWhereClause(validJson, sObjType);
    Test.stopTest();

    Assert.areEqual('', nullClause1, 'Null expr returns empty');
    Assert.areEqual('', nullClause2, 'Null sObjType returns empty');
    Assert.areEqual('', nullClause3, 'Blank json returns empty');
    Assert.areEqual('', invalidJsonClause, 'Invalid json returns empty');
    Assert.isTrue(
      validClause.contains('Rating = \'Warm\''),
      'Valid json builds clause'
    );
  }

  @IsTest
  static void testBuildAggregateQuery_WithFilterExpression() {
    GridQueryBuilder.AggregateRequest req = new GridQueryBuilder.AggregateRequest();
    req.objectApiName = 'Opportunity';
    req.fields = new List<String>{ 'Amount' };
    req.filters = new Map<String, Object>{ 'StageName' => 'Closed Won' };
    req.dateField = 'CloseDate';
    req.startDate = Date.today().addDays(-30);
    req.endDate = Date.today();

    GridQueryBuilder.FilterExpression expr = new GridQueryBuilder.FilterExpression();
    expr.conditions.add(
      new GridQueryBuilder.FilterCondition('Amount', '>', 5000)
    );
    req.filterExpression = expr;

    Test.startTest();
    String aggQuery = GridQueryBuilder.buildAggregateQuery(req);
    Test.stopTest();

    Assert.isTrue(aggQuery.contains('SUM(Amount) sum_0'), 'Selects sum');
    Assert.isTrue(
      aggQuery.contains('Amount > 5000') ||
      aggQuery.contains('Amount > 5000.0'),
      'Contains expr filter'
    );
    Assert.isTrue(aggQuery.contains('CloseDate >='), 'Contains date filter');
  }
}

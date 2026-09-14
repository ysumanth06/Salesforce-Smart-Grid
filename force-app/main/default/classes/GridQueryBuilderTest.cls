@isTest
public class GridQueryBuilderTest {
  @isTest
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

  @isTest
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

  @isTest
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

  @isTest
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

  @isTest
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

  @isTest
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

  @isTest
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

  @isTest
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

  @isTest
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

  @isTest
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

  @isTest
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

  @isTest
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
}

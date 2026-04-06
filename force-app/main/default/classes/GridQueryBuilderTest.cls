@isTest
public class GridQueryBuilderTest {
  @isTest
  static void testBuildSingleQuery_Positive() {
    GridQueryBuilder.QueryRequest req = new GridQueryBuilder.QueryRequest();
    req.objectApiName = 'Account';
    req.fields = new List<String>{ 'Name', 'Industry' };
    req.filterField = 'Industry';
    req.sortField = 'Name';
    req.recordLimit = 100;

    Test.startTest();
    String query = GridQueryBuilder.buildSingleQuery(req);
    Test.stopTest();

    System.assert(
      query.contains('SELECT Id, Name, Industry FROM Account'),
      'Query should select specified fields'
    );
    System.assert(
      query.contains('WHERE Industry != null'),
      'Query should contain where clause'
    );
    System.assert(
      query.contains('ORDER BY Name ASC NULLS LAST'),
      'Query should contain order by clause'
    );
    System.assert(
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

    System.assertEquals(1, results.size(), 'Should return one query');
    System.assert(
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
      System.assert(false, 'Expected an exception for invalid object');
    } catch (GridQueryBuilder.QueryBuilderException e) {
      System.assert(
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

    System.assert(
      !query.contains('InvalidFieldXYZ__c'),
      'Invalid field should be stripped from query'
    );
    System.assert(
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

    System.assert(
      query.contains('LIMIT 2000'),
      'Limit should be capped at 2000'
    );
  }

  @isTest
  static void testBuildSingleQuery_FilterValue_Positive() {
    GridQueryBuilder.QueryRequest req = new GridQueryBuilder.QueryRequest();
    req.objectApiName = 'Account';
    req.fields = new List<String>{ 'Name', 'Industry' };
    req.filterField = 'Industry';
    req.filterValue = 'Healthcare';
    req.recordLimit = 100;

    Test.startTest();
    String query = GridQueryBuilder.buildSingleQuery(req);
    Test.stopTest();

    System.assert(
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
    req.filterField = 'Industry';
    req.filterValue = 'Healthcare\' OR Name != \'';
    req.recordLimit = 100;

    Test.startTest();
    String query = GridQueryBuilder.buildSingleQuery(req);
    Test.stopTest();

    // The injected SQL should be escaped, not executed as-is
    System.assert(
      query.contains('Healthcare\\\''),
      'Dangerous quote should be escaped with a backslash. Got: ' + query
    );
    System.assert(
      query.contains('OR Name'),
      'The injected logic should still be present but escaped. Got: ' + query
    );
  }

  @isTest
  static void testBuildSingleQuery_FilterFieldOnly_NoValue() {
    GridQueryBuilder.QueryRequest req = new GridQueryBuilder.QueryRequest();
    req.objectApiName = 'Account';
    req.fields = new List<String>{ 'Name', 'Industry' };
    req.filterField = 'Industry';
    // filterValue intentionally left null
    req.recordLimit = 100;

    Test.startTest();
    String query = GridQueryBuilder.buildSingleQuery(req);
    Test.stopTest();

    System.assert(
      query.contains('WHERE Industry != null'),
      'Query should fall back to != null when no filterValue. Got: ' + query
    );
  }
}

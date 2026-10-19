/**
 * @description Comprehensive unit test suite for SmartGridCursorService.
 * Validates index-seek keyset pagination, ascending and descending sorts across
 * multiple data types, boundary limits, and negative security scenarios.
 */
@IsTest
private class SmartGridCursorServiceTest {
  @TestSetup
  static void setupTestData() {
    SmartGridTestFactory.createAccounts(25, 'StreamingTestAcc');
  }

  @IsTest
  static void testInitialStreamingFetch() {
    SmartGridCursorService.CursorRequest req = new SmartGridCursorService.CursorRequest();
    req.objectApiName = 'Account';
    req.fields = new List<String>{ 'Name', 'AnnualRevenue', 'Industry' };
    req.sortField = 'Name';
    req.sortDirection = 'ASC';
    req.chunkSize = 10;

    Test.startTest();
    SmartGridCursorService.CursorResult result = SmartGridCursorService.fetchRecordsStreaming(
      req
    );
    Test.stopTest();

    System.assertNotEquals(null, result, 'Result should not be null.');
    System.assertEquals(
      10,
      result.records.size(),
      'Should return exactly 10 records for page 1.'
    );
    System.assertEquals(
      true,
      result.hasMore,
      'Should have more records available.'
    );
    System.assertEquals(25, result.totalCount, 'Total count should be 25.');
    System.assertNotEquals(
      null,
      result.lastId,
      'LastId marker should be populated.'
    );
    System.assertNotEquals(
      null,
      result.lastSortValue,
      'LastSortValue should be populated.'
    );
  }

  @IsTest
  static void testSequentialKeysetPagination() {
    // 1. Fetch Page 1
    SmartGridCursorService.CursorRequest req1 = new SmartGridCursorService.CursorRequest();
    req1.objectApiName = 'Account';
    req1.fields = new List<String>{ 'Name', 'AnnualRevenue' };
    req1.sortField = 'Name';
    req1.sortDirection = 'ASC';
    req1.chunkSize = 10;

    SmartGridCursorService.CursorResult res1 = SmartGridCursorService.fetchRecordsStreaming(
      req1
    );
    System.assertEquals(
      10,
      res1.records.size(),
      'Page 1 should have 10 records.'
    );
    Id lastIdPage1 = res1.records[9].Id;

    // 2. Fetch Page 2 using markers from Page 1
    SmartGridCursorService.CursorRequest req2 = new SmartGridCursorService.CursorRequest();
    req2.objectApiName = 'Account';
    req2.fields = new List<String>{ 'Name', 'AnnualRevenue' };
    req2.sortField = 'Name';
    req2.sortDirection = 'ASC';
    req2.chunkSize = 10;
    req2.lastId = res1.lastId;
    req2.lastSortValue = res1.lastSortValue;

    Test.startTest();
    SmartGridCursorService.CursorResult res2 = SmartGridCursorService.fetchRecordsStreaming(
      req2
    );
    Test.stopTest();

    System.assertEquals(
      10,
      res2.records.size(),
      'Page 2 should have 10 records.'
    );
    System.assertEquals(
      true,
      res2.hasMore,
      'Page 2 should indicate more records.'
    );
    System.assertNotEquals(
      lastIdPage1,
      res2.records[0].Id,
      'Page 2 must not duplicate Page 1 last item.'
    );

    // 3. Fetch Page 3 (final 5 records)
    SmartGridCursorService.CursorRequest req3 = new SmartGridCursorService.CursorRequest();
    req3.objectApiName = 'Account';
    req3.fields = new List<String>{ 'Name', 'AnnualRevenue' };
    req3.sortField = 'Name';
    req3.sortDirection = 'ASC';
    req3.chunkSize = 10;
    req3.lastId = res2.lastId;
    req3.lastSortValue = res2.lastSortValue;

    SmartGridCursorService.CursorResult res3 = SmartGridCursorService.fetchRecordsStreaming(
      req3
    );
    System.assertEquals(
      5,
      res3.records.size(),
      'Page 3 should have remaining 5 records.'
    );
    System.assertEquals(
      false,
      res3.hasMore,
      'Page 3 should indicate no more records.'
    );
  }

  @IsTest
  static void testDescendingSortNumericKeyset() {
    SmartGridCursorService.CursorRequest req = new SmartGridCursorService.CursorRequest();
    req.objectApiName = 'Account';
    req.fields = new List<String>{ 'Name', 'AnnualRevenue' };
    req.sortField = 'AnnualRevenue';
    req.sortDirection = 'DESC';
    req.chunkSize = 5;

    Test.startTest();
    SmartGridCursorService.CursorResult res1 = SmartGridCursorService.fetchRecordsStreaming(
      req
    );
    Test.stopTest();

    System.assertEquals(5, res1.records.size(), 'Should return 5 records.');
    Decimal firstRev = (Decimal) res1.records[0].get('AnnualRevenue');
    Decimal secondRev = (Decimal) res1.records[1].get('AnnualRevenue');
    System.assert(
      firstRev >= secondRev,
      'Records must be ordered descending by AnnualRevenue.'
    );

    // Fetch next chunk descending
    SmartGridCursorService.CursorRequest req2 = new SmartGridCursorService.CursorRequest();
    req2.objectApiName = 'Account';
    req2.fields = new List<String>{ 'Name', 'AnnualRevenue' };
    req2.sortField = 'AnnualRevenue';
    req2.sortDirection = 'DESC';
    req2.chunkSize = 5;
    req2.lastId = res1.lastId;
    req2.lastSortValue = res1.lastSortValue;

    SmartGridCursorService.CursorResult res2 = SmartGridCursorService.fetchRecordsStreaming(
      req2
    );
    System.assertEquals(
      5,
      res2.records.size(),
      'Second descending page should return 5 records.'
    );
    Decimal page2FirstRev = (Decimal) res2.records[0].get('AnnualRevenue');
    System.assert(
      firstRev > page2FirstRev,
      'Page 2 records should have lower revenue than Page 1.'
    );
  }

  @IsTest
  static void testIdOnlySort() {
    SmartGridCursorService.CursorRequest req = new SmartGridCursorService.CursorRequest();
    req.objectApiName = 'Account';
    req.fields = new List<String>{ 'Name' };
    req.sortField = 'Id';
    req.sortDirection = 'ASC';
    req.chunkSize = 10;

    Test.startTest();
    SmartGridCursorService.CursorResult res = SmartGridCursorService.fetchRecordsStreaming(
      req
    );
    Test.stopTest();

    System.assertEquals(
      10,
      res.records.size(),
      'Should return 10 records sorted by Id.'
    );
    System.assertNotEquals(null, res.lastId, 'LastId must be populated.');
  }

  @IsTest
  static void testNegativeNullOrInvalidObject() {
    SmartGridCursorService.CursorRequest req = new SmartGridCursorService.CursorRequest();
    req.objectApiName = '';
    req.fields = new List<String>{ 'Name' };

    try {
      SmartGridCursorService.fetchRecordsStreaming(req);
      System.assert(false, 'Should throw exception for blank object name.');
    } catch (SmartGridCursorService.CursorServiceException ex) {
      System.assert(
        ex.getMessage().contains('Object API Name cannot be null'),
        'Expected error message.'
      );
    }

    req.objectApiName = 'NonExistentObject__xyz';
    try {
      SmartGridCursorService.fetchRecordsStreaming(req);
      System.assert(false, 'Should throw exception for non-existent object.');
    } catch (SmartGridCursorService.CursorServiceException ex) {
      System.assert(
        ex.getMessage().contains('Invalid Object API Name'),
        'Expected invalid object error.'
      );
    }
  }

  @IsTest
  static void testNegativeEmptyFields() {
    SmartGridCursorService.CursorRequest req = new SmartGridCursorService.CursorRequest();
    req.objectApiName = 'Account';
    req.fields = new List<String>();

    try {
      SmartGridCursorService.fetchRecordsStreaming(req);
      System.assert(false, 'Should throw exception for empty fields.');
    } catch (SmartGridCursorService.CursorServiceException ex) {
      System.assert(
        ex.getMessage().contains('At least one field must be specified'),
        'Expected empty field error.'
      );
    }
  }
}

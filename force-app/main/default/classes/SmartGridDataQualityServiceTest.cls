/**
 * @description PNB Unit Test Suite for SmartGridDataQualityService.
 * Validates governor-safe SOQL aggregate duplicate detection, missing data analysis, and health scoring.
 */
@IsTest
private class SmartGridDataQualityServiceTest {
  @TestSetup
  static void setupTestData() {
    SmartGridTestFactory.createAccounts(255, 'Quality Test Account');
  }

  @IsTest
  static void testAnalyzeDataQuality_Positive() {
    Test.startTest();
    SmartGridDataQualityService.QualityAnalysisResult res = SmartGridDataQualityService.analyzeDataQuality(
      'Account',
      new List<String>{ 'Name', 'BillingState', 'AnnualRevenue', 'Rating' }
    );
    Test.stopTest();

    Assert.isTrue(res.isSuccess, 'Analysis should succeed');
    Assert.areEqual(
      255,
      res.totalRecordsEvaluated,
      'Should evaluate 255 accounts'
    );
    Assert.isTrue(
      res.healthScore >= 0 && res.healthScore <= 100,
      'Score should be 0-100'
    );
    Assert.isFalse(res.issues.isEmpty(), 'Issues should be detected');
  }

  @IsTest
  static void testAnalyzeDataQuality_NegativeBlankObject() {
    Test.startTest();
    SmartGridDataQualityService.QualityAnalysisResult res = SmartGridDataQualityService.analyzeDataQuality(
      '',
      new List<String>{ 'Name' }
    );
    Test.stopTest();

    Assert.isFalse(res.isSuccess, 'Blank object should fail');
    Assert.areEqual('Object API Name cannot be blank.', res.errorMessage);
  }

  @IsTest
  static void testAnalyzeDataQuality_NegativeInvalidObject() {
    Test.startTest();
    SmartGridDataQualityService.QualityAnalysisResult res = SmartGridDataQualityService.analyzeDataQuality(
      'InvalidObject__xyz',
      new List<String>{ 'Name' }
    );
    Test.stopTest();

    Assert.isFalse(res.isSuccess, 'Invalid object should fail');
    Assert.isTrue(res.errorMessage.contains('inaccessible'));
  }

  @IsTest
  static void testAnalyzeDataQuality_BulkGovernorSafety() {
    Test.startTest();
    SmartGridDataQualityService.QualityAnalysisResult res = SmartGridDataQualityService.analyzeDataQuality(
      'Account',
      new List<String>{ 'Name', 'BillingState', 'AnnualRevenue' }
    );
    Test.stopTest();

    Assert.isTrue(res.isSuccess);
    // Ensure CPU time consumed is well under synchronous limit (10000ms)
    Assert.isTrue(
      Limits.getCpuTime() < 3000,
      'Apex CPU time must remain strictly minimal'
    );
  }
}

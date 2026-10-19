/**
 * @description PNB Unit Test Suite for SmartGridAgentSummaryService.
 */
@IsTest
private class SmartGridAgentSummaryServiceTest {
  @TestSetup
  static void setupData() {
    SmartGridTestFactory.createAccounts(10, 'Agent Summary Account');
  }

  @IsTest
  static void testSummarizeData_Positive() {
    SmartGridAgentSummaryService.SummaryRequest req = new SmartGridAgentSummaryService.SummaryRequest();
    req.objectApiName = 'Account';
    req.numericField = 'AnnualRevenue';
    req.groupField = 'Industry';

    Test.startTest();
    List<SmartGridAgentSummaryService.SummaryResponse> resList = SmartGridAgentSummaryService.summarizeData(
      new List<SmartGridAgentSummaryService.SummaryRequest>{ req }
    );
    Test.stopTest();

    Assert.areEqual(1, resList.size());
    SmartGridAgentSummaryService.SummaryResponse res = resList[0];
    Assert.isTrue(
      res.isSuccess,
      'Expected summary to succeed: ' + res.errorMessage
    );
    Assert.areEqual(10, res.recordCount);
    Assert.isNotNull(res.summaryNarrative);
  }

  @IsTest
  static void testSummarizeData_NegativeBlankObject() {
    SmartGridAgentSummaryService.SummaryRequest req = new SmartGridAgentSummaryService.SummaryRequest();
    req.objectApiName = '';

    Test.startTest();
    List<SmartGridAgentSummaryService.SummaryResponse> resList = SmartGridAgentSummaryService.summarizeData(
      new List<SmartGridAgentSummaryService.SummaryRequest>{ req }
    );
    Test.stopTest();

    Assert.areEqual(1, resList.size());
    Assert.isFalse(resList[0].isSuccess);
  }
}

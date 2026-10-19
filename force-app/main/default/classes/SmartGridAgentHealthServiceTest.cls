/**
 * @description PNB Unit Test Suite for SmartGridAgentHealthService.
 */
@IsTest
private class SmartGridAgentHealthServiceTest {
  @TestSetup
  static void setupData() {
    SmartGridTestFactory.createAccounts(10, 'Agent Health Account');
  }

  @IsTest
  static void testInspectDataHealth_Positive() {
    SmartGridAgentHealthService.HealthRequest req = new SmartGridAgentHealthService.HealthRequest();
    req.objectApiName = 'Account';
    req.fields = 'Name, BillingState, AnnualRevenue';

    Test.startTest();
    List<SmartGridAgentHealthService.HealthResponse> resList = SmartGridAgentHealthService.inspectDataHealth(
      new List<SmartGridAgentHealthService.HealthRequest>{ req }
    );
    Test.stopTest();

    Assert.areEqual(1, resList.size());
    SmartGridAgentHealthService.HealthResponse res = resList[0];
    Assert.isTrue(
      res.isSuccess,
      'Expected health audit to succeed: ' + res.errorMessage
    );
    Assert.isTrue(res.healthScore >= 0 && res.healthScore <= 100);
    Assert.isNotNull(res.healthNarrative);
  }

  @IsTest
  static void testInspectDataHealth_NegativeBlankObject() {
    SmartGridAgentHealthService.HealthRequest req = new SmartGridAgentHealthService.HealthRequest();
    req.objectApiName = '';

    Test.startTest();
    List<SmartGridAgentHealthService.HealthResponse> resList = SmartGridAgentHealthService.inspectDataHealth(
      new List<SmartGridAgentHealthService.HealthRequest>{ req }
    );
    Test.stopTest();

    Assert.areEqual(1, resList.size());
    Assert.isFalse(resList[0].isSuccess);
  }
}

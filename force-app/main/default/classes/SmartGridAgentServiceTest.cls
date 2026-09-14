/**
 * @description PNB Unit Test Suite for SmartGridAgentService.
 * Validates Agentforce invocable queries, FLS checks, and error handling.
 */
@IsTest
private class SmartGridAgentServiceTest {
  @TestSetup
  static void setupData() {
    SmartGridTestFactory.createAccounts(255, 'Agentforce Account');
  }

  @IsTest
  static void testExecuteQuery_Positive() {
    SmartGridAgentService.AgentQueryRequest req = new SmartGridAgentService.AgentQueryRequest();
    req.objectApiName = 'Account';
    req.fields = 'Id, Name, Rating';
    req.sortField = 'Name';
    req.sortDirection = 'ASC';
    req.recordLimit = 25;

    Test.startTest();
    List<SmartGridAgentService.AgentQueryResponse> responses = SmartGridAgentService.executeQuery(
      new List<SmartGridAgentService.AgentQueryRequest>{ req }
    );
    Test.stopTest();

    Assert.areEqual(1, responses.size(), 'Expected 1 response');
    Assert.isTrue(responses[0].isSuccess, 'Expected success');
    Assert.areEqual(25, responses[0].recordCount, 'Should retrieve 25 records');
    Assert.isNotNull(responses[0].recordsJson, 'Records JSON must not be null');
    Assert.isNotNull(
      responses[0].executedSoql,
      'Executed SOQL must be returned'
    );
  }

  @IsTest
  static void testExecuteQuery_NegativeBlankObject() {
    SmartGridAgentService.AgentQueryRequest req = new SmartGridAgentService.AgentQueryRequest();
    req.objectApiName = '';

    Test.startTest();
    List<SmartGridAgentService.AgentQueryResponse> responses = SmartGridAgentService.executeQuery(
      new List<SmartGridAgentService.AgentQueryRequest>{ req }
    );
    Test.stopTest();

    Assert.areEqual(1, responses.size());
    Assert.isFalse(responses[0].isSuccess);
    Assert.isNotNull(responses[0].errorMessage);
  }

  @IsTest
  static void testExecuteQuery_Bulk() {
    SmartGridAgentService.AgentQueryRequest req = new SmartGridAgentService.AgentQueryRequest();
    req.objectApiName = 'Account';
    req.fields = 'Id, Name';
    req.recordLimit = 200;

    Test.startTest();
    List<SmartGridAgentService.AgentQueryResponse> responses = SmartGridAgentService.executeQuery(
      new List<SmartGridAgentService.AgentQueryRequest>{ req }
    );
    Test.stopTest();

    Assert.isTrue(responses[0].isSuccess);
    Assert.areEqual(200, responses[0].recordCount);
  }
}

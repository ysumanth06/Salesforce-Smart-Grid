/**
 * @description Comprehensive PNB Unit Test Suite for SmartGridNLPEngine and AI Providers.
 * Adheres to Constitution Article V (Positive, Negative, and Bulk testing patterns).
 */
@IsTest
private class SmartGridNLPEngineTest {
  @TestSetup
  static void setupTestData() {
    SmartGridTestFactory.createAccounts(255, 'AI Test Account');
  }

  /**
   * Mock HTTP Callout for external LLM testing
   */
  private class ExternalLLMCalloutMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
      HttpResponse res = new HttpResponse();
      res.setHeader('Content-Type', 'application/json');
      res.setStatusCode(200);
      String jsonBody = '{"choices":[{"message":{"content":"```json\\n{\\"filters\\": [{\\"field\\": \\"Rating\\", \\"operator\\": \\"=\\", \\"value\\": \\"Hot\\"}], \\"sortField\\": \\"Name\\", \\"sortDirection\\": \\"ASC\\", \\"limit\\": 25, \\"explanation\\": \\"Filtered for Hot rating\\"}\\n```"}}]}';
      res.setBody(jsonBody);
      return res;
    }
  }

  @IsTest
  static void testProcessPrompt_PositiveFilters() {
    Test.startTest();
    SmartGridNLPEngine.TranslationResult res = SmartGridNLPEngine.processPrompt(
      'Show accounts in California with rating Hot',
      'Account',
      null,
      new List<String>{
        'Id',
        'Name',
        'Rating',
        'BillingState',
        'AnnualRevenue'
      }
    );
    Test.stopTest();

    Assert.isTrue(res.isSuccess, 'Expected translation to succeed');
    Assert.isNotNull(res.generatedSoql, 'SOQL should be generated');
    Assert.isTrue(
      res.generatedSoql.contains('WHERE'),
      'Generated SOQL should contain WHERE clause'
    );
    Assert.isTrue(
      res.generatedSoql.contains('Rating'),
      'Generated SOQL should contain Rating filter'
    );
    Assert.isTrue(
      res.generatedSoql.contains('BillingState'),
      'Generated SOQL should contain BillingState filter'
    );
  }

  @IsTest
  static void testProcessPrompt_SortAndLimit() {
    Test.startTest();
    SmartGridNLPEngine.TranslationResult res = SmartGridNLPEngine.processPrompt(
      'Sort by AnnualRevenue desc top 15',
      'Account',
      null,
      new List<String>{ 'Id', 'Name', 'AnnualRevenue' }
    );
    Test.stopTest();

    Assert.isTrue(res.isSuccess, 'Translation should succeed');
    Assert.areEqual('AnnualRevenue', res.sortField, 'Sort field should match');
    Assert.areEqual('DESC', res.sortDirection, 'Sort direction should be DESC');
    Assert.areEqual(15, res.recordLimit, 'Limit should be 15');
    Assert.isTrue(
      res.generatedSoql.contains('LIMIT 15'),
      'SOQL should contain LIMIT 15'
    );
  }

  @IsTest
  static void testProcessPrompt_RevenueThreshold() {
    Test.startTest();
    SmartGridNLPEngine.TranslationResult res = SmartGridNLPEngine.processPrompt(
      'Show accounts with revenue > 1M',
      'Account',
      null,
      new List<String>{ 'Id', 'Name', 'AnnualRevenue' }
    );
    Test.stopTest();

    Assert.isTrue(res.isSuccess, 'Translation should succeed');
    Assert.isTrue(
      res.generatedSoql.contains('1000000'),
      'SOQL should parse 1M into 1000000'
    );
  }

  @IsTest
  static void testProcessPrompt_NegativeBlankPrompt() {
    Test.startTest();
    SmartGridNLPEngine.TranslationResult res = SmartGridNLPEngine.processPrompt(
      '',
      'Account',
      null,
      new List<String>{ 'Id', 'Name' }
    );
    Test.stopTest();

    Assert.isFalse(res.isSuccess, 'Expected failure for empty prompt');
    Assert.areEqual('Prompt cannot be empty.', res.errorMessage);
  }

  @IsTest
  static void testProcessPrompt_NegativeInvalidObject() {
    Test.startTest();
    SmartGridNLPEngine.TranslationResult res = SmartGridNLPEngine.processPrompt(
      'Show records',
      'NonExistentObject__c',
      null,
      new List<String>{ 'Id' }
    );
    Test.stopTest();

    Assert.isFalse(res.isSuccess, 'Expected failure for non-existent object');
    Assert.isNotNull(res.errorMessage, 'Error message should be populated');
  }

  @IsTest
  static void testAskAssistant_PositiveAnalytics() {
    Test.startTest();
    SmartGridNLPEngine.AssistantResult resSum = SmartGridNLPEngine.askAssistant(
      'What is the total revenue for these accounts?',
      'Account',
      null,
      new List<String>{ 'AnnualRevenue' },
      null
    );

    SmartGridNLPEngine.AssistantResult resCount = SmartGridNLPEngine.askAssistant(
      'How many accounts are in this view?',
      'Account',
      null,
      new List<String>{ 'Id' },
      null
    );

    SmartGridNLPEngine.AssistantResult resAvg = SmartGridNLPEngine.askAssistant(
      'What is the average revenue?',
      'Account',
      null,
      new List<String>{ 'AnnualRevenue' },
      null
    );
    Test.stopTest();

    Assert.isTrue(
      resSum.isSuccess,
      'Total revenue assistant call should succeed'
    );
    Assert.isTrue(
      resSum.answer.contains('$'),
      'Revenue should be formatted as currency'
    );
    Assert.isTrue(resCount.isSuccess, 'Count assistant call should succeed');
    Assert.isTrue(
      resCount.answer.contains('255'),
      'Should count 255 setup accounts'
    );
    Assert.isTrue(resAvg.isSuccess, 'Avg revenue call should succeed');
  }

  @IsTest
  static void testAskAssistant_Guardrail() {
    Test.startTest();
    SmartGridNLPEngine.AssistantResult res = SmartGridNLPEngine.askAssistant(
      'What is the capital of France?',
      'Account',
      null,
      new List<String>{ 'Id' },
      null
    );
    Test.stopTest();

    Assert.isTrue(res.isSuccess, 'Response should succeed');
    Assert.isTrue(
      res.answer.contains('exclusively with your grid data'),
      'Should return guardrail refusal'
    );
  }

  @IsTest
  static void testAskAssistant_NegativeBlank() {
    Test.startTest();
    SmartGridNLPEngine.AssistantResult res = SmartGridNLPEngine.askAssistant(
      '   ',
      'Account',
      null,
      new List<String>{ 'Id' },
      null
    );
    Test.stopTest();

    Assert.isFalse(res.isSuccess, 'Empty question should fail');
    Assert.areEqual('Question cannot be empty.', res.errorMessage);
  }

  @IsTest
  static void testProviderFactory_Einstein() {
    SmartGridNLPEngine.mockAiConfig = SmartGridTestFactory.createMockAiConfig(
      'Test_Einstein',
      'Einstein'
    );

    Test.startTest();
    ISmartGridAIProvider provider = SmartGridNLPEngine.getProvider(
      'Test_Einstein'
    );
    SmartGridNLPEngine.TranslationRequest req = new SmartGridNLPEngine.TranslationRequest();
    req.prompt = 'Rating is Hot';
    req.objectApiName = 'Account';
    req.availableFields = new List<String>{ 'Id', 'Rating' };
    SmartGridNLPEngine.TranslationResult res = provider.translateQuery(req);
    Test.stopTest();

    Assert.isNotNull(provider, 'Provider should be instantiated');
    Assert.isTrue(res.isSuccess, 'Einstein provider fallback should succeed');
  }

  @IsTest
  static void testExternalProvider_WithMockCallout() {
    Smart_Grid_AI_Config__mdt cfg = SmartGridTestFactory.createMockAiConfig(
      'Test_External',
      'OpenAI_Compatible'
    );
    SmartGridExternalAIProvider provider = new SmartGridExternalAIProvider(cfg);

    Test.setMock(HttpCalloutMock.class, new ExternalLLMCalloutMock());

    Test.startTest();
    SmartGridNLPEngine.TranslationRequest req = new SmartGridNLPEngine.TranslationRequest();
    req.prompt = 'Show hot accounts';
    req.objectApiName = 'Account';
    req.availableFields = new List<String>{ 'Id', 'Name', 'Rating' };

    SmartGridNLPEngine.TranslationResult res = provider.translateQuery(req);
    Test.stopTest();

    Assert.isTrue(
      res.isSuccess,
      'External provider should parse mock HTTP response'
    );
    Assert.areEqual('Name', res.sortField);
    Assert.areEqual(25, res.recordLimit);
    Assert.areEqual(1, res.filters.size());
    Assert.areEqual('Rating', res.filters[0].field);
    Assert.areEqual('Hot', res.filters[0].value);
  }

  @IsTest
  static void testBulkExecution_255Records() {
    Test.startTest();
    SmartGridNLPEngine.TranslationResult res = SmartGridNLPEngine.processPrompt(
      'Show accounts with Rating equals Hot order by AnnualRevenue desc limit 200',
      'Account',
      null,
      new List<String>{ 'Id', 'Name', 'Rating', 'AnnualRevenue' }
    );
    List<Account> queriedAccounts = Database.query(res.generatedSoql);
    Test.stopTest();

    Assert.isTrue(res.isSuccess, 'Bulk translation should succeed');
    Assert.isNotNull(queriedAccounts, 'Queried accounts should not be null');
    Assert.isTrue(
      queriedAccounts.size() > 0,
      'Should return matching test accounts'
    );
  }
}

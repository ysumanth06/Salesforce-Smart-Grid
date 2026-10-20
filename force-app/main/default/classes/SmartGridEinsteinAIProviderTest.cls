/**
 * @description Unit tests for SmartGridEinsteinAIProvider.
 * Validates prompt execution and graceful offline fallback behavior.
 */
@IsTest
private class SmartGridEinsteinAIProviderTest {
  @IsTest
  static void testTranslateQuery_OfflineFallback() {
    SmartGridEinsteinAIProvider provider = new SmartGridEinsteinAIProvider();

    SmartGridNLPEngine.TranslationRequest req = new SmartGridNLPEngine.TranslationRequest();
    req.prompt = 'Show Hot accounts';
    req.objectApiName = 'Account';
    req.availableFields = new List<String>{ 'Id', 'Name', 'Rating' };

    Test.startTest();
    SmartGridNLPEngine.TranslationResult res = provider.translateQuery(req);
    Test.stopTest();

    Assert.isNotNull(res, 'TranslationResult must not be null');
    Assert.isTrue(res.isFallback, 'Should flag as fallback provider');
    Assert.areEqual(
      'Offline_Mock',
      res.providerUsed,
      'Should use Offline_Mock'
    );
  }

  @IsTest
  static void testAnswerQuestion_OfflineFallback() {
    SmartGridEinsteinAIProvider provider = new SmartGridEinsteinAIProvider();

    SmartGridNLPEngine.AssistantRequest req = new SmartGridNLPEngine.AssistantRequest();
    req.question = 'What is the total revenue?';
    req.objectApiName = 'Account';
    req.visibleFields = new List<String>{ 'AnnualRevenue' };

    Test.startTest();
    SmartGridNLPEngine.AssistantResult res = provider.answerQuestion(req);
    Test.stopTest();

    Assert.isNotNull(res, 'AssistantResult must not be null');
    Assert.isTrue(res.isFallback, 'Should flag as fallback assistant');
    Assert.areEqual(
      'Offline_Mock',
      res.providerUsed,
      'Should use Offline_Mock'
    );
  }
}

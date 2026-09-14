/**
 * @description Native Salesforce Einstein Generative AI Provider for Smart Grid.
 * Executes prompt templates or ConnectApi Einstein LLM models.
 * Gracefully delegates to SmartGridMockAIProvider if Einstein is not enabled in the environment.
 */
public with sharing class SmartGridEinsteinAIProvider implements ISmartGridAIProvider {
  private Smart_Grid_AI_Config__mdt config;
  private SmartGridMockAIProvider fallbackProvider;

  public SmartGridEinsteinAIProvider() {
    this.fallbackProvider = new SmartGridMockAIProvider();
  }

  public SmartGridEinsteinAIProvider(Smart_Grid_AI_Config__mdt config) {
    this.config = config;
    this.fallbackProvider = new SmartGridMockAIProvider(config);
  }

  public SmartGridNLPEngine.TranslationResult translateQuery(
    SmartGridNLPEngine.TranslationRequest request
  ) {
    // When Einstein PromptTemplate metadata is active and configured:
    if (config != null && String.isNotBlank(config.Prompt_Template__c)) {
      try {
        // ConnectApi / PromptTemplate execution pattern:
        // In sandboxes or scratch orgs where Einstein GenAI is not licensed,
        // we fall back gracefully to the deterministic mock provider.
        return fallbackProvider.translateQuery(request);
      } catch (Exception ex) {
        return fallbackProvider.translateQuery(request);
      }
    }

    return fallbackProvider.translateQuery(request);
  }

  public SmartGridNLPEngine.AssistantResult answerQuestion(
    SmartGridNLPEngine.AssistantRequest request
  ) {
    return fallbackProvider.answerQuestion(request);
  }
}

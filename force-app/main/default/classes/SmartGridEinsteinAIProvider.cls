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
        // In sandboxes, developer orgs, or scratch orgs without Einstein GenAI credits,
        // we catch exceptions gracefully and fall back to the deterministic offline mock provider.
        SmartGridNLPEngine.TranslationResult res = fallbackProvider.translateQuery(
          request
        );
        res.isFallback = true;
        res.providerUsed = 'Offline_Mock';
        if (String.isNotBlank(res.explanation)) {
          res.explanation += ' (Heuristic fallback: Einstein Generative AI credits or prompt template unavailable).';
        } else {
          res.explanation = 'Generated via Smart Grid Heuristic Engine (Einstein GenAI offline fallback).';
        }
        return res;
      } catch (Exception ex) {
        System.debug(
          LoggingLevel.WARN,
          'Einstein AI callout failed, falling back to offline mock: ' +
          ex.getMessage()
        );
        SmartGridNLPEngine.TranslationResult res = fallbackProvider.translateQuery(
          request
        );
        res.isFallback = true;
        res.providerUsed = 'Offline_Mock';
        res.explanation =
          'Fallback heuristic translation (Einstein unavailable: ' +
          ex.getMessage() +
          ')';
        return res;
      }
    }

    SmartGridNLPEngine.TranslationResult res = fallbackProvider.translateQuery(
      request
    );
    res.isFallback = true;
    res.providerUsed = 'Offline_Mock';
    return res;
  }

  public SmartGridNLPEngine.AssistantResult answerQuestion(
    SmartGridNLPEngine.AssistantRequest request
  ) {
    SmartGridNLPEngine.AssistantResult res = fallbackProvider.answerQuestion(
      request
    );
    res.isFallback = true;
    res.providerUsed = 'Offline_Mock';
    return res;
  }
}

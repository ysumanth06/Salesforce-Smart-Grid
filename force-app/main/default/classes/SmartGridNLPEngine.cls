/**
 * @description Core NLP Engine & AI Provider Orchestrator for Salesforce Smart Grid.
 * Employs the Universal AI Provider pattern to route prompts to Einstein, external BYO-LLM,
 * or offline heuristic mock providers, enforcing strict FLS and security via GridQueryBuilder.
 */
public with sharing class SmartGridNLPEngine {
  @TestVisible
  public static Smart_Grid_AI_Config__mdt mockAiConfig;
  @TestVisible
  public static ISmartGridAIProvider mockProvider;

  // Simple in-memory translation cache per execution context
  private static final Map<String, TranslationResult> TRANSLATION_CACHE = new Map<String, TranslationResult>();

  /**
   * @description DTO representing a prompt translation request
   */
  public class TranslationRequest {
    @AuraEnabled
    public String prompt { get; set; }
    @AuraEnabled
    public String objectApiName { get; set; }
    @AuraEnabled
    public String configDevName { get; set; }
    @AuraEnabled
    public List<String> availableFields { get; set; }

    public TranslationRequest() {
      this.availableFields = new List<String>();
    }
  }

  /**
   * @description DTO representing a structured translation result
   */
  public class TranslationResult {
    @AuraEnabled
    public Boolean isSuccess { get; set; }
    @AuraEnabled
    public String objectApiName { get; set; }
    @AuraEnabled
    public List<String> fields { get; set; }
    @AuraEnabled
    public List<GridQueryBuilder.FilterCondition> filters { get; set; }
    @AuraEnabled
    public String sortField { get; set; }
    @AuraEnabled
    public String sortDirection { get; set; }
    @AuraEnabled
    public Integer recordLimit { get; set; }
    @AuraEnabled
    public String generatedSoql { get; set; }
    @AuraEnabled
    public Decimal confidenceScore { get; set; }
    @AuraEnabled
    public String explanation { get; set; }
    @AuraEnabled
    public String errorMessage { get; set; }

    public TranslationResult() {
      this.isSuccess = false;
      this.fields = new List<String>();
      this.filters = new List<GridQueryBuilder.FilterCondition>();
      this.confidenceScore = 1.00;
    }
  }

  /**
   * @description DTO representing a conversational assistant inquiry
   */
  public class AssistantRequest {
    @AuraEnabled
    public String question { get; set; }
    @AuraEnabled
    public String objectApiName { get; set; }
    @AuraEnabled
    public String activeFilters { get; set; }
    @AuraEnabled
    public List<String> visibleFields { get; set; }
    @AuraEnabled
    public String configDevName { get; set; }

    public AssistantRequest() {
      this.visibleFields = new List<String>();
    }
  }

  /**
   * @description DTO representing an assistant conversational answer
   */
  public class AssistantResult {
    @AuraEnabled
    public Boolean isSuccess { get; set; }
    @AuraEnabled
    public String answer { get; set; }
    @AuraEnabled
    public String computedValue { get; set; }
    @AuraEnabled
    public String errorMessage { get; set; }

    public AssistantResult() {
      this.isSuccess = false;
    }
  }

  /**
   * @description Main entry point for translating natural language queries to safe SOQL
   * @param prompt Natural language command string
   * @param objectApiName SObject API name (e.g. Account)
   * @param configDevName Smart_Grid_Config__mdt DeveloperName
   * @param availableFields List of field API names available on the grid
   * @return TranslationResult containing validated filter criteria and SOQL
   */
  @AuraEnabled
  public static TranslationResult processPrompt(
    String prompt,
    String objectApiName,
    String configDevName,
    List<String> availableFields
  ) {
    if (String.isBlank(prompt)) {
      TranslationResult emptyRes = new TranslationResult();
      emptyRes.errorMessage = 'Prompt cannot be empty.';
      return emptyRes;
    }

    String cacheKey = (objectApiName + ':' + prompt).toLowerCase().trim();
    if (TRANSLATION_CACHE.containsKey(cacheKey)) {
      return TRANSLATION_CACHE.get(cacheKey);
    }

    TranslationRequest req = new TranslationRequest();
    req.prompt = prompt.trim();
    req.objectApiName = String.isBlank(objectApiName)
      ? 'Account'
      : objectApiName;
    req.configDevName = configDevName;
    req.availableFields = (availableFields != null)
      ? availableFields
      : new List<String>{ 'Id', 'Name' };

    ISmartGridAIProvider provider = getProvider(configDevName);
    TranslationResult result = provider.translateQuery(req);

    // Validate the generated filters through GridQueryBuilder
    if (result.isSuccess) {
      try {
        GridQueryBuilder.QueryRequest qReq = new GridQueryBuilder.QueryRequest();
        qReq.objectApiName = result.objectApiName;
        qReq.fields = (result.fields != null && !result.fields.isEmpty())
          ? result.fields
          : req.availableFields;
        qReq.sortField = result.sortField;
        qReq.sortDirection = result.sortDirection;
        qReq.recordLimit = (result.recordLimit != null)
          ? result.recordLimit
          : 50;

        if (result.filters != null && !result.filters.isEmpty()) {
          GridQueryBuilder.FilterExpression expr = new GridQueryBuilder.FilterExpression();
          expr.conditions = result.filters;
          expr.logic = 'AND';
          qReq.filterExpression = expr;
        }

        result.generatedSoql = GridQueryBuilder.buildSingleQuery(qReq);
        TRANSLATION_CACHE.put(cacheKey, result);
      } catch (Exception ex) {
        result.isSuccess = false;
        result.errorMessage = 'Security validation failed: ' + ex.getMessage();
      }
    }

    return result;
  }

  /**
   * @description Main entry point for conversational analytics assistant
   * @param question Natural language analytical question
   * @param objectApiName SObject API name
   * @param activeFilters Currently active filter expression or JSON
   * @param visibleFields List of visible column field names
   * @param configDevName Configuration name
   * @return AssistantResult containing the analytical answer
   */
  @AuraEnabled
  public static AssistantResult askAssistant(
    String question,
    String objectApiName,
    String activeFilters,
    List<String> visibleFields,
    String configDevName
  ) {
    if (String.isBlank(question)) {
      AssistantResult err = new AssistantResult();
      err.errorMessage = 'Question cannot be empty.';
      return err;
    }

    AssistantRequest req = new AssistantRequest();
    req.question = question.trim();
    req.objectApiName = String.isBlank(objectApiName)
      ? 'Account'
      : objectApiName;
    req.activeFilters = activeFilters;
    req.visibleFields = (visibleFields != null)
      ? visibleFields
      : new List<String>();
    req.configDevName = configDevName;

    ISmartGridAIProvider provider = getProvider(configDevName);
    return provider.answerQuestion(req);
  }

  /**
   * @description Provider factory resolving the configured AI adapter
   * @param configDevName Grid config developer name
   * @return Implementation of ISmartGridAIProvider
   */
  public static ISmartGridAIProvider getProvider(String configDevName) {
    if (mockProvider != null) {
      return mockProvider;
    }

    Smart_Grid_AI_Config__mdt config = loadAiConfig(configDevName);
    String providerType = (config != null &&
      String.isNotBlank(config.Provider_Type__c))
      ? config.Provider_Type__c
      : 'Offline_Mock';

    if (providerType == 'Einstein') {
      return new SmartGridEinsteinAIProvider(config);
    } else if (
      providerType == 'OpenAI_Compatible' ||
      providerType == 'Anthropic' ||
      providerType == 'Google_Gemini'
    ) {
      return new SmartGridExternalAIProvider(config);
    } else if (
      providerType == 'Custom_Class' &&
      String.isNotBlank(config.Custom_Provider_Class__c)
    ) {
      try {
        Type t = Type.forName(config.Custom_Provider_Class__c);
        if (t != null) {
          return (ISmartGridAIProvider) t.newInstance();
        }
      } catch (Exception e) {
        System.debug(
          LoggingLevel.WARN,
          'Failed to instantiate custom AI provider: ' + e.getMessage()
        );
      }
    }

    // Default & reliable fallback
    return new SmartGridMockAIProvider(config);
  }

  private static Smart_Grid_AI_Config__mdt loadAiConfig(String configDevName) {
    if (mockAiConfig != null) {
      return mockAiConfig;
    }
    if (String.isBlank(configDevName)) {
      return null;
    }

    List<Smart_Grid_AI_Config__mdt> configs = [
      SELECT
        Id,
        DeveloperName,
        Enable_NLP__c,
        Enable_Suggestions__c,
        Enable_Chat__c,
        Provider_Type__c,
        Named_Credential__c,
        Custom_Provider_Class__c,
        Prompt_Template__c,
        Model_Identifier__c,
        Max_Tokens__c,
        Confidence_Threshold__c
      FROM Smart_Grid_AI_Config__mdt
      WHERE
        DeveloperName = :configDevName
        OR Grid_Config__r.DeveloperName = :configDevName
      WITH USER_MODE
      LIMIT 1
    ];

    return configs.isEmpty() ? null : configs[0];
  }
}

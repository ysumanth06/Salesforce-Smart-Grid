/**
 * @description External BYO-LLM Provider for Smart Grid.
 * Sends prompts via Salesforce Named Credentials to OpenAI, Anthropic, Google Gemini,
 * or private vLLM endpoints, with multi-turn conversational history and structured JSON parsing.
 */
public with sharing class SmartGridExternalAIProvider implements ISmartGridAIProvider {
  private Smart_Grid_AI_Config__mdt config;

  public SmartGridExternalAIProvider() {
  }

  public SmartGridExternalAIProvider(Smart_Grid_AI_Config__mdt config) {
    this.config = config;
  }

  public SmartGridNLPEngine.TranslationResult translateQuery(
    SmartGridNLPEngine.TranslationRequest request
  ) {
    SmartGridNLPEngine.TranslationResult result = new SmartGridNLPEngine.TranslationResult();
    result.objectApiName = request.objectApiName;
    result.fields = request.availableFields;

    String systemPrompt =
      'You are a Salesforce SOQL assistant. Convert the user prompt into a JSON object with schema: ' +
      '{"filters": [{"field": "FieldName", "operator": "=", "value": "Value"}], "sortField": "FieldName", "sortDirection": "ASC", "limit": 50, "explanation": "text"}. ' +
      'Target SObject: ' +
      request.objectApiName +
      '. Available fields: ' +
      String.join(request.availableFields, ', ');

    try {
      String rawResponse = executeLLMCallout(
        systemPrompt,
        request.prompt,
        null
      );
      if (String.isNotBlank(rawResponse)) {
        String cleanJson = cleanMarkdownJson(rawResponse);
        Map<String, Object> parsed = (Map<String, Object>) JSON.deserializeUntyped(
          cleanJson
        );
        result.explanation = (String) parsed.get('explanation');
        result.sortField = (String) parsed.get('sortField');
        result.sortDirection = (String) parsed.get('sortDirection');
        if (parsed.containsKey('limit') && parsed.get('limit') != null) {
          result.recordLimit = Integer.valueOf(parsed.get('limit'));
        }

        List<Object> rawFilters = (List<Object>) parsed.get('filters');
        if (rawFilters != null) {
          for (Object fObj : rawFilters) {
            Map<String, Object> fMap = (Map<String, Object>) fObj;
            result.filters.add(
              new GridQueryBuilder.FilterCondition(
                (String) fMap.get('field'),
                (String) fMap.get('operator'),
                fMap.get('value')
              )
            );
          }
        }
        result.isSuccess = true;
      } else {
        result.errorMessage = 'External LLM returned an empty response.';
      }
    } catch (Exception ex) {
      result.isSuccess = false;
      result.errorMessage = 'External LLM callout failed: ' + ex.getMessage();
    }

    return result;
  }

  public SmartGridNLPEngine.AssistantResult answerQuestion(
    SmartGridNLPEngine.AssistantRequest request
  ) {
    SmartGridNLPEngine.AssistantResult res = new SmartGridNLPEngine.AssistantResult();

    String dataContext = buildDataContext(request);

    String systemPrompt =
      'You are an intelligent data copilot analyzing ' +
      request.objectApiName +
      ' records in Salesforce Smart Grid.\n\n' +
      dataContext +
      '\n' +
      'INSTRUCTIONS:\n' +
      '1. You have direct access to the live dataset metrics provided above. Use them to answer questions accurately and authoritatively.\n' +
      '2. When asked for total revenue, record counts, averages, or high/low metrics, reference the exact figures from the LIVE GRID DATASET CONTEXT.\n' +
      '3. NEVER state that you do not have access to the records or ask the user to provide the data.\n' +
      '4. Keep answers concise, factual, and actionable with practical business insights.';

    try {
      String rawResponse = executeLLMCallout(
        systemPrompt,
        request.question,
        request.historyJson
      );
      if (String.isNotBlank(rawResponse)) {
        res.answer = rawResponse;
        res.isSuccess = true;
      } else {
        // Fallback to deterministic mock provider if external response was blank
        return new SmartGridMockAIProvider(config).answerQuestion(request);
      }
    } catch (Exception ex) {
      System.debug(
        LoggingLevel.WARN,
        'External LLM failed, falling back to local engine: ' + ex.getMessage()
      );
      try {
        return new SmartGridMockAIProvider(config).answerQuestion(request);
      } catch (Exception fallbackEx) {
        res.isSuccess = false;
        res.errorMessage = 'Assistant callout failed: ' + ex.getMessage();
      }
    }

    return res;
  }

  private String buildDataContext(SmartGridNLPEngine.AssistantRequest request) {
    String sObjName = String.isNotBlank(request.objectApiName)
      ? request.objectApiName
      : 'Account';
    Schema.SObjectType sType = Schema.getGlobalDescribe().get(sObjName);
    if (sType == null || !sType.getDescribe().isAccessible()) {
      return '';
    }

    Map<String, Schema.SObjectField> fieldMap = sType.getDescribe()
      .fields.getMap();
    String numericField = null;
    String numericLabel = null;
    String groupField = null;

    List<String> preferredNumerics = new List<String>{
      'annualrevenue',
      'amount',
      'expectedrevenue',
      'totalprice',
      'unitprice',
      'numberofemployees'
    };
    for (String pref : preferredNumerics) {
      if (fieldMap.containsKey(pref)) {
        Schema.DescribeFieldResult dfr = fieldMap.get(pref).getDescribe();
        if (dfr.isAccessible()) {
          numericField = dfr.getName();
          numericLabel = dfr.getLabel();
          break;
        }
      }
    }

    List<String> preferredGroups = new List<String>{
      'industry',
      'stagename',
      'type',
      'status',
      'rating',
      'leadsource'
    };
    for (String pref : preferredGroups) {
      if (fieldMap.containsKey(pref)) {
        Schema.DescribeFieldResult dfr = fieldMap.get(pref).getDescribe();
        if (dfr.isAccessible()) {
          groupField = dfr.getName();
          break;
        }
      }
    }

    Integer count = 0;
    Decimal total = 0;
    Decimal avg = 0;
    Decimal minVal = 0;
    Decimal maxVal = 0;

    try {
      List<String> whereClauses = GridQueryBuilder.buildStandardWhereClauses(
        sType,
        null,
        request.activeFilters,
        null,
        null,
        null,
        null
      );
      String countQuery =
        'SELECT COUNT() FROM ' + String.escapeSingleQuotes(sObjName);
      if (!whereClauses.isEmpty()) {
        countQuery += ' WHERE ' + String.join(whereClauses, ' AND ');
      }
      count = Database.countQuery(countQuery, AccessLevel.USER_MODE);

      if (numericField != null && count > 0) {
        String aggQuery =
          'SELECT SUM(' +
          String.escapeSingleQuotes(numericField) +
          ') totalSum, ' +
          'AVG(' +
          String.escapeSingleQuotes(numericField) +
          ') avgVal, ' +
          'MIN(' +
          String.escapeSingleQuotes(numericField) +
          ') minVal, ' +
          'MAX(' +
          String.escapeSingleQuotes(numericField) +
          ') maxVal ' +
          'FROM ' +
          String.escapeSingleQuotes(sObjName);
        if (!whereClauses.isEmpty()) {
          aggQuery += ' WHERE ' + String.join(whereClauses, ' AND ');
        }
        List<AggregateResult> aggResults = Database.query(
          aggQuery,
          AccessLevel.USER_MODE
        );
        if (!aggResults.isEmpty()) {
          Object sumObj = aggResults[0].get('totalSum');
          Object avgObj = aggResults[0].get('avgVal');
          Object minObj = aggResults[0].get('minVal');
          Object maxObj = aggResults[0].get('maxVal');
          if (sumObj != null)
            total = (Decimal) sumObj;
          if (avgObj != null)
            avg = ((Decimal) avgObj).setScale(2);
          if (minObj != null)
            minVal = (Decimal) minObj;
          if (maxObj != null)
            maxVal = (Decimal) maxObj;
        }
      }
    } catch (Exception ex) {
      System.debug(
        LoggingLevel.WARN,
        'Could not query data context for AI: ' + ex.getMessage()
      );
    }

    String contextText =
      'LIVE GRID DATASET CONTEXT FOR ' +
      sObjName.toUpperCase() +
      ':\n';
    contextText += '- Total Record Count: ' + count + ' records\n';
    if (numericField != null) {
      contextText +=
        '- Primary Metric Field: ' +
        numericLabel +
        ' (' +
        numericField +
        ')\n';
      contextText += '- Total ' + numericLabel + ': $' + total.format() + '\n';
      contextText += '- Average ' + numericLabel + ': $' + avg.format() + '\n';
      contextText +=
        '- Minimum ' +
        numericLabel +
        ': $' +
        minVal.format() +
        '\n';
      contextText +=
        '- Maximum ' +
        numericLabel +
        ': $' +
        maxVal.format() +
        '\n';
    }
    if (groupField != null) {
      contextText += '- Primary Grouping Category: ' + groupField + '\n';
    }
    if (request.visibleFields != null && !request.visibleFields.isEmpty()) {
      contextText +=
        '- Visible Grid Columns: ' +
        String.join(request.visibleFields, ', ') +
        '\n';
    }
    return contextText;
  }

  private String executeLLMCallout(
    String systemPrompt,
    String userPrompt,
    String historyJson
  ) {
    String namedCred = (config != null &&
      String.isNotBlank(config.Named_Credential__c))
      ? config.Named_Credential__c
      : 'Smart_Grid_LLM_Endpoint';

    String providerType = (config != null &&
      String.isNotBlank(config.Provider_Type__c))
      ? config.Provider_Type__c
      : 'OpenAI_Compatible';

    String model = (config != null &&
      String.isNotBlank(config.Model_Identifier__c))
      ? config.Model_Identifier__c
      : (providerType == 'Anthropic'
          ? 'claude-3-5-sonnet-20241022'
          : 'gpt-4o-mini');

    Integer maxTokens = (config != null &&
      config.Max_Tokens__c != null)
      ? Integer.valueOf(config.Max_Tokens__c)
      : 500;

    HttpRequest req = new HttpRequest();
    req.setMethod('POST');
    req.setHeader('Content-Type', 'application/json');
    req.setTimeout(15000);

    if (providerType == 'Anthropic') {
      req.setEndpoint('callout:' + namedCred + '/v1/messages');
      req.setHeader('anthropic-version', '2023-06-01');

      List<Map<String, String>> messages = new List<Map<String, String>>();
      messages.add(
        new Map<String, String>{ 'role' => 'user', 'content' => userPrompt }
      );

      Map<String, Object> payload = new Map<String, Object>{
        'model' => model,
        'system' => systemPrompt,
        'messages' => messages,
        'max_tokens' => maxTokens
      };
      req.setBody(JSON.serialize(payload));
    } else if (providerType == 'Google_Gemini') {
      req.setEndpoint(
        'callout:' + namedCred + '/v1beta/models/' + model + ':generateContent'
      );

      Map<String, Object> payload = new Map<String, Object>{
        'contents' => new List<Object>{
          new Map<String, Object>{
            'parts' => new List<Object>{
              new Map<String, Object>{
                'text' => systemPrompt +
                '\n\n' +
                userPrompt
              }
            }
          }
        }
      };
      req.setBody(JSON.serialize(payload));
    } else {
      // OpenAI-compatible default
      req.setEndpoint('callout:' + namedCred + '/v1/chat/completions');

      List<Map<String, String>> messages = new List<Map<String, String>>{
        new Map<String, String>{ 'role' => 'system', 'content' => systemPrompt }
      };

      // Add conversation history if present
      if (String.isNotBlank(historyJson)) {
        try {
          List<Object> histList = (List<Object>) JSON.deserializeUntyped(
            historyJson
          );
          for (Object hObj : histList) {
            Map<String, Object> hMap = (Map<String, Object>) hObj;
            String role = (Boolean) hMap.get('isAssistant')
              ? 'assistant'
              : 'user';
            messages.add(
              new Map<String, String>{
                'role' => role,
                'content' => (String) hMap.get('text')
              }
            );
          }
        } catch (Exception parseEx) {
          SmartGridTelemetryService.publishTelemetry(
            'ai_history_parse',
            'ConversationHistory',
            0,
            0,
            null,
            'Ignored invalid history JSON format: ' + parseEx.getMessage()
          );
        }
      }

      messages.add(
        new Map<String, String>{ 'role' => 'user', 'content' => userPrompt }
      );

      Map<String, Object> payload = new Map<String, Object>{
        'model' => model,
        'messages' => messages,
        'temperature' => 0.1,
        'max_tokens' => maxTokens
      };
      req.setBody(JSON.serialize(payload));
    }

    Http http = new Http();
    HttpResponse res = http.send(req);

    if (res.getStatusCode() == 200) {
      Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(
        res.getBody()
      );

      if (providerType == 'Anthropic') {
        List<Object> content = (List<Object>) body.get('content');
        if (content != null && !content.isEmpty()) {
          Map<String, Object> firstContent = (Map<String, Object>) content[0];
          return (String) firstContent.get('text');
        }
      } else if (providerType == 'Google_Gemini') {
        List<Object> candidates = (List<Object>) body.get('candidates');
        if (candidates != null && !candidates.isEmpty()) {
          Map<String, Object> firstCand = (Map<String, Object>) candidates[0];
          Map<String, Object> cMap = (Map<String, Object>) firstCand.get(
            'content'
          );
          List<Object> parts = (List<Object>) cMap.get('parts');
          if (parts != null && !parts.isEmpty()) {
            Map<String, Object> firstPart = (Map<String, Object>) parts[0];
            return (String) firstPart.get('text');
          }
        }
      } else {
        List<Object> choices = (List<Object>) body.get('choices');
        if (choices != null && !choices.isEmpty()) {
          Map<String, Object> firstChoice = (Map<String, Object>) choices[0];
          Map<String, Object> msg = (Map<String, Object>) firstChoice.get(
            'message'
          );
          return (String) msg.get('content');
        }
      }
    }

    throw new CalloutException(
      'HTTP ' + res.getStatusCode() + ': ' + res.getStatus()
    );
  }

  private String cleanMarkdownJson(String text) {
    String clean = text.trim();
    if (clean.startsWith('```json')) {
      clean = clean.substring(7);
    } else if (clean.startsWith('```')) {
      clean = clean.substring(3);
    }
    if (clean.endsWith('```')) {
      clean = clean.substring(0, clean.length() - 3);
    }
    return clean.trim();
  }
}

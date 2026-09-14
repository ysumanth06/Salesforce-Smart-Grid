/**
 * @description External BYO-LLM Provider for Smart Grid.
 * Sends prompts via Salesforce Named Credentials to OpenAI, Anthropic, Google Gemini,
 * or private vLLM endpoints, returning structured JSON filter definitions.
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

    String namedCred = (config != null &&
      String.isNotBlank(config.Named_Credential__c))
      ? config.Named_Credential__c
      : 'Smart_Grid_LLM_Endpoint';

    String systemPrompt =
      'You are a Salesforce SOQL assistant. Convert the user prompt into a JSON object with schema: ' +
      '{"filters": [{"field": "FieldName", "operator": "=", "value": "Value"}], "sortField": "FieldName", "sortDirection": "ASC", "limit": 50, "explanation": "text"}. ' +
      'Target SObject: ' +
      request.objectApiName +
      '. Available fields: ' +
      String.join(request.availableFields, ', ');

    Map<String, Object> payload = new Map<String, Object>{
      'model' => (config != null &&
        String.isNotBlank(config.Model_Identifier__c))
        ? config.Model_Identifier__c
        : 'gpt-4o-mini',
      'messages' => new List<Map<String, String>>{
        new Map<String, String>{
          'role' => 'system',
          'content' => systemPrompt
        },
        new Map<String, String>{ 'role' => 'user', 'content' => request.prompt }
      },
      'temperature' => 0.1,
      'max_tokens' => (config != null &&
        config.Max_Tokens__c != null)
        ? Integer.valueOf(config.Max_Tokens__c)
        : 500
    };

    try {
      HttpRequest req = new HttpRequest();
      req.setEndpoint('callout:' + namedCred + '/v1/chat/completions');
      req.setMethod('POST');
      req.setHeader('Content-Type', 'application/json');
      req.setBody(JSON.serialize(payload));
      req.setTimeout(15000);

      Http http = new Http();
      HttpResponse res = http.send(req);

      if (res.getStatusCode() == 200) {
        Map<String, Object> responseBody = (Map<String, Object>) JSON.deserializeUntyped(
          res.getBody()
        );
        List<Object> choices = (List<Object>) responseBody.get('choices');
        if (choices != null && !choices.isEmpty()) {
          Map<String, Object> firstChoice = (Map<String, Object>) choices[0];
          Map<String, Object> message = (Map<String, Object>) firstChoice.get(
            'message'
          );
          String content = (String) message.get('content');

          // Parse JSON inside LLM content (strip possible markdown backticks)
          String cleanJson = content.trim();
          if (cleanJson.startsWith('```json')) {
            cleanJson = cleanJson.substring(7);
          } else if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.substring(3);
          }
          if (cleanJson.endsWith('```')) {
            cleanJson = cleanJson.substring(0, cleanJson.length() - 3);
          }
          cleanJson = cleanJson.trim();

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
          result.errorMessage = 'External LLM returned an empty choices payload.';
        }
      } else {
        result.errorMessage =
          'External LLM callout returned HTTP status ' +
          res.getStatusCode() +
          ': ' +
          res.getStatus();
      }
    } catch (Exception ex) {
      // In test context or unconfigured credentials, return informative error
      result.isSuccess = false;
      result.errorMessage = 'External LLM callout failed: ' + ex.getMessage();
    }

    return result;
  }

  public SmartGridNLPEngine.AssistantResult answerQuestion(
    SmartGridNLPEngine.AssistantRequest request
  ) {
    SmartGridNLPEngine.AssistantResult res = new SmartGridNLPEngine.AssistantResult();
    String namedCred = (config != null &&
      String.isNotBlank(config.Named_Credential__c))
      ? config.Named_Credential__c
      : 'Smart_Grid_LLM_Endpoint';

    Map<String, Object> payload = new Map<String, Object>{
      'model' => (config != null &&
        String.isNotBlank(config.Model_Identifier__c))
        ? config.Model_Identifier__c
        : 'gpt-4o-mini',
      'messages' => new List<Map<String, String>>{
        new Map<String, String>{
          'role' => 'system',
          'content' => 'You are an intelligent data assistant analyzing ' +
          request.objectApiName +
          ' records in Salesforce Smart Grid.'
        },
        new Map<String, String>{
          'role' => 'user',
          'content' => request.question
        }
      },
      'temperature' => 0.3
    };

    try {
      HttpRequest req = new HttpRequest();
      req.setEndpoint('callout:' + namedCred + '/v1/chat/completions');
      req.setMethod('POST');
      req.setHeader('Content-Type', 'application/json');
      req.setBody(JSON.serialize(payload));
      req.setTimeout(15000);

      Http http = new Http();
      HttpResponse resHttp = http.send(req);

      if (resHttp.getStatusCode() == 200) {
        Map<String, Object> responseBody = (Map<String, Object>) JSON.deserializeUntyped(
          resHttp.getBody()
        );
        List<Object> choices = (List<Object>) responseBody.get('choices');
        if (choices != null && !choices.isEmpty()) {
          Map<String, Object> firstChoice = (Map<String, Object>) choices[0];
          Map<String, Object> message = (Map<String, Object>) firstChoice.get(
            'message'
          );
          res.answer = (String) message.get('content');
          res.isSuccess = true;
        }
      } else {
        res.errorMessage =
          'Assistant HTTP callout error: ' + resHttp.getStatusCode();
      }
    } catch (Exception ex) {
      res.isSuccess = false;
      res.errorMessage = 'Assistant callout failed: ' + ex.getMessage();
    }

    return res;
  }
}

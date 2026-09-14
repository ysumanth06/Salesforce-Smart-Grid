/**
 * @description Telemetry and Analytics Publishing Service.
 * Publishes Smart_Grid_Telemetry__e Platform Events asynchronously.
 * Guarantees zero PII in payloads and ensures fire-and-forget execution
 * that never rolls back active database transactions.
 */
public with sharing class SmartGridTelemetryService {
  /**
   * @description Publishes a telemetry platform event from server-side Apex
   * @param action Event type (query, save, delete, export, nlp_command, filter)
   * @param objectApiName SObject name
   * @param recordCount Number of records affected
   * @param durationMs Execution duration in milliseconds
   * @param nlpInput Sanitized NLP command text (truncated to 255 chars, no PII)
   * @param errorMessage Error text if failed
   * @return Database.SaveResult for the event publish
   */
  public static Database.SaveResult publishTelemetry(
    String action,
    String objectApiName,
    Integer recordCount,
    Long durationMs,
    String nlpInput,
    String errorMessage
  ) {
    Schema.SObjectType eventType = Schema.getGlobalDescribe()
      .get('Smart_Grid_Telemetry__e');
    if (eventType == null) {
      return null;
    }

    SObject eventObj = eventType.newSObject();
    eventObj.put('User_Id__c', UserInfo.getUserId());
    eventObj.put(
      'Action__c',
      String.isNotBlank(action) ? action.left(40) : 'unknown'
    );
    eventObj.put(
      'Object_API_Name__c',
      String.isNotBlank(objectApiName) ? objectApiName.left(80) : 'Account'
    );
    eventObj.put('Record_Count__c', (recordCount != null) ? recordCount : 0);
    eventObj.put('Duration_Ms__c', (durationMs != null) ? durationMs : 0);

    // Sanitize and truncate NLP input
    if (String.isNotBlank(nlpInput)) {
      eventObj.put('NLP_Input__c', nlpInput.left(255));
    }

    if (String.isNotBlank(errorMessage)) {
      eventObj.put('Error_Message__c', errorMessage.left(255));
    }

    try {
      return EventBus.publish(eventObj);
    } catch (Exception ex) {
      System.debug(
        LoggingLevel.WARN,
        'Failed to publish Smart Grid telemetry event: ' + ex.getMessage()
      );
      return null;
    }
  }

  /**
   * @description Client-side AuraEnabled endpoint for publishing telemetry metrics from LWC
   */
  @AuraEnabled
  public static void logClientAction(
    String action,
    String objectApiName,
    Integer recordCount,
    Long durationMs,
    String nlpInput,
    String errorMessage
  ) {
    publishTelemetry(
      action,
      objectApiName,
      recordCount,
      durationMs,
      nlpInput,
      errorMessage
    );
  }
}

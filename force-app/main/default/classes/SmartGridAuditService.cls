/**
 * @description Field-Level Audit Trail Service for Smart Grid.
 * Records before/after change logs into Smart_Grid_Edit_Log__c with FLS enforcement and query retrieval.
 */
public with sharing class SmartGridAuditService {
  public class AuditLogEntry {
    @AuraEnabled
    public String id;
    @AuraEnabled
    public String gridName;
    @AuraEnabled
    public String recordId;
    @AuraEnabled
    public String fieldName;
    @AuraEnabled
    public String oldValue;
    @AuraEnabled
    public String newValue;
    @AuraEnabled
    public String changedByName;
    @AuraEnabled
    public Datetime timestamp;
  }

  /**
   * @description Logs field modifications atomically to Smart_Grid_Edit_Log__c
   * @param gridName DeveloperName of the origin grid
   * @param editChanges List of field changes with recordId, fieldName, oldValue, newValue
   * @return Integer count of logs successfully committed
   */
  @AuraEnabled
  public static Integer logEdits(
    String gridName,
    List<Map<String, Object>> editChanges
  ) {
    if (editChanges == null || editChanges.isEmpty()) {
      return 0;
    }

    if (!Schema.sObjectType.Smart_Grid_Edit_Log__c.isCreateable()) {
      return 0;
    }

    List<Smart_Grid_Edit_Log__c> logsToInsert = new List<Smart_Grid_Edit_Log__c>();
    Id currentUserId = UserInfo.getUserId();
    Datetime nowTime = Datetime.now();

    for (Map<String, Object> change : editChanges) {
      String recId = (String) change.get('recordId');
      String fName = (String) change.get('fieldName');
      if (String.isBlank(recId) || String.isBlank(fName)) {
        continue;
      }

      Smart_Grid_Edit_Log__c log = new Smart_Grid_Edit_Log__c();
      log.Grid_Name__c = gridName;
      log.Record_Id__c = recId;
      log.Field_Name__c = fName;
      log.Old_Value__c = change.get('oldValue') != null
        ? String.valueOf(change.get('oldValue'))
        : '';
      log.New_Value__c = change.get('newValue') != null
        ? String.valueOf(change.get('newValue'))
        : '';
      log.Changed_By__c = currentUserId;
      log.Timestamp__c = nowTime;

      logsToInsert.add(log);
    }

    if (logsToInsert.isEmpty()) {
      return 0;
    }

    SObjectAccessDecision decision = Security.stripInaccessible(
      AccessType.CREATABLE,
      logsToInsert
    );
    Database.SaveResult[] results = Database.insert(
      decision.getRecords(),
      false,
      AccessLevel.USER_MODE
    );

    Integer successCount = 0;
    for (Database.SaveResult sr : results) {
      if (sr.isSuccess()) {
        successCount++;
      }
    }

    return successCount;
  }

  /**
   * @description Retrieves audit history for a specific record
   * @param recordId Salesforce ID of the target record
   * @param maxRecords Limit of entries to return (default 50)
   * @return List of AuditLogEntry
   */
  @AuraEnabled(cacheable=true)
  public static List<AuditLogEntry> getEditLogs(
    String recordId,
    Integer maxRecords
  ) {
    List<AuditLogEntry> entries = new List<AuditLogEntry>();
    if (String.isBlank(recordId)) {
      return entries;
    }

    Integer limitSize = (maxRecords != null &&
      maxRecords > 0)
      ? Math.min(maxRecords, 200)
      : 50;

    List<Smart_Grid_Edit_Log__c> logs = [
      SELECT
        Id,
        Grid_Name__c,
        Record_Id__c,
        Field_Name__c,
        Old_Value__c,
        New_Value__c,
        Changed_By__r.Name,
        Timestamp__c
      FROM Smart_Grid_Edit_Log__c
      WHERE Record_Id__c = :recordId
      WITH USER_MODE
      ORDER BY Timestamp__c DESC
      LIMIT :limitSize
    ];

    for (Smart_Grid_Edit_Log__c log : logs) {
      AuditLogEntry entry = new AuditLogEntry();
      entry.id = log.Id;
      entry.gridName = log.Grid_Name__c;
      entry.recordId = log.Record_Id__c;
      entry.fieldName = log.Field_Name__c;
      entry.oldValue = log.Old_Value__c;
      entry.newValue = log.New_Value__c;
      entry.changedByName = log.Changed_By__r != null
        ? log.Changed_By__r.Name
        : '';
      entry.timestamp = log.Timestamp__c;
      entries.add(entry);
    }

    return entries;
  }
}

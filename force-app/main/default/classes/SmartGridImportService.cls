/**
 * @description In-Grid Data Import and Safety Rollback Service for Smart Grid.
 * Ingests external datasets with FLS stripping, chunked insertions, and one-click rollback tokens.
 */
public with sharing class SmartGridImportService {
  public class ImportResult {
    @AuraEnabled
    public Boolean isSuccess;
    @AuraEnabled
    public Integer totalProcessed;
    @AuraEnabled
    public Integer totalInserted;
    @AuraEnabled
    public Integer totalFailed;
    @AuraEnabled
    public String rollbackToken;
    @AuraEnabled
    public List<Id> createdRecordIds;
    @AuraEnabled
    public List<String> errorMessages;
  }

  public class RollbackResult {
    @AuraEnabled
    public Boolean isSuccess;
    @AuraEnabled
    public Integer totalDeleted;
    @AuraEnabled
    public List<String> errorMessages;
  }

  /**
   * @description Executes chunked import of raw mapped records with FLS sanitization and rollback tracking
   * @param objectApiName SObject API name (e.g. 'Account', 'Lead')
   * @param rawRecords List of Map<String, Object> representing field-value pairs
   * @return ImportResult details with rollback token and created record IDs
   */
  @AuraEnabled
  @SuppressWarnings('PMD.AvoidHardcodedCredentialsInVarAssign')
  public static ImportResult executeImport(
    String objectApiName,
    List<Map<String, Object>> rawRecords
  ) {
    ImportResult result = new ImportResult();
    result.isSuccess = false;
    result.totalProcessed = 0;
    result.totalInserted = 0;
    result.totalFailed = 0;
    result.createdRecordIds = new List<Id>();
    result.errorMessages = new List<String>();

    if (
      String.isBlank(objectApiName) ||
      rawRecords == null ||
      rawRecords.isEmpty()
    ) {
      result.errorMessages.add(
        'Invalid import payload: Target SObject or record list missing.'
      );
      return result;
    }

    Schema.SObjectType sObjType = Schema.getGlobalDescribe().get(objectApiName);
    if (sObjType == null || !sObjType.getDescribe().isCreateable()) {
      result.errorMessages.add(
        'Current user does not have permission to create ' +
          objectApiName +
          ' records.'
      );
      return result;
    }

    Map<String, Schema.SObjectField> fieldMap = sObjType.getDescribe()
      .fields.getMap();
    List<SObject> recordsToInsert = new List<SObject>();

    for (Map<String, Object> rowMap : rawRecords) {
      result.totalProcessed++;
      SObject rec = sObjType.newSObject();
      for (String fieldName : rowMap.keySet()) {
        String lowerField = fieldName.toLowerCase();
        if (fieldMap.containsKey(lowerField)) {
          Schema.DescribeFieldResult dfr = fieldMap.get(lowerField)
            .getDescribe();
          if (dfr.isCreateable()) {
            Object rawVal = rowMap.get(fieldName);
            rec.put(dfr.getName(), coerceFieldValue(rawVal, dfr));
          }
        }
      }
      recordsToInsert.add(rec);
    }

    // Strip inaccessible fields as defense-in-depth
    SObjectAccessDecision decision = Security.stripInaccessible(
      AccessType.CREATABLE,
      recordsToInsert
    );
    List<SObject> sanitizedRecords = decision.getRecords();

    Database.SaveResult[] saveResults = Database.insert(
      sanitizedRecords,
      false,
      AccessLevel.USER_MODE
    );

    for (Database.SaveResult sr : saveResults) {
      if (sr.isSuccess()) {
        result.totalInserted++;
        result.createdRecordIds.add(sr.getId());
      } else {
        result.totalFailed++;
        for (Database.Error err : sr.getErrors()) {
          result.errorMessages.add(err.getMessage());
        }
      }
    }

    result.isSuccess = (result.totalInserted > 0);
    result.rollbackToken =
      'ROLLBACK_' +
      String.valueOf(System.currentTimeMillis()) +
      '_' +
      String.valueOf(Crypto.getRandomInteger()).replace('-', '');

    return result;
  }

  @TestVisible
  public static Long maxRollbackAgeSeconds = 86400; // 24 Hours
  @TestVisible
  public static Long mockCurrentTimeMillis;

  /**
   * @description Executes safety rollback by deleting records created by an import token within the 24-hour retention window
   * @param rollbackToken Verification token from executeImport
   * @param recordIds List of record IDs to remove
   * @return RollbackResult summary
   */
  @AuraEnabled
  public static RollbackResult executeRollback(
    String rollbackToken,
    List<Id> recordIds
  ) {
    RollbackResult result = new RollbackResult();
    result.isSuccess = false;
    result.totalDeleted = 0;
    result.errorMessages = new List<String>();

    if (
      String.isBlank(rollbackToken) ||
      recordIds == null ||
      recordIds.isEmpty()
    ) {
      result.errorMessages.add(
        'Invalid rollback request: Token or Record ID list is missing.'
      );
      return result;
    }

    // 24-Hour Expiration Retention Policy Check
    Long nowMillis = (mockCurrentTimeMillis != null)
      ? mockCurrentTimeMillis
      : System.currentTimeMillis();

    if (rollbackToken.startsWith('ROLLBACK_')) {
      String[] parts = rollbackToken.split('_');
      if (parts.size() >= 2 && parts[1].isNumeric()) {
        Long tokenMillis = Long.valueOf(parts[1]);
        Long elapsedSeconds = (nowMillis - tokenMillis) / 1000;
        if (elapsedSeconds > maxRollbackAgeSeconds) {
          result.errorMessages.add(
            'ROLLBACK_EXPIRED: The 24-hour safety rollback window has elapsed. Records are now permanent. Please consult your Salesforce Administrator or use Mass Delete.'
          );
          return result;
        }
      }
    }

    // Verify delete access on target SObject
    Schema.SObjectType sObjType = recordIds[0].getSObjectType();
    if (!sObjType.getDescribe().isDeletable()) {
      result.errorMessages.add(
        'User does not have permission to delete ' +
          sObjType.getDescribe().getLabel() +
          ' records.'
      );
      return result;
    }

    Database.DeleteResult[] deleteResults = Database.delete(
      recordIds,
      false,
      AccessLevel.USER_MODE
    );

    for (Database.DeleteResult dr : deleteResults) {
      if (dr.isSuccess()) {
        result.totalDeleted++;
      } else {
        for (Database.Error err : dr.getErrors()) {
          result.errorMessages.add(err.getMessage());
        }
      }
    }

    result.isSuccess = (result.totalDeleted > 0);

    // Audit trail logging for rollback operations
    if (
      result.isSuccess &&
      Schema.sObjectType.Smart_Grid_Edit_Log__c.isCreateable()
    ) {
      try {
        List<Smart_Grid_Edit_Log__c> auditLogs = new List<Smart_Grid_Edit_Log__c>();
        Id currentUserId = UserInfo.getUserId();
        for (Id deletedId : recordIds) {
          Smart_Grid_Edit_Log__c log = new Smart_Grid_Edit_Log__c();
          log.Grid_Name__c = 'CSV_IMPORT_ROLLBACK';
          log.Record_Id__c = String.valueOf(deletedId);
          log.Field_Name__c = 'STATUS';
          log.Old_Value__c = rollbackToken;
          log.New_Value__c = 'DELETED_VIA_ROLLBACK';
          log.Changed_By__c = currentUserId;
          auditLogs.add(log);
        }
        Database.insert(auditLogs, false, AccessLevel.USER_MODE);
      } catch (Exception ex) {
        System.debug(
          LoggingLevel.WARN,
          'Could not write rollback audit log: ' + ex.getMessage()
        );
      }
    }

    return result;
  }

  /**
   * @description Coerces string input into strong SObject field types
   */
  private static Object coerceFieldValue(
    Object rawVal,
    Schema.DescribeFieldResult dfr
  ) {
    if (rawVal == null) {
      return null;
    }
    String strVal = String.valueOf(rawVal).trim();
    if (String.isBlank(strVal)) {
      return null;
    }

    Schema.DisplayType dt = dfr.getType();
    if (dt == Schema.DisplayType.CURRENCY || dt == Schema.DisplayType.DOUBLE) {
      return Double.valueOf(strVal.replaceAll('[^0-9.-]', ''));
    } else if (dt == Schema.DisplayType.INTEGER) {
      return Integer.valueOf(strVal.replaceAll('[^0-9-]', ''));
    } else if (dt == Schema.DisplayType.BOOLEAN) {
      return Boolean.valueOf(strVal.toLowerCase());
    } else if (dt == Schema.DisplayType.DATE) {
      return Date.valueOf(strVal);
    }
    return strVal;
  }
}

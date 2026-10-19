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
      'ROLLBACK_' + String.valueOf(Crypto.getRandomInteger()).replace('-', '');

    return result;
  }

  /**
   * @description Executes safety rollback by deleting records created by an import token
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

/**
 * @description Safe Natural Language Bulk DML Preview and Execution Service.
 * Parses natural language update and delete instructions, produces visual diff previews,
 * and enforces strict FLS and CRUD checks via Security.stripInaccessible().
 */
public with sharing class SmartGridNLPDMLHandler {
  public class FieldChangeDiff {
    @AuraEnabled
    public String fieldName { get; set; }
    @AuraEnabled
    public Object oldValue { get; set; }
    @AuraEnabled
    public Object newValue { get; set; }

    public FieldChangeDiff(String fieldName, Object oldValue, Object newValue) {
      this.fieldName = fieldName;
      this.oldValue = oldValue;
      this.newValue = newValue;
    }
  }

  public class DmlRowDiff {
    @AuraEnabled
    public Id recordId { get; set; }
    @AuraEnabled
    public String recordName { get; set; }
    @AuraEnabled
    public List<FieldChangeDiff> changes { get; set; }

    public DmlRowDiff(Id recordId, String recordName) {
      this.recordId = recordId;
      this.recordName = recordName;
      this.changes = new List<FieldChangeDiff>();
    }
  }

  public class DmlPreviewResult {
    @AuraEnabled
    public Boolean isSuccess { get; set; }
    @AuraEnabled
    public String operation { get; set; } // UPDATE or DELETE
    @AuraEnabled
    public String targetObject { get; set; }
    @AuraEnabled
    public Integer totalAffectedRecords { get; set; }
    @AuraEnabled
    public List<String> affectedFieldNames { get; set; }
    @AuraEnabled
    public List<DmlRowDiff> previewRows { get; set; }
    @AuraEnabled
    public List<Id> recordIds { get; set; }
    @AuraEnabled
    public String fieldUpdatesJson { get; set; }
    @AuraEnabled
    public String explanation { get; set; }
    @AuraEnabled
    public String errorMessage { get; set; }

    public DmlPreviewResult() {
      this.isSuccess = false;
      this.affectedFieldNames = new List<String>();
      this.previewRows = new List<DmlRowDiff>();
      this.recordIds = new List<Id>();
    }
  }

  public class DmlExecutionResult {
    @AuraEnabled
    public Boolean isSuccess { get; set; }
    @AuraEnabled
    public Integer successCount { get; set; }
    @AuraEnabled
    public Integer failureCount { get; set; }
    @AuraEnabled
    public List<String> errorMessages { get; set; }

    public DmlExecutionResult() {
      this.isSuccess = false;
      this.successCount = 0;
      this.failureCount = 0;
      this.errorMessages = new List<String>();
    }
  }

  /**
   * @description Analyzes a natural language command and generates a DML preview diff
   * @param prompt Natural language command (e.g. "Set Rating to Hot for selected rows")
   * @param objectApiName Target SObject name
   * @param selectedRecordIds List of IDs explicitly selected in the grid
   * @param activeFilterJson Active filter expression JSON if operating on filtered dataset
   * @return DmlPreviewResult containing before/after preview rows and affected counts
   */
  @AuraEnabled
  @SuppressWarnings('PMD.ApexSOQLInjection')
  public static DmlPreviewResult previewDML(
    String prompt,
    String objectApiName,
    List<Id> selectedRecordIds,
    String activeFilterJson
  ) {
    DmlPreviewResult preview = new DmlPreviewResult();
    if (String.isBlank(prompt)) {
      preview.errorMessage = 'Command prompt cannot be blank.';
      return preview;
    }

    String sObjName = String.isBlank(objectApiName) ? 'Account' : objectApiName;
    preview.targetObject = sObjName;

    SObjectType sType = Schema.getGlobalDescribe().get(sObjName);
    if (sType == null || !sType.getDescribe().isAccessible()) {
      preview.errorMessage = 'Target object is inaccessible: ' + sObjName;
      return preview;
    }

    String lowerPrompt = prompt.toLowerCase();
    Map<String, Object> fieldUpdates = new Map<String, Object>();

    if (
      lowerPrompt.contains('delete') || lowerPrompt.contains('remove selected')
    ) {
      preview.operation = 'DELETE';
      preview.explanation = 'Delete selected records from ' + sObjName;
    } else {
      preview.operation = 'UPDATE';
      Pattern updatePattern = Pattern.compile(
        '(?i)set\\s+([a-zA-Z0-9_]+)\\s+(?:to|=)\\s*[\'"]?([^\'"\r\n]+)[\'"]?'
      );
      Matcher updateMatcher = updatePattern.matcher(prompt);
      while (updateMatcher.find()) {
        String field = updateMatcher.group(1).trim();
        String val = updateMatcher.group(2).trim();
        val = val.replaceAll(
            '(?i)\\s+(?:for|on)\\s+(?:selected|these|all).*$',
            ''
          )
          .trim();
        val = val.replaceAll('^[\'"]|[\'"]$', '');

        // Match case-insensitive field on object describe
        Map<String, SObjectField> fieldMap = sType.getDescribe()
          .fields.getMap();
        String matchedFieldName = null;
        for (String fKey : fieldMap.keySet()) {
          if (fKey.equalsIgnoreCase(field)) {
            matchedFieldName = fieldMap.get(fKey).getDescribe().getName();
            break;
          }
        }

        if (matchedFieldName != null) {
          fieldUpdates.put(matchedFieldName, val);
          preview.affectedFieldNames.add(matchedFieldName);
        }
      }

      if (fieldUpdates.isEmpty()) {
        preview.errorMessage = 'Could not detect fields to update. Example syntax: "Set Rating to Hot"';
        return preview;
      }
      preview.explanation =
        'Update ' +
        String.join(preview.affectedFieldNames, ', ') +
        ' on ' +
        sObjName;
      preview.fieldUpdatesJson = JSON.serialize(fieldUpdates);
    }

    // Determine target record IDs
    List<Id> targetIds = (selectedRecordIds != null &&
      !selectedRecordIds.isEmpty())
      ? selectedRecordIds
      : new List<Id>();

    if (targetIds.isEmpty()) {
      // Query sample matching records
      String query =
        'SELECT Id, Name FROM ' +
        String.escapeSingleQuotes(sObjName) +
        ' WITH USER_MODE LIMIT 50';
      List<SObject> queried = Database.query(query);
      for (SObject so : queried) {
        targetIds.add(so.Id);
      }
    }

    if (targetIds.isEmpty()) {
      preview.errorMessage = 'No records found to update.';
      return preview;
    }

    preview.totalAffectedRecords = targetIds.size();
    preview.recordIds = targetIds;

    // Build diff preview for first 5 records
    List<Id> previewIds = new List<Id>();
    for (Integer i = 0; i < Math.min(5, targetIds.size()); i++) {
      previewIds.add(targetIds[i]);
    }

    List<String> queryFields = new List<String>{ 'Id', 'Name' };
    queryFields.addAll(preview.affectedFieldNames);
    List<String> escapedQueryFields = new List<String>();
    for (String qf : queryFields) {
      escapedQueryFields.add(String.escapeSingleQuotes(qf));
    }

    String previewQuery =
      'SELECT ' +
      String.join(escapedQueryFields, ', ') +
      ' FROM ' +
      String.escapeSingleQuotes(sObjName) +
      ' WHERE Id IN :previewIds WITH USER_MODE';
    List<SObject> existingRows = Database.query(previewQuery);

    for (SObject row : existingRows) {
      String rName = (String) row.get('Name');
      DmlRowDiff diff = new DmlRowDiff(row.Id, rName);
      if (preview.operation == 'DELETE') {
        diff.changes.add(new FieldChangeDiff('Record', rName, '[DELETED]'));
      } else {
        for (String fName : preview.affectedFieldNames) {
          Object oldVal = row.get(fName);
          Object newVal = fieldUpdates.get(fName);
          diff.changes.add(new FieldChangeDiff(fName, oldVal, newVal));
        }
      }
      preview.previewRows.add(diff);
    }

    preview.isSuccess = true;
    return preview;
  }

  /**
   * @description Executes verified DML updates or deletes enforcing FLS and CRUD
   * @param operation 'UPDATE' or 'DELETE'
   * @param recordIds List of SObject IDs
   * @param fieldUpdatesJson JSON mapping of field names to new values
   * @return DmlExecutionResult summarizing successes and failures
   */
  @AuraEnabled
  public static DmlExecutionResult executeDML(
    String operation,
    List<Id> recordIds,
    String fieldUpdatesJson
  ) {
    DmlExecutionResult result = new DmlExecutionResult();
    if (recordIds == null || recordIds.isEmpty()) {
      result.errorMessages.add('No record IDs supplied for execution.');
      return result;
    }

    Id sampleId = recordIds[0];
    String sObjName = sampleId.getSobjectType().getDescribe().getName();
    SObjectType sType = Schema.getGlobalDescribe().get(sObjName);

    try {
      if (operation == 'DELETE') {
        if (!sType.getDescribe().isDeletable()) {
          result.errorMessages.add(
            'User does not have delete access on ' + sObjName
          );
          return result;
        }
        List<SObject> toDelete = new List<SObject>();
        for (Id rId : recordIds) {
          toDelete.add(sType.newSObject(rId));
        }
        Database.DeleteResult[] deleteResults = Database.delete(
          toDelete,
          false
        );
        for (Database.DeleteResult dr : deleteResults) {
          if (dr.isSuccess()) {
            result.successCount++;
          } else {
            result.failureCount++;
            for (Database.Error err : dr.getErrors()) {
              result.errorMessages.add(err.getMessage());
            }
          }
        }
      } else {
        // UPDATE
        if (!sType.getDescribe().isUpdateable()) {
          result.errorMessages.add(
            'User does not have update access on ' + sObjName
          );
          return result;
        }

        Map<String, Object> updates = (Map<String, Object>) JSON.deserializeUntyped(
          fieldUpdatesJson
        );
        List<SObject> toUpdate = new List<SObject>();
        for (Id rId : recordIds) {
          SObject record = sType.newSObject(rId);
          for (String fName : updates.keySet()) {
            record.put(fName, updates.get(fName));
          }
          toUpdate.add(record);
        }

        SObjectAccessDecision decision = Security.stripInaccessible(
          AccessType.UPDATABLE,
          toUpdate
        );
        Database.SaveResult[] saveResults = Database.update(
          decision.getRecords(),
          false
        );
        for (Database.SaveResult sr : saveResults) {
          if (sr.isSuccess()) {
            result.successCount++;
          } else {
            result.failureCount++;
            for (Database.Error err : sr.getErrors()) {
              result.errorMessages.add(err.getMessage());
            }
          }
        }
      }
      result.isSuccess = (result.failureCount == 0);
    } catch (Exception ex) {
      result.isSuccess = false;
      result.errorMessages.add('DML Execution error: ' + ex.getMessage());
    }

    return result;
  }
}

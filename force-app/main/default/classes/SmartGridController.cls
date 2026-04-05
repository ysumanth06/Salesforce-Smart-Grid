public with sharing class SmartGridController {

    @AuraEnabled(cacheable=true)
    public static Smart_Grid_Config__mdt getGridConfig(String configDevName) {
        if (String.isBlank(configDevName)) {
            return null;
        }
        
        List<Smart_Grid_Config__mdt> configs = [
            SELECT Id, DeveloperName, Object_API_Name__c, Columns_JSON__c, Default_Filter_Field__c, Record_Limit__c, Default_Sort_Field__c, Is_Active__c, Allow_Personalization__c, Use_Advanced_Config__c
            FROM Smart_Grid_Config__mdt
            WHERE DeveloperName = :configDevName
            WITH USER_MODE
            LIMIT 1
        ];
        
        if (!configs.isEmpty() && configs[0].Is_Active__c) {
            return configs[0];
        }
        return null;
    }

    @AuraEnabled(cacheable=true)
    public static List<ColumnInfo> getObjectFields(String objectApiName) {
        List<ColumnInfo> results = new List<ColumnInfo>();
        if (String.isBlank(objectApiName)) return results;
        
        SObjectType sObjType = Schema.getGlobalDescribe().get(objectApiName);
        if (sObjType == null) return results;
        if (!sObjType.getDescribe().isAccessible()) return results;
        
        Map<String, SObjectField> fieldMap = sObjType.getDescribe().fields.getMap();
        for (String fieldName : fieldMap.keySet()) {
            Schema.DescribeFieldResult descResult = fieldMap.get(fieldName).getDescribe();
            if (descResult.isAccessible()) {
                ColumnInfo col = new ColumnInfo();
                col.fieldApiName = descResult.getName();
                col.label = descResult.getLabel();
                col.type = String.valueOf(descResult.getType());
                col.isUpdateable = descResult.isUpdateable();
                results.add(col);
            }
        }
        return results;
    }

    @AuraEnabled
    public static List<SObject> getRecords(String objectApiName, List<String> fields, String filterField, String filterValue, String sortField, Integer recordLimit) {
        if (String.isBlank(objectApiName) || fields == null || fields.isEmpty()) {
            throw new AuraHandledException('Invalid parameters: object api name and fields are required.');
        }

        try {
            GridQueryBuilder.QueryRequest req = new GridQueryBuilder.QueryRequest();
            req.objectApiName = objectApiName;
            req.fields = fields;
            req.filterField = filterField;
            req.filterValue = filterValue;
            req.sortField = sortField;
            req.recordLimit = recordLimit;

            String query = GridQueryBuilder.buildSingleQuery(req);
            
            return Database.query(query);
            
        } catch(Exception e) {
            throw new AuraHandledException('Error fetching records: ' + e.getMessage());
        }
    }

    /**
     * @description Fetches active picklist values for a given field on a given object.
     * Used by the LWC filter combobox to dynamically populate filter options.
     * Validates FLS before returning values.
     * @param objectApiName The SObject API name (e.g. 'Account')
     * @param fieldApiName The picklist field API name (e.g. 'Industry')
     * @return List<PicklistOption> containing label/value pairs
     */
    @AuraEnabled(cacheable=true)
    public static List<PicklistOption> getPicklistValues(String objectApiName, String fieldApiName) {
        List<PicklistOption> options = new List<PicklistOption>();
        
        if (String.isBlank(objectApiName) || String.isBlank(fieldApiName)) {
            return options;
        }

        SObjectType sObjType = Schema.getGlobalDescribe().get(objectApiName);
        if (sObjType == null) {
            throw new AuraHandledException('Invalid object: ' + objectApiName);
        }

        Map<String, SObjectField> fieldMap = sObjType.getDescribe().fields.getMap();
        String lowerFieldName = fieldApiName.toLowerCase();
        
        if (!fieldMap.containsKey(lowerFieldName)) {
            throw new AuraHandledException('Field not found: ' + fieldApiName);
        }

        Schema.DescribeFieldResult fieldDescribe = fieldMap.get(lowerFieldName).getDescribe();
        
        if (!fieldDescribe.isAccessible()) {
            throw new AuraHandledException('Field not accessible: ' + fieldApiName);
        }

        // Only return values for picklist-type fields
        Schema.DisplayType fieldType = fieldDescribe.getType();
        if (fieldType != Schema.DisplayType.PICKLIST && fieldType != Schema.DisplayType.MULTIPICKLIST) {
            throw new AuraHandledException('Field is not a picklist: ' + fieldApiName);
        }

        for (Schema.PicklistEntry entry : fieldDescribe.getPicklistValues()) {
            if (entry.isActive()) {
                PicklistOption opt = new PicklistOption();
                opt.label = entry.getLabel();
                opt.value = entry.getValue();
                options.add(opt);
            }
        }
        
        return options;
    }

    @AuraEnabled
    public static SaveResult saveRecords(List<SObject> records) {
        SaveResult result = new SaveResult();
        if (records == null || records.isEmpty()) {
            result.isSuccess = true;
            return result;
        }
        
        // Strip out inaccessible fields to prevent unauthorized DML
        SObjectAccessDecision securityDecision = Security.stripInaccessible(AccessType.UPDATABLE, records);
        List<SObject> safeRecords = securityDecision.getRecords();

        Database.SaveResult[] saveResults = Database.update(safeRecords, false);
        
        result.isSuccess = true;
        for (Integer i = 0; i < saveResults.size(); i++) {
            Database.SaveResult sr = saveResults[i];
            if (!sr.isSuccess()) {
                result.isSuccess = false;
                RowError re = new RowError();
                re.id = (String)safeRecords[i].get('Id');
                re.title = 'Error';
                re.messages = new List<String>();
                re.fieldNames = new List<String>();
                
                for(Database.Error err : sr.getErrors()) {
                    re.messages.add(err.getMessage());
                    if (err.getFields() != null) {
                        for(String f : err.getFields()) {
                            re.fieldNames.add(f);
                        }
                    }
                    result.tableErrors.add('Row ' + re.id + ': ' + err.getMessage());
                }
                result.rowErrors.add(re);
            }
        }
        
        return result;
    }

    public class ColumnInfo {
        @AuraEnabled public String fieldApiName;
        @AuraEnabled public String label;
        @AuraEnabled public String type;
        @AuraEnabled public Boolean isUpdateable;
    }

    public class RowError {
        @AuraEnabled public String id;
        @AuraEnabled public String title;
        @AuraEnabled public List<String> messages;
        @AuraEnabled public List<String> fieldNames;
    }

    public class SaveResult {
        @AuraEnabled public Boolean isSuccess = true;
        @AuraEnabled public List<RowError> rowErrors = new List<RowError>();
        @AuraEnabled public List<String> tableErrors = new List<String>();
    }

    public class PicklistOption {
        @AuraEnabled public String label;
        @AuraEnabled public String value;
    }
}

public with sharing class SmartGridController {

    @TestVisible
    private static List<Smart_Grid_Config__mdt> mockConfigs;

    @AuraEnabled(cacheable=true)
    public static GridConfigDTO getGridConfig(String configDevName) {
        if (String.isBlank(configDevName)) {
            return null;
        }
        
        List<Smart_Grid_Config__mdt> configs;
        
        if (Test.isRunningTest() && mockConfigs != null) {
            configs = mockConfigs;
        } else {
            configs = [
                SELECT Id, DeveloperName, Object_API_Name__c, Columns_JSON__c, Default_Filter_Field__c, Record_Limit__c, Default_Sort_Field__c, Is_Active__c, Allow_Personalization__c, Use_Advanced_Config__c,
                    (SELECT Id, Field_API_Name__c, Display_Label__c, Order__c, Is_Editable__c, Column_Width__c, Is_Sortable__c 
                     FROM Smart_Grid_Columns__r 
                     ORDER BY Order__c ASC)
                FROM Smart_Grid_Config__mdt
                WHERE DeveloperName = :configDevName
                WITH USER_MODE
                LIMIT 1
            ];
        }
        
        if (!configs.isEmpty() && configs[0].Is_Active__c) {
            Smart_Grid_Config__mdt conf = configs[0];
            GridConfigDTO dto = new GridConfigDTO();
            dto.id = conf.Id;
            dto.developerName = conf.DeveloperName;
            dto.objectApiName = conf.Object_API_Name__c;
            dto.defaultFilterField = conf.Default_Filter_Field__c;
            dto.recordLimit = conf.Record_Limit__c;
            dto.defaultSortField = conf.Default_Sort_Field__c;
            dto.isActive = conf.Is_Active__c;
            dto.allowPersonalization = conf.Allow_Personalization__c;
            dto.useAdvancedConfig = conf.Use_Advanced_Config__c;
            dto.columns = new List<ColumnDTO>();

            if (conf.Use_Advanced_Config__c == true) {
                // Relational columns
                if (conf.Smart_Grid_Columns__r != null) {
                    for (Smart_Grid_Column__mdt col : conf.Smart_Grid_Columns__r) {
                        ColumnDTO c = new ColumnDTO();
                        c.fieldApiName = col.Field_API_Name__c;
                        c.displayLabel = col.Display_Label__c;
                        c.order = col.Order__c;
                        c.isEditable = col.Is_Editable__c;
                        c.columnWidth = col.Column_Width__c;
                        c.isSortable = col.Is_Sortable__c;
                        dto.columns.add(c);
                    }
                }
            } else if (String.isNotBlank(conf.Columns_JSON__c)) {
                // JSON columns
                try {
                    List<JsonColumn> parsedCols = (List<JsonColumn>)JSON.deserialize(conf.Columns_JSON__c, List<JsonColumn>.class);
                    for (JsonColumn jc : parsedCols) {
                        ColumnDTO c = new ColumnDTO();
                        c.fieldApiName = jc.field;
                        c.displayLabel = jc.label != null ? jc.label : jc.field;
                        c.order = jc.order;
                        c.isEditable = jc.editable;
                        c.columnWidth = jc.width;
                        c.isSortable = jc.sortable != null ? jc.sortable : false;
                        dto.columns.add(c);
                    }
                } catch (Exception e) {
                    // Ignore JSON parsing errors and return an empty column list
                }
            }

            return dto;
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

    public class JsonColumn {
        public String field;
        public String label;
        public Decimal order;
        public Boolean editable;
        public Decimal width;
        public Boolean sortable;
    }

    public class GridConfigDTO {
        @AuraEnabled public String id;
        @AuraEnabled public String developerName;
        @AuraEnabled public String objectApiName;
        @AuraEnabled public String defaultFilterField;
        @AuraEnabled public Decimal recordLimit;
        @AuraEnabled public String defaultSortField;
        @AuraEnabled public Boolean isActive;
        @AuraEnabled public Boolean allowPersonalization;
        @AuraEnabled public Boolean useAdvancedConfig;
        @AuraEnabled public List<ColumnDTO> columns;
    }

    public class ColumnDTO {
        @AuraEnabled public String fieldApiName;
        @AuraEnabled public String displayLabel;
        @AuraEnabled public Decimal order;
        @AuraEnabled public Boolean isEditable;
        @AuraEnabled public Decimal columnWidth;
        @AuraEnabled public Boolean isSortable;
    }
}

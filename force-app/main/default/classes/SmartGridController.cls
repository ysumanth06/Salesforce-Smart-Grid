public with sharing class SmartGridController {
  @TestVisible
  private static List<Smart_Grid_Config__mdt> mockConfigs;

  /**
   * @description Fetches the grid configuration custom metadata record by its developer name.
   * Supports both JSON column definitions and relational Smart_Grid_Column__mdt child records.
   * @param configDevName The DeveloperName of the Smart_Grid_Config__mdt record
   * @return GridConfigDTO containing object details, active status, and parsed columns
   */
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
        SELECT
          Id,
          DeveloperName,
          Object_API_Name__c,
          Columns_JSON__c,
          Default_Filter_Field__c,
          Record_Limit__c,
          Default_Sort_Field__c,
          Is_Active__c,
          Allow_Personalization__c,
          Use_Advanced_Config__c,
          Enable_Add_Row__c,
          Enable_Delete__c,
          Enable_Export__c,
          Enable_Filters__c,
          Enable_Reading_Pane__c,
          Totals_Fields_JSON__c,
          Related_Object__c,
          (
            SELECT
              Id,
              Field_API_Name__c,
              Display_Label__c,
              Order__c,
              Is_Editable__c,
              Column_Width__c,
              Is_Sortable__c
            FROM Smart_Grid_Columns__r
            ORDER BY Order__c ASC
          )
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
      dto.enableAddRow = (conf.isSet(
          Smart_Grid_Config__mdt.Enable_Add_Row__c
        ) && conf.get('Enable_Add_Row__c') != null)
        ? (Boolean) conf.get('Enable_Add_Row__c')
        : true;
      dto.enableDelete = (conf.isSet(Smart_Grid_Config__mdt.Enable_Delete__c) &&
        conf.get('Enable_Delete__c') != null)
        ? (Boolean) conf.get('Enable_Delete__c')
        : true;
      dto.enableExport = (conf.isSet(Smart_Grid_Config__mdt.Enable_Export__c) &&
        conf.get('Enable_Export__c') != null)
        ? (Boolean) conf.get('Enable_Export__c')
        : true;
      dto.enableFilters = (conf.isSet(
          Smart_Grid_Config__mdt.Enable_Filters__c
        ) && conf.get('Enable_Filters__c') != null)
        ? (Boolean) conf.get('Enable_Filters__c')
        : true;
      dto.enableReadingPane = (conf.isSet(
          Smart_Grid_Config__mdt.Enable_Reading_Pane__c
        ) && conf.get('Enable_Reading_Pane__c') != null)
        ? (Boolean) conf.get('Enable_Reading_Pane__c')
        : false;
      dto.totalsFieldsJson = conf.isSet(
          Smart_Grid_Config__mdt.Totals_Fields_JSON__c
        )
        ? conf.Totals_Fields_JSON__c
        : null;
      dto.relatedObject = conf.isSet(Smart_Grid_Config__mdt.Related_Object__c)
        ? conf.Related_Object__c
        : null;
      dto.columns = new List<ColumnDTO>();

      if (conf.Use_Advanced_Config__c == true) {
        // Relational columns
        if (conf.Smart_Grid_Columns__r != null) {
          SObjectType sType = Schema.getGlobalDescribe()
            .get(conf.Object_API_Name__c);
          Map<String, SObjectField> fMap = sType != null
            ? sType.getDescribe().fields.getMap()
            : null;

          for (Smart_Grid_Column__mdt col : conf.Smart_Grid_Columns__r) {
            ColumnDTO c = new ColumnDTO();
            c.fieldApiName = col.Field_API_Name__c;
            c.displayLabel = col.Display_Label__c;
            c.order = col.Order__c;
            c.isEditable = col.Is_Editable__c;
            c.columnWidth = col.Column_Width__c;
            c.isSortable = col.Is_Sortable__c;

            if (
              fMap != null && fMap.containsKey(c.fieldApiName.toLowerCase())
            ) {
              c.type = String.valueOf(
                fMap.get(c.fieldApiName.toLowerCase()).getDescribe().getType()
              );
            }

            dto.columns.add(c);
          }
        }
      } else if (String.isNotBlank(conf.Columns_JSON__c)) {
        // JSON columns
        try {
          SObjectType sType = Schema.getGlobalDescribe()
            .get(conf.Object_API_Name__c);
          Map<String, SObjectField> fMap = sType != null
            ? sType.getDescribe().fields.getMap()
            : null;

          List<JsonColumn> parsedCols = (List<JsonColumn>) JSON.deserialize(
            conf.Columns_JSON__c,
            List<JsonColumn>.class
          );
          for (JsonColumn jc : parsedCols) {
            ColumnDTO c = new ColumnDTO();
            c.fieldApiName = jc.field;
            c.displayLabel = jc.label != null ? jc.label : jc.field;
            c.order = jc.order;
            c.isEditable = jc.editable;
            c.columnWidth = jc.width;
            c.isSortable = jc.sortable != null ? jc.sortable : false;

            if (
              fMap != null && fMap.containsKey(c.fieldApiName.toLowerCase())
            ) {
              c.type = String.valueOf(
                fMap.get(c.fieldApiName.toLowerCase()).getDescribe().getType()
              );
            }

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

  /**
   * @description Retrieves accessible fields for an SObject, returning labels, types, and updateability.
   * Used by the field picker component to allow end-users to select columns dynamically.
   * @param objectApiName The API name of the target SObject
   * @return List of ColumnInfo descriptors for accessible fields
   */
  @AuraEnabled(cacheable=true)
  public static List<ColumnInfo> getObjectFields(String objectApiName) {
    List<ColumnInfo> results = new List<ColumnInfo>();
    if (String.isBlank(objectApiName))
      return results;

    SObjectType sObjType = Schema.getGlobalDescribe().get(objectApiName);
    if (sObjType == null)
      return results;
    if (!sObjType.getDescribe().isAccessible())
      return results;

    Map<String, SObjectField> fieldMap = sObjType.getDescribe().fields.getMap();
    for (String fieldName : fieldMap.keySet()) {
      Schema.DescribeFieldResult descResult = fieldMap.get(fieldName)
        .getDescribe();
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

  /**
   * @description Queries a paged window of records for the given object and fields.
   * Enforces USER_MODE FLS and performs safe offset pagination with total count querying.
   * @param objectApiName The API name of the SObject to query
   * @param fields The list of field API names to retrieve
   * @param filters Key-value pairs for dynamic filtering
   * @param dateField API name of date field for range filtering
   * @param startDate Optional start date boundary
   * @param endDate Optional end date boundary
   * @param sortField Field API name to sort by
   * @param sortDirection Sorting direction ('ASC' or 'DESC')
   * @param pageSize Number of records per page (default: 50)
   * @param pageNumber 1-based page index
   * @return PagedResult containing records, totalSize, pageNumber, and pageSize
   */
  @AuraEnabled
  public static PagedResult getRecordsPaged(
    String objectApiName,
    List<String> fields,
    Map<String, Object> filters,
    String dateField,
    Date startDate,
    Date endDate,
    String sortField,
    String sortDirection,
    Integer pageSize,
    Integer pageNumber
  ) {
    if (String.isBlank(objectApiName) || fields == null || fields.isEmpty()) {
      throw new AuraHandledException(
        'Invalid parameters: object api name and fields are required.'
      );
    }

    try {
      Integer safePageSize = pageSize != null && pageSize > 0 ? pageSize : 50;
      Integer safePageNumber = pageNumber != null &&
        pageNumber > 0
        ? pageNumber
        : 1;
      Integer offset = (safePageNumber - 1) * safePageSize;

      GridQueryBuilder.QueryRequest req = new GridQueryBuilder.QueryRequest();
      req.objectApiName = objectApiName;
      req.fields = fields;
      req.filters = filters;
      req.dateField = dateField;
      req.startDate = startDate;
      req.endDate = endDate;
      req.sortField = sortField;
      req.sortDirection = sortDirection;
      req.recordLimit = safePageSize;
      req.offsetValue = offset;

      // 1. Get total count using validated query builder
      String countQuery = GridQueryBuilder.buildCountQuery(req);
      Integer totalSize = Database.countQuery(countQuery);

      // 2. Get records with USER_MODE for FLS/CRUD enforcement
      String query = GridQueryBuilder.buildSingleQuery(req);
      List<SObject> records = Database.query(query, AccessLevel.USER_MODE);

      PagedResult result = new PagedResult();
      result.records = records;
      result.totalSize = totalSize;
      result.pageSize = safePageSize;
      result.pageNumber = safePageNumber;

      return result;
    } catch (Exception e) {
      throw new AuraHandledException(
        'Error fetching paged records: ' + e.getMessage()
      );
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
  public static List<PicklistOption> getPicklistValues(
    String objectApiName,
    String fieldApiName
  ) {
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

    Schema.DescribeFieldResult fieldDescribe = fieldMap.get(lowerFieldName)
      .getDescribe();

    if (!fieldDescribe.isAccessible()) {
      throw new AuraHandledException('Field not accessible: ' + fieldApiName);
    }

    // Only return values for picklist-type fields
    Schema.DisplayType fieldType = fieldDescribe.getType();
    if (
      fieldType != Schema.DisplayType.PICKLIST &&
      fieldType != Schema.DisplayType.MULTIPICKLIST
    ) {
      throw new AuraHandledException(
        'Field is not a picklist: ' + fieldApiName
      );
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

  /**
   * @description Bulk saves modified or newly created SObjects with partial success support.
   * Enforces object-level CRUD, strips inaccessible fields, separates inserts from updates,
   * and maps any DML errors back to individual rows and field names.
   * @param records List of SObjects to insert or update
   * @return SaveResult containing overall success status, row-level errors, and table-level errors
   */
  @AuraEnabled
  public static SaveResult saveRecords(List<SObject> records) {
    SaveResult result = new SaveResult();
    if (records == null || records.isEmpty()) {
      result.isSuccess = true;
      return result;
    }

    // ID Validation Hardening (TS04) - validate Record IDs before stripInaccessible and DML
    SmartGridIdValidator.validateIds(records);

    // CRUD check — ensure user has create/update access to the object
    SObjectType objType = records[0].getSObjectType();
    DescribeSObjectResult objDescribe = objType.getDescribe();
    if (!objDescribe.isCreateable() && !objDescribe.isUpdateable()) {
      throw new AuraHandledException(
        'You do not have permission to create or update ' +
          objDescribe.getLabel() +
          ' records.'
      );
    }

    // Strip out inaccessible fields
    SObjectAccessDecision securityDecision = Security.stripInaccessible(
      AccessType.UPSERTABLE,
      records
    );
    List<SObject> safeRecords = securityDecision.getRecords();

    List<SObject> inserts = new List<SObject>();
    List<SObject> updates = new List<SObject>();
    Map<Integer, Integer> insertMap = new Map<Integer, Integer>();
    Map<Integer, Integer> updateMap = new Map<Integer, Integer>();

    for (Integer i = 0; i < safeRecords.size(); i++) {
      if (safeRecords[i].Id == null) {
        insertMap.put(inserts.size(), i);
        inserts.add(safeRecords[i]);
      } else {
        updateMap.put(updates.size(), i);
        updates.add(safeRecords[i]);
      }
    }

    result.isSuccess = true;

    if (!inserts.isEmpty()) {
      Database.SaveResult[] insertResults = Database.insert(inserts, false);
      for (Integer i = 0; i < insertResults.size(); i++) {
        Database.SaveResult sr = insertResults[i];
        if (!sr.isSuccess()) {
          result.isSuccess = false;
          RowError re = new RowError();
          Integer originalIdx = insertMap.get(i);
          re.id = String.valueOf(originalIdx);
          re.title = 'Error';
          re.messages = new List<String>();
          re.fieldNames = new List<String>();

          for (Database.Error err : sr.getErrors()) {
            re.messages.add(err.getMessage());
            if (err.getFields() != null) {
              for (String f : err.getFields()) {
                re.fieldNames.add(f);
              }
            }
            result.tableErrors.add('Row ' + re.id + ': ' + err.getMessage());
          }
          result.rowErrors.add(re);
        }
      }
    }

    if (!updates.isEmpty()) {
      Database.SaveResult[] updateResults = Database.update(updates, false);
      for (Integer i = 0; i < updateResults.size(); i++) {
        Database.SaveResult sr = updateResults[i];
        if (!sr.isSuccess()) {
          result.isSuccess = false;
          RowError re = new RowError();
          re.id = (String) updates[i].get('Id');
          re.title = 'Error';
          re.messages = new List<String>();
          re.fieldNames = new List<String>();

          for (Database.Error err : sr.getErrors()) {
            re.messages.add(err.getMessage());
            if (err.getFields() != null) {
              for (String f : err.getFields()) {
                re.fieldNames.add(f);
              }
            }
            result.tableErrors.add('Row ' + re.id + ': ' + err.getMessage());
          }
          result.rowErrors.add(re);
        }
      }
    }

    return result;
  }

  /**
   * @description Deletes a collection of records in USER_MODE with partial success support.
   * Enforces object deletable checks and captures row-specific errors on failure.
   * @param records List of SObjects to delete
   * @return SaveResult with rowErrors if any deletions failed
   */
  @AuraEnabled
  public static SaveResult deleteRecords(List<SObject> records) {
    SaveResult result = new SaveResult();
    if (records == null || records.isEmpty()) {
      result.isSuccess = true;
      return result;
    }

    // ID Validation Hardening (TS04) - validate Record IDs before DML
    SmartGridIdValidator.validateIdsForDelete(records);

    SObjectType objType = records[0].getSObjectType();
    if (!objType.getDescribe().isDeletable()) {
      throw new AuraHandledException(
        'You do not have permission to delete ' +
          objType.getDescribe().getLabel() +
          ' records.'
      );
    }

    Database.DeleteResult[] deleteResults = Database.delete(
      records,
      false,
      AccessLevel.USER_MODE
    );

    result.isSuccess = true;
    for (Integer i = 0; i < deleteResults.size(); i++) {
      Database.DeleteResult dr = deleteResults[i];
      if (!dr.isSuccess()) {
        result.isSuccess = false;
        RowError re = new RowError();
        re.id = (String) records[i].get('Id');
        re.title = 'Error';
        re.messages = new List<String>();
        re.fieldNames = new List<String>();

        for (Database.Error err : dr.getErrors()) {
          re.messages.add(err.getMessage());
          result.tableErrors.add('Row ' + re.id + ': ' + err.getMessage());
        }
        result.rowErrors.add(re);
      }
    }

    return result;
  }

  public class PagedResult {
    @AuraEnabled
    public List<SObject> records;
    @AuraEnabled
    public Integer totalSize;
    @AuraEnabled
    public Integer pageSize;
    @AuraEnabled
    public Integer pageNumber;
  }

  public class ColumnInfo {
    @AuraEnabled
    public String fieldApiName;
    @AuraEnabled
    public String label;
    @AuraEnabled
    public String type;
    @AuraEnabled
    public Boolean isUpdateable;
  }

  public class RowError {
    @AuraEnabled
    public String id;
    @AuraEnabled
    public String title;
    @AuraEnabled
    public List<String> messages;
    @AuraEnabled
    public List<String> fieldNames;
  }

  public class SaveResult {
    @AuraEnabled
    public Boolean isSuccess = true;
    @AuraEnabled
    public List<RowError> rowErrors = new List<RowError>();
    @AuraEnabled
    public List<String> tableErrors = new List<String>();
  }

  public class PicklistOption {
    @AuraEnabled
    public String label;
    @AuraEnabled
    public String value;
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
    @AuraEnabled
    public String id;
    @AuraEnabled
    public String developerName;
    @AuraEnabled
    public String objectApiName;
    @AuraEnabled
    public String defaultFilterField;
    @AuraEnabled
    public Decimal recordLimit;
    @AuraEnabled
    public String defaultSortField;
    @AuraEnabled
    public Boolean isActive;
    @AuraEnabled
    public Boolean allowPersonalization;
    @AuraEnabled
    public Boolean useAdvancedConfig;
    @AuraEnabled
    public Boolean enableAddRow;
    @AuraEnabled
    public Boolean enableDelete;
    @AuraEnabled
    public Boolean enableExport;
    @AuraEnabled
    public Boolean enableFilters;
    @AuraEnabled
    public Boolean enableReadingPane;
    @AuraEnabled
    public String totalsFieldsJson;
    @AuraEnabled
    public String relatedObject;
    @AuraEnabled
    public List<ColumnDTO> columns;
  }

  public class ColumnDTO {
    @AuraEnabled
    public String fieldApiName;
    @AuraEnabled
    public String displayLabel;
    @AuraEnabled
    public Decimal order;
    @AuraEnabled
    public Boolean isEditable;
    @AuraEnabled
    public Decimal columnWidth;
    @AuraEnabled
    public Boolean isSortable;
    @AuraEnabled
    public String type;
  }
}

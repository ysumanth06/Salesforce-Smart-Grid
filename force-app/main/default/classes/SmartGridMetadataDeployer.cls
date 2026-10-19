/**
 * @description Programmatic Custom Metadata Deployment Service for Smart Grid In-App Admin Studio.
 * Uses native Salesforce Metadata.Operations.enqueueDeployment to deploy grid configs and columns.
 */
public with sharing class SmartGridMetadataDeployer {
  public class GridDeployRequest {
    @AuraEnabled
    public String configDeveloperName;
    @AuraEnabled
    public String masterLabel;
    @AuraEnabled
    public String objectApiName;
    @AuraEnabled
    public Boolean enableAddRow;
    @AuraEnabled
    public Boolean enableDelete;
    @AuraEnabled
    public Boolean enableExport;
    @AuraEnabled
    public Boolean enableFilters;
    @AuraEnabled
    public Boolean enableTranspose;
    @AuraEnabled
    public List<ColumnDeployDTO> columns;
  }

  public class ColumnDeployDTO {
    @AuraEnabled
    public String fieldApiName;
    @AuraEnabled
    public String displayLabel;
    @AuraEnabled
    public Decimal order;
    @AuraEnabled
    public Boolean isEditable;
    @AuraEnabled
    public Boolean isSortable;
    @AuraEnabled
    public Decimal columnWidth;
  }

  public class DeployResult {
    @AuraEnabled
    public Boolean isSuccess;
    @AuraEnabled
    public Id deploymentJobId;
    @AuraEnabled
    public String errorMessage;
  }

  public class GridDeployCallback implements Metadata.DeployCallback {
    public void handleResult(
      Metadata.DeployResult result,
      Metadata.DeployCallbackContext context
    ) {
      if (result.status == Metadata.DeployStatus.Succeeded) {
        System.debug(
          LoggingLevel.INFO,
          'Grid metadata deployment succeeded: ' +
          result.numberComponentsDeployed
        );
      } else {
        System.debug(
          LoggingLevel.ERROR,
          'Grid metadata deployment failed: ' + result.errorMessage
        );
      }
    }
  }

  /**
   * @description Constructs and enqueues deployment for Smart_Grid_Config__mdt and Smart_Grid_Column__mdt
   * @param request GridDeployRequest payload
   * @return DeployResult
   */
  @AuraEnabled
  public static DeployResult deployGridConfig(GridDeployRequest request) {
    DeployResult result = new DeployResult();
    result.isSuccess = false;

    if (
      request == null ||
      String.isBlank(request.configDeveloperName) ||
      String.isBlank(request.objectApiName)
    ) {
      result.errorMessage = 'Configuration developer name and Object API name are required.';
      return result;
    }

    try {
      Metadata.DeployContainer mdContainer = buildDeployContainer(request);

      if (Test.isRunningTest()) {
        result.isSuccess = true;
        result.deploymentJobId = '0Af000000000001AAA';
        return result;
      }

      GridDeployCallback callback = new GridDeployCallback();
      Id jobId = Metadata.Operations.enqueueDeployment(mdContainer, callback);
      result.isSuccess = true;
      result.deploymentJobId = jobId;
    } catch (Exception e) {
      result.errorMessage = e.getMessage();
    }

    return result;
  }

  /**
   * @description Builds the Metadata.DeployContainer containing config and column records
   */
  @TestVisible
  private static Metadata.DeployContainer buildDeployContainer(
    GridDeployRequest request
  ) {
    Metadata.DeployContainer mdContainer = new Metadata.DeployContainer();

    // 1. Grid Config Custom Metadata
    Metadata.CustomMetadata configRecord = new Metadata.CustomMetadata();
    configRecord.fullName =
      'Smart_Grid_Config__mdt.' + request.configDeveloperName;
    configRecord.label = String.isNotBlank(request.masterLabel)
      ? request.masterLabel
      : request.configDeveloperName;

    Metadata.CustomMetadataValue objVal = new Metadata.CustomMetadataValue();
    objVal.field = 'Object_API_Name__c';
    objVal.value = request.objectApiName;
    configRecord.values.add(objVal);

    Metadata.CustomMetadataValue addRowVal = new Metadata.CustomMetadataValue();
    addRowVal.field = 'Enable_Add_Row__c';
    addRowVal.value = (request.enableAddRow != null)
      ? request.enableAddRow
      : true;
    configRecord.values.add(addRowVal);

    Metadata.CustomMetadataValue deleteVal = new Metadata.CustomMetadataValue();
    deleteVal.field = 'Enable_Delete__c';
    deleteVal.value = (request.enableDelete != null)
      ? request.enableDelete
      : true;
    configRecord.values.add(deleteVal);

    Metadata.CustomMetadataValue exportVal = new Metadata.CustomMetadataValue();
    exportVal.field = 'Enable_Export__c';
    exportVal.value = (request.enableExport != null)
      ? request.enableExport
      : true;
    configRecord.values.add(exportVal);

    Metadata.CustomMetadataValue filterVal = new Metadata.CustomMetadataValue();
    filterVal.field = 'Enable_Filters__c';
    filterVal.value = (request.enableFilters != null)
      ? request.enableFilters
      : true;
    configRecord.values.add(filterVal);

    Metadata.CustomMetadataValue transposeVal = new Metadata.CustomMetadataValue();
    transposeVal.field = 'Enable_Transpose__c';
    transposeVal.value = (request.enableTranspose != null)
      ? request.enableTranspose
      : true;
    configRecord.values.add(transposeVal);

    Metadata.CustomMetadataValue activeVal = new Metadata.CustomMetadataValue();
    activeVal.field = 'Is_Active__c';
    activeVal.value = true;
    configRecord.values.add(activeVal);

    mdContainer.addMetadata(configRecord);

    // 2. Column Custom Metadata Records
    if (request.columns != null) {
      for (ColumnDeployDTO col : request.columns) {
        Metadata.CustomMetadata colRecord = new Metadata.CustomMetadata();
        String safeColName = col.fieldApiName.replaceAll('[^a-zA-Z0-9_]', '');
        colRecord.fullName =
          'Smart_Grid_Column__mdt.' +
          request.configDeveloperName +
          '_' +
          safeColName;
        colRecord.label = String.isNotBlank(col.displayLabel)
          ? col.displayLabel
          : col.fieldApiName;

        Metadata.CustomMetadataValue fieldApiVal = new Metadata.CustomMetadataValue();
        fieldApiVal.field = 'Field_API_Name__c';
        fieldApiVal.value = col.fieldApiName;
        colRecord.values.add(fieldApiVal);

        Metadata.CustomMetadataValue labelVal = new Metadata.CustomMetadataValue();
        labelVal.field = 'Display_Label__c';
        labelVal.value = colRecord.label;
        colRecord.values.add(labelVal);

        Metadata.CustomMetadataValue orderVal = new Metadata.CustomMetadataValue();
        orderVal.field = 'Order__c';
        orderVal.value = (col.order != null) ? col.order : 1;
        colRecord.values.add(orderVal);

        Metadata.CustomMetadataValue editVal = new Metadata.CustomMetadataValue();
        editVal.field = 'Is_Editable__c';
        editVal.value = (col.isEditable != null) ? col.isEditable : true;
        colRecord.values.add(editVal);

        Metadata.CustomMetadataValue sortVal = new Metadata.CustomMetadataValue();
        sortVal.field = 'Is_Sortable__c';
        sortVal.value = (col.isSortable != null) ? col.isSortable : true;
        colRecord.values.add(sortVal);

        Metadata.CustomMetadataValue widthVal = new Metadata.CustomMetadataValue();
        widthVal.field = 'Column_Width__c';
        widthVal.value = (col.columnWidth != null) ? col.columnWidth : 140;
        colRecord.values.add(widthVal);

        Metadata.CustomMetadataValue configRefVal = new Metadata.CustomMetadataValue();
        configRefVal.field = 'Smart_Grid_Config__c';
        configRefVal.value = request.configDeveloperName;
        colRecord.values.add(configRefVal);

        mdContainer.addMetadata(colRecord);
      }
    }

    return mdContainer;
  }
}

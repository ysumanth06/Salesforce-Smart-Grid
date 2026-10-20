/**
 * @description Unit tests for SmartGridMetadataDeployer.
 * Validates metadata container generation, custom metadata structure, and deployment execution.
 */
@IsTest
private class SmartGridMetadataDeployerTest {
  @IsTest
  static void testBuildDeployContainer() {
    SmartGridMetadataDeployer.GridDeployRequest req = new SmartGridMetadataDeployer.GridDeployRequest();
    req.configDeveloperName = 'Test_Account_Grid';
    req.masterLabel = 'Test Account Grid';
    req.objectApiName = 'Account';
    req.enableAddRow = true;
    req.enableDelete = true;
    req.enableExport = true;
    req.enableFilters = true;
    req.enableTranspose = true;

    SmartGridMetadataDeployer.ColumnDeployDTO col1 = new SmartGridMetadataDeployer.ColumnDeployDTO();
    col1.fieldApiName = 'Name';
    col1.displayLabel = 'Account Name';
    col1.order = 1;
    col1.isEditable = true;
    col1.isSortable = true;
    col1.columnWidth = 200;

    SmartGridMetadataDeployer.ColumnDeployDTO col2 = new SmartGridMetadataDeployer.ColumnDeployDTO();
    col2.fieldApiName = 'AnnualRevenue';
    col2.displayLabel = 'Revenue';
    col2.order = 2;
    col2.isEditable = true;
    col2.isSortable = true;
    col2.columnWidth = 150;

    req.columns = new List<SmartGridMetadataDeployer.ColumnDeployDTO>{
      col1,
      col2
    };

    Test.startTest();
    Metadata.DeployContainer container = SmartGridMetadataDeployer.buildDeployContainer(
      req
    );
    Test.stopTest();

    Assert.isNotNull(container, 'Deploy container must not be null');
  }

  @IsTest
  static void testDeployGridConfig_Success() {
    SmartGridMetadataDeployer.GridDeployRequest req = new SmartGridMetadataDeployer.GridDeployRequest();
    req.configDeveloperName = 'Test_Contact_Grid';
    req.objectApiName = 'Contact';

    Test.startTest();
    SmartGridMetadataDeployer.DeployResult res = SmartGridMetadataDeployer.deployGridConfig(
      req
    );
    Test.stopTest();

    Assert.isTrue(res.isSuccess, 'Expected deployment to succeed');
    Assert.isNotNull(
      res.deploymentJobId,
      'Deployment jobId should be returned'
    );
  }

  @IsTest
  static void testDeployGridConfig_ValidationErrors() {
    Test.startTest();
    SmartGridMetadataDeployer.DeployResult res1 = SmartGridMetadataDeployer.deployGridConfig(
      null
    );
    Assert.isFalse(res1.isSuccess, 'Null request must fail');

    SmartGridMetadataDeployer.GridDeployRequest req2 = new SmartGridMetadataDeployer.GridDeployRequest();
    req2.configDeveloperName = '';
    SmartGridMetadataDeployer.DeployResult res2 = SmartGridMetadataDeployer.deployGridConfig(
      req2
    );
    Assert.isFalse(res2.isSuccess, 'Empty name must fail');
    Test.stopTest();
  }

  @IsTest
  static void testDeployCallback() {
    SmartGridMetadataDeployer.GridDeployCallback callback = new SmartGridMetadataDeployer.GridDeployCallback();
    Metadata.DeployResult mockResultSuccess = new Metadata.DeployResult();
    mockResultSuccess.status = Metadata.DeployStatus.Succeeded;
    mockResultSuccess.numberComponentsDeployed = 3;

    Metadata.DeployResult mockResultFail = new Metadata.DeployResult();
    mockResultFail.status = Metadata.DeployStatus.Failed;
    mockResultFail.errorMessage = 'Simulated failure';

    Test.startTest();
    callback.handleResult(mockResultSuccess, null);
    callback.handleResult(mockResultFail, null);
    Test.stopTest();
    Assert.isNotNull(
      callback,
      'Callback should handle results without throwing'
    );
  }
}

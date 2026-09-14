@IsTest
public class SmartGridControllerTest {
  @IsTest
  static void testGetGridConfig_Null() {
    Test.startTest();
    SmartGridController.GridConfigDTO config = SmartGridController.getGridConfig(
      null
    );
    Test.stopTest();
    Assert.isNull(config, 'Config should be null for null dev name');
  }

  @IsTest
  static void testGetGridConfig_JSON() {
    String jsonStr = '[{"Id":"m00000000000001", "DeveloperName":"Test_JSON", "Is_Active__c":true, "Use_Advanced_Config__c":false, "Columns_JSON__c":"[{\\"field\\":\\"Name\\",\\"order\\":1}]"}]';
    SmartGridController.mockConfigs = (List<Smart_Grid_Config__mdt>) JSON.deserialize(
      jsonStr,
      List<Smart_Grid_Config__mdt>.class
    );

    Test.startTest();
    SmartGridController.GridConfigDTO config = SmartGridController.getGridConfig(
      'Test_JSON'
    );
    Test.stopTest();

    Assert.isNotNull(config, 'Config should not be null');
    Assert.areEqual(
      'Test_JSON',
      config.developerName,
      'DeveloperName should match'
    );
    Assert.areEqual(
      1,
      config.columns.size(),
      'Should have 1 column parsed from JSON'
    );
    Assert.areEqual(
      'Name',
      config.columns[0].fieldApiName,
      'Column field should be Name'
    );
  }

  @IsTest
  static void testGetGridConfig_Relational() {
    String jsonStr = '[{"Id":"m00000000000002", "DeveloperName":"Test_Relational", "Is_Active__c":true, "Use_Advanced_Config__c":true, "Smart_Grid_Columns__r":{"totalSize":1, "done":true, "records":[{"Id":"m01000000000001", "Field_API_Name__c":"Industry", "Order__c":1, "Is_Editable__c":true}]}}]';
    SmartGridController.mockConfigs = (List<Smart_Grid_Config__mdt>) JSON.deserialize(
      jsonStr,
      List<Smart_Grid_Config__mdt>.class
    );

    Test.startTest();
    SmartGridController.GridConfigDTO config = SmartGridController.getGridConfig(
      'Test_Relational'
    );
    Test.stopTest();

    Assert.isNotNull(config, 'Config should not be null');
    Assert.areEqual(
      'Test_Relational',
      config.developerName,
      'DeveloperName should match'
    );
    Assert.areEqual(
      1,
      config.columns.size(),
      'Should have 1 column from relationship'
    );
    Assert.areEqual(
      'Industry',
      config.columns[0].fieldApiName,
      'Column field should be Industry'
    );
  }

  @IsTest
  static void testGetGridConfig_DefaultToggles() {
    String jsonStr = '[{"Id":"m00000000000003", "DeveloperName":"Test_Defaults", "Is_Active__c":true, "Columns_JSON__c":"[{\\"field\\":\\"Name\\"}]"}]';
    SmartGridController.mockConfigs = (List<Smart_Grid_Config__mdt>) JSON.deserialize(
      jsonStr,
      List<Smart_Grid_Config__mdt>.class
    );

    Test.startTest();
    SmartGridController.GridConfigDTO config = SmartGridController.getGridConfig(
      'Test_Defaults'
    );
    Test.stopTest();

    Assert.isNotNull(config, 'Config should not be null');
    Assert.isTrue(config.enableAddRow, 'enableAddRow should default to true');
    Assert.isTrue(config.enableDelete, 'enableDelete should default to true');
    Assert.isTrue(config.enableExport, 'enableExport should default to true');
    Assert.isTrue(config.enableFilters, 'enableFilters should default to true');
    Assert.isFalse(
      config.enableReadingPane,
      'enableReadingPane should default to false'
    );
  }

  @IsTest
  static void testGetGridConfig_FeatureToggles() {
    String jsonStr = '[{"Id":"m00000000000004", "DeveloperName":"Test_Toggles", "Is_Active__c":true, "Enable_Add_Row__c":false, "Enable_Delete__c":false, "Enable_Export__c":false, "Enable_Filters__c":false, "Enable_Reading_Pane__c":true, "Totals_Fields_JSON__c":"[\\"AnnualRevenue\\"]", "Related_Object__c":"Contact", "Columns_JSON__c":"[{\\"field\\":\\"Name\\"}]"}]';
    SmartGridController.mockConfigs = (List<Smart_Grid_Config__mdt>) JSON.deserialize(
      jsonStr,
      List<Smart_Grid_Config__mdt>.class
    );

    Test.startTest();
    SmartGridController.GridConfigDTO config = SmartGridController.getGridConfig(
      'Test_Toggles'
    );
    Test.stopTest();

    Assert.isNotNull(config, 'Config should not be null');
    Assert.isFalse(config.enableAddRow, 'enableAddRow should be false');
    Assert.isFalse(config.enableDelete, 'enableDelete should be false');
    Assert.isFalse(config.enableExport, 'enableExport should be false');
    Assert.isFalse(config.enableFilters, 'enableFilters should be false');
    Assert.isTrue(config.enableReadingPane, 'enableReadingPane should be true');
    Assert.areEqual(
      '["AnnualRevenue"]',
      config.totalsFieldsJson,
      'totalsFieldsJson should match'
    );
    Assert.areEqual(
      'Contact',
      config.relatedObject,
      'relatedObject should match'
    );
  }

  @IsTest
  static void testGetObjectFields_Valid() {
    Test.startTest();
    List<SmartGridController.ColumnInfo> fields = SmartGridController.getObjectFields(
      'Account'
    );
    Test.stopTest();
    Assert.isTrue(fields.size() > 0, 'Should return fields for Account');
  }

  @IsTest
  static void testGetObjectFields_Invalid() {
    Test.startTest();
    List<SmartGridController.ColumnInfo> fields = SmartGridController.getObjectFields(
      'InvalidObjectXYZ123__c'
    );
    Test.stopTest();
    Assert.areEqual(
      0,
      fields.size(),
      'Should return no fields for invalid object'
    );
  }

  @IsTest
  static void testGetRecords_Valid() {
    Account target = new Account(Name = 'Test Smart Grid Acc');
    insert target;

    Test.startTest();
    SmartGridController.PagedResult result = SmartGridController.getRecordsPaged(
      'Account',
      new List<String>{ 'Name' },
      null,
      null,
      null,
      null,
      null,
      null,
      10,
      1
    );
    Test.stopTest();

    Assert.areEqual(1, result.records.size(), 'Should return 1 record');
    Assert.areEqual(1, result.totalSize, 'Total size should be 1');
    Assert.areEqual(1, result.pageNumber, 'Page number should be 1');
  }

  @IsTest
  static void testSaveRecords_Valid() {
    Account target = new Account(Name = 'Save Test Acc');
    insert target;

    target.Name = 'Updated Acc';
    Test.startTest();
    SmartGridController.SaveResult sr = SmartGridController.saveRecords(
      new List<SObject>{ target }
    );
    Test.stopTest();

    Assert.isTrue(sr.isSuccess, 'Save should be successful');

    Account updatedAcc = [SELECT Name FROM Account WHERE Id = :target.Id];
    Assert.areEqual('Updated Acc', updatedAcc.Name, 'Name should be updated');
  }

  @IsTest
  static void testSaveRecords_PartialSuccess() {
    Account goodAcc = new Account(Name = 'Good Acc');
    insert goodAcc;
    Account badAcc = new Account(Name = 'Bad Acc');
    insert badAcc;

    goodAcc.Name = 'Updated Good Acc';
    badAcc.Name = null;

    Test.startTest();
    SmartGridController.SaveResult sr = SmartGridController.saveRecords(
      new List<SObject>{ goodAcc, badAcc }
    );
    Test.stopTest();

    Assert.isFalse(
      sr.isSuccess,
      'Save should return false for partial success'
    );
    Assert.areEqual(1, sr.rowErrors.size(), 'There should be 1 row error');
    Assert.areEqual(
      badAcc.Id,
      sr.rowErrors[0].id,
      'The error should map to the bad account ID'
    );
    Assert.areEqual(1, sr.tableErrors.size(), 'There should be 1 table error');

    Account updatedGoodAcc = [SELECT Name FROM Account WHERE Id = :goodAcc.Id];
    Assert.areEqual(
      'Updated Good Acc',
      updatedGoodAcc.Name,
      'The good record should have saved successfully'
    );
  }

  @IsTest
  static void testSaveRecords_Bulk() {
    List<Account> accounts = new List<Account>();
    for (Integer i = 0; i < 251; i++) {
      accounts.add(new Account(Name = 'Bulk Acc ' + i));
    }
    insert accounts;

    for (Account a : accounts) {
      a.Name = a.Name + ' Updated';
    }

    Test.startTest();
    SmartGridController.SaveResult sr = SmartGridController.saveRecords(
      accounts
    );
    Test.stopTest();

    Assert.isTrue(sr.isSuccess, 'Bulk save should be successful');

    Integer updatedCount = [
      SELECT COUNT()
      FROM Account
      WHERE Name LIKE '%Updated'
    ];
    Assert.areEqual(251, updatedCount, 'All 251 records should be updated');
  }

  @IsTest
  static void testGetPicklistValues_Valid() {
    Test.startTest();
    List<SmartGridController.PicklistOption> options = SmartGridController.getPicklistValues(
      'Account',
      'Industry'
    );
    Test.stopTest();

    Assert.isTrue(
      options.size() > 0,
      'Should return picklist values for Account.Industry'
    );
    for (SmartGridController.PicklistOption opt : options) {
      Assert.isNotNull(opt.label, 'Each option should have a label');
      Assert.isNotNull(opt.value, 'Each option should have a value');
    }
  }

  @IsTest
  static void testGetPicklistValues_NonPicklistField() {
    Test.startTest();
    try {
      SmartGridController.getPicklistValues('Account', 'Name');
      Assert.fail('Expected exception for non-picklist field');
    } catch (Exception e) {
      Assert.isTrue(
        e instanceof AuraHandledException,
        'Should throw AuraHandledException for non-picklist. Got: ' +
        e.getTypeName()
      );
    }
    Test.stopTest();
  }

  @IsTest
  static void testGetPicklistValues_NullParams() {
    Test.startTest();
    List<SmartGridController.PicklistOption> options = SmartGridController.getPicklistValues(
      null,
      null
    );
    Test.stopTest();

    Assert.areEqual(
      0,
      options.size(),
      'Should return empty list for null params'
    );
  }

  @IsTest
  static void testGetRecords_WithFilterValue() {
    Account acc = new Account(Name = 'Filter Test', Industry = 'Technology');
    insert acc;

    Test.startTest();
    SmartGridController.PagedResult result = SmartGridController.getRecordsPaged(
      'Account',
      new List<String>{ 'Name', 'Industry' },
      new Map<String, Object>{ 'Industry' => 'Technology' },
      null,
      null,
      null,
      null,
      null,
      10,
      1
    );
    Test.stopTest();

    Assert.isTrue(
      result.records.size() > 0,
      'Should return at least the Technology record'
    );
    for (SObject r : result.records) {
      Assert.areEqual(
        'Technology',
        (String) r.get('Industry'),
        'All returned records should have Industry = Technology'
      );
    }
  }

  @IsTest
  static void testDeleteRecords_Valid() {
    Account acc = new Account(Name = 'Delete Test');
    insert acc;
    Test.startTest();
    SmartGridController.SaveResult sr = SmartGridController.deleteRecords(
      new List<SObject>{ acc }
    );
    Test.stopTest();
    Assert.isTrue(sr.isSuccess, 'Delete should be successful');
    Assert.areEqual(
      0,
      [SELECT COUNT() FROM Account WHERE Id = :acc.Id],
      'Account should be deleted'
    );
  }

  @IsTest
  static void testDeleteRecords_Bulk() {
    List<Account> accounts = new List<Account>();
    for (Integer i = 0; i < 251; i++) {
      accounts.add(new Account(Name = 'Bulk Delete ' + i));
    }
    insert accounts;
    Test.startTest();
    SmartGridController.SaveResult sr = SmartGridController.deleteRecords(
      accounts
    );
    Test.stopTest();
    Assert.isTrue(sr.isSuccess, 'Bulk delete should be successful');
  }

  @IsTest
  static void testDeleteRecords_Null() {
    Test.startTest();
    SmartGridController.SaveResult sr = SmartGridController.deleteRecords(null);
    Test.stopTest();
    Assert.isTrue(sr.isSuccess, 'Should return success for null');
  }

  @IsTest
  static void testSaveRecords_InsertNew() {
    Account acc = new Account(Name = 'New Insert Test');
    Test.startTest();
    SmartGridController.SaveResult sr = SmartGridController.saveRecords(
      new List<SObject>{ acc }
    );
    Test.stopTest();
    Assert.isTrue(sr.isSuccess, 'Insert should be successful');
    Assert.areEqual(
      1,
      [SELECT COUNT() FROM Account WHERE Name = 'New Insert Test'],
      'Account should be inserted'
    );
  }

  @IsTest
  static void testSaveRecords_InsertPartialSuccess() {
    Account acc1 = new Account(Name = 'Valid Insert');
    Account acc2 = new Account(); // Missing Name
    Test.startTest();
    SmartGridController.SaveResult sr = SmartGridController.saveRecords(
      new List<SObject>{ acc1, acc2 }
    );
    Test.stopTest();
    Assert.isFalse(sr.isSuccess, 'Should be partial success');
    Assert.areEqual(1, sr.rowErrors.size(), 'Should have 1 error');
    Assert.areEqual(
      '1',
      sr.rowErrors[0].id,
      'Error ID should be the original index string'
    );
  }

  @IsTest
  static void testDeleteRecords_InvalidId_ThrowsException() {
    Account uninsertedAcc = new Account(Name = 'No Id');
    Test.startTest();
    try {
      SmartGridController.deleteRecords(new List<SObject>{ uninsertedAcc });
      Assert.fail(
        'Expected AuraHandledException when deleting record without valid ID'
      );
    } catch (Exception e) {
      Assert.isTrue(
        e instanceof AuraHandledException,
        'Should throw AuraHandledException when deleting uninserted record'
      );
    }
    Test.stopTest();
  }

  @IsTest
  static void testGetFormatRules_Controller() {
    Test.startTest();
    List<SmartGridFormatEngine.FormatRuleDTO> rules = SmartGridController.getFormatRules(
      'Account_Demo_Grid',
      'Account'
    );
    Test.stopTest();
    Assert.isNotNull(rules, 'Format rules should not be null');
  }

  @IsTest
  static void testGetAggregates_Opportunity() {
    Opportunity opp1 = new Opportunity(
      Name = 'Opp 1',
      StageName = 'Closed Won',
      CloseDate = Date.today(),
      Amount = 1000
    );
    Opportunity opp2 = new Opportunity(
      Name = 'Opp 2',
      StageName = 'Closed Won',
      CloseDate = Date.today(),
      Amount = 2000
    );
    insert new List<Opportunity>{ opp1, opp2 };

    Test.startTest();
    List<SmartGridController.AggregateResultDTO> aggs = SmartGridController.getAggregates(
      'Opportunity',
      new List<String>{ 'Amount' },
      new Map<String, String>{ 'StageName' => 'Closed Won' },
      'CloseDate',
      String.valueOf(Date.today().addDays(-1)),
      String.valueOf(Date.today().addDays(1))
    );
    Test.stopTest();

    Assert.areEqual(1, aggs.size(), 'Should return 1 aggregate DTO for Amount');
    Assert.areEqual('Amount', aggs[0].fieldName, 'Field name should be Amount');
    Assert.areEqual(3000, aggs[0].sumValue, 'Sum should be 3000');
    Assert.areEqual(1500, aggs[0].avgValue, 'Avg should be 1500');
    Assert.areEqual(1000, aggs[0].minValue, 'Min should be 1000');
    Assert.areEqual(2000, aggs[0].maxValue, 'Max should be 2000');
    Assert.areEqual(2, aggs[0].countValue, 'Count should be 2');
  }

  @IsTest
  static void testGetAggregates_InvalidInputs() {
    Test.startTest();
    List<SmartGridController.AggregateResultDTO> empty1 = SmartGridController.getAggregates(
      null,
      new List<String>{ 'Amount' },
      null,
      null,
      null,
      null
    );
    List<SmartGridController.AggregateResultDTO> empty2 = SmartGridController.getAggregates(
      'Account',
      new List<String>{ 'Name' },
      null,
      null,
      null,
      null
    );
    Test.stopTest();

    Assert.areEqual(0, empty1.size(), 'Null object should return empty list');
    Assert.areEqual(
      0,
      empty2.size(),
      'Non-numeric field should return empty list'
    );
  }

  @IsTest
  static void testGetRecordsPaged_WithFilterJson() {
    Account acc = new Account(
      Name = 'FilterJson Test Acc',
      Industry = 'Apparel'
    );
    insert acc;

    String jsonFilter = '{"logic":"AND","conditions":[{"field":"Industry","operator":"=","value":"Apparel"}]}';

    Test.startTest();
    SmartGridController.PagedResult result = SmartGridController.getRecordsPaged(
      'Account',
      new List<String>{ 'Name', 'Industry' },
      null,
      null,
      null,
      null,
      'Name',
      'ASC',
      10,
      1,
      jsonFilter
    );
    Test.stopTest();

    Assert.isNotNull(result, 'Result should not be null');
    Assert.isTrue(result.records.size() >= 1, 'Should find matching record');
  }

  @IsTest
  static void testSavedViewsDelegation() {
    Test.startTest();
    Smart_Grid_View__c saved = SmartGridController.saveView(
      null,
      'Controller View Test',
      'Account',
      '{"cols":["Name"]}',
      true
    );
    Assert.isNotNull(saved.Id, 'Saved view should have an ID');

    List<Smart_Grid_View__c> views = SmartGridController.getViews('Account');
    Assert.isTrue(views.size() >= 1, 'Should return saved views');

    SmartGridController.logQueryHistory('Account', '{"filter":1}');

    SmartGridController.deleteView(saved.Id);
    Test.stopTest();

    List<Smart_Grid_View__c> remaining = SmartGridController.getViews(
      'Account'
    );
    for (Smart_Grid_View__c v : remaining) {
      Assert.areNotEqual(saved.Id, v.Id, 'Deleted view should not exist');
    }
  }
}

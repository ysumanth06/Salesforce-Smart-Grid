@isTest
public class SmartGridControllerTest {
  @isTest
  static void testGetGridConfig_Null() {
    Test.startTest();
    SmartGridController.GridConfigDTO config = SmartGridController.getGridConfig(null);
    Test.stopTest();
    System.assertEquals(
      null,
      config,
      'Config should be null for null dev name'
    );
  }

  @isTest
  static void testGetGridConfig_JSON() {
    String jsonStr = '[{"Id":"m00000000000001", "DeveloperName":"Test_JSON", "Is_Active__c":true, "Use_Advanced_Config__c":false, "Columns_JSON__c":"[{\\"field\\":\\"Name\\",\\"order\\":1}]"}]';
    SmartGridController.mockConfigs = (List<Smart_Grid_Config__mdt>)JSON.deserialize(jsonStr, List<Smart_Grid_Config__mdt>.class);

    Test.startTest();
    SmartGridController.GridConfigDTO config = SmartGridController.getGridConfig('Test_JSON');
    Test.stopTest();

    System.assertNotEquals(null, config, 'Config should not be null');
    System.assertEquals('Test_JSON', config.developerName, 'DeveloperName should match');
    System.assertEquals(1, config.columns.size(), 'Should have 1 column parsed from JSON');
    System.assertEquals('Name', config.columns[0].fieldApiName, 'Column field should be Name');
  }

  @isTest
  static void testGetGridConfig_Relational() {
    String jsonStr = '[{"Id":"m00000000000002", "DeveloperName":"Test_Relational", "Is_Active__c":true, "Use_Advanced_Config__c":true, "Smart_Grid_Columns__r":{"totalSize":1, "done":true, "records":[{"Id":"m01000000000001", "Field_API_Name__c":"Industry", "Order__c":1, "Is_Editable__c":true}]}}]';
    SmartGridController.mockConfigs = (List<Smart_Grid_Config__mdt>)JSON.deserialize(jsonStr, List<Smart_Grid_Config__mdt>.class);

    Test.startTest();
    SmartGridController.GridConfigDTO config = SmartGridController.getGridConfig('Test_Relational');
    Test.stopTest();

    System.assertNotEquals(null, config, 'Config should not be null');
    System.assertEquals('Test_Relational', config.developerName, 'DeveloperName should match');
    System.assertEquals(1, config.columns.size(), 'Should have 1 column from relationship');
    System.assertEquals('Industry', config.columns[0].fieldApiName, 'Column field should be Industry');
  }

  @isTest
  static void testGetObjectFields_Valid() {
    Test.startTest();
    List<SmartGridController.ColumnInfo> fields = SmartGridController.getObjectFields(
      'Account'
    );
    Test.stopTest();
    System.assertNotEquals(
      0,
      fields.size(),
      'Should return fields for Account'
    );
  }

  @isTest
  static void testGetObjectFields_Invalid() {
    Test.startTest();
    List<SmartGridController.ColumnInfo> fields = SmartGridController.getObjectFields(
      'InvalidObjectXYZ123__c'
    );
    Test.stopTest();
    System.assertEquals(
      0,
      fields.size(),
      'Should return no fields for invalid object'
    );
  }

  @isTest
  static void testGetRecords_Valid() {
    Account target = new Account(Name = 'Test Smart Grid Acc');
    insert target;

    Test.startTest();
    List<SObject> records = SmartGridController.getRecords(
      'Account',
      new List<String>{ 'Name' },
      null,
      null,
      null,
      null,
      null,
      null,
      10
    );
    Test.stopTest();

    System.assertEquals(1, records.size(), 'Should return 1 record');
  }

  @isTest
  static void testSaveRecords_Valid() {
    Account target = new Account(Name = 'Save Test Acc');
    insert target;

    target.Name = 'Updated Acc';
    Test.startTest();
    SmartGridController.SaveResult sr = SmartGridController.saveRecords(
      new List<SObject>{ target }
    );
    Test.stopTest();

    System.assert(sr.isSuccess, 'Save should be successful');

    Account updatedAcc = [SELECT Name FROM Account WHERE Id = :target.Id];
    System.assertEquals(
      'Updated Acc',
      updatedAcc.Name,
      'Name should be updated'
    );
  }

  @isTest
  static void testSaveRecords_PartialSuccess() {
    Account goodAcc = new Account(Name = 'Good Acc');
    insert goodAcc;
    // Invalid account to trigger failure on update
    Account badAcc = new Account(Name = 'Bad Acc');
    insert badAcc;

    goodAcc.Name = 'Updated Good Acc';
    badAcc.Name = null; // Assuming Name is a required field on Account standard layout/DML

    Test.startTest();
    SmartGridController.SaveResult sr = SmartGridController.saveRecords(
      new List<SObject>{ goodAcc, badAcc }
    );
    Test.stopTest();

    System.assertEquals(
      false,
      sr.isSuccess,
      'Save should return false for partial success'
    );
    System.assertEquals(1, sr.rowErrors.size(), 'There should be 1 row error');
    System.assertEquals(
      badAcc.Id,
      sr.rowErrors[0].id,
      'The error should map to the bad account ID'
    );
    System.assertEquals(
      1,
      sr.tableErrors.size(),
      'There should be 1 table error'
    );

    Account updatedGoodAcc = [SELECT Name FROM Account WHERE Id = :goodAcc.Id];
    System.assertEquals(
      'Updated Good Acc',
      updatedGoodAcc.Name,
      'The good record should have saved successfully'
    );
  }

  @isTest
  static void testSaveRecords_Bulk() {
    List<Account> accounts = new List<Account>();
    for (Integer i = 0; i < 201; i++) {
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

    System.assert(sr.isSuccess, 'Bulk save should be successful');

    Integer updatedCount = [
      SELECT COUNT()
      FROM Account
      WHERE Name LIKE '%Updated'
    ];
    System.assertEquals(201, updatedCount, 'All records should be updated');
  }

  @isTest
  static void testGetPicklistValues_Valid() {
    Test.startTest();
    List<SmartGridController.PicklistOption> options = SmartGridController.getPicklistValues(
      'Account',
      'Industry'
    );
    Test.stopTest();

    System.assertNotEquals(
      0,
      options.size(),
      'Should return picklist values for Account.Industry'
    );
    // Verify structure
    for (SmartGridController.PicklistOption opt : options) {
      System.assertNotEquals(
        null,
        opt.label,
        'Each option should have a label'
      );
      System.assertNotEquals(
        null,
        opt.value,
        'Each option should have a value'
      );
    }
  }

  @isTest
  static void testGetPicklistValues_NonPicklistField() {
    Test.startTest();
    try {
      SmartGridController.getPicklistValues('Account', 'Name');
      System.assert(false, 'Expected exception for non-picklist field');
    } catch (Exception e) {
      System.assert(
        e instanceof AuraHandledException,
        'Should throw AuraHandledException for non-picklist. Got: ' +
        e.getTypeName()
      );
    }
    Test.stopTest();
  }

  @isTest
  static void testGetPicklistValues_NullParams() {
    Test.startTest();
    List<SmartGridController.PicklistOption> options = SmartGridController.getPicklistValues(
      null,
      null
    );
    Test.stopTest();

    System.assertEquals(
      0,
      options.size(),
      'Should return empty list for null params'
    );
  }

  @isTest
  static void testGetRecords_WithFilterValue() {
    Account acc = new Account(Name = 'Filter Test', Industry = 'Technology');
    insert acc;

    Test.startTest();
    List<SObject> records = SmartGridController.getRecords(
      'Account',
      new List<String>{ 'Name', 'Industry' },
      new Map<String, Object>{ 'Industry' => 'Technology' },
      null,
      null,
      null,
      null,
      null,
      10
    );
    Test.stopTest();

    System.assert(
      records.size() > 0,
      'Should return at least the Technology record'
    );
    for (SObject r : records) {
      System.assertEquals(
        'Technology',
        (String) r.get('Industry'),
        'All returned records should have Industry = Technology'
      );
    }
  }
  @isTest
  static void testDeleteRecords_Valid() {
    Account acc = new Account(Name = 'Delete Test');
    insert acc;
    Test.startTest();
    SmartGridController.SaveResult sr = SmartGridController.deleteRecords(new List<SObject>{acc});
    Test.stopTest();
    System.assert(sr.isSuccess, 'Delete should be successful');
    System.assertEquals(0, [SELECT count() FROM Account WHERE Id = :acc.Id], 'Account should be deleted');
  }

  @isTest
  static void testDeleteRecords_Bulk() {
    List<Account> accounts = new List<Account>();
    for(Integer i=0; i<201; i++) {
        accounts.add(new Account(Name = 'Bulk Delete ' + i));
    }
    insert accounts;
    Test.startTest();
    SmartGridController.SaveResult sr = SmartGridController.deleteRecords(accounts);
    Test.stopTest();
    System.assert(sr.isSuccess, 'Bulk delete should be successful');
  }

  @isTest
  static void testDeleteRecords_Null() {
    Test.startTest();
    SmartGridController.SaveResult sr = SmartGridController.deleteRecords(null);
    Test.stopTest();
    System.assert(sr.isSuccess, 'Should return success for null');
  }

  @isTest
  static void testSaveRecords_InsertNew() {
    Account acc = new Account(Name = 'New Insert Test');
    Test.startTest();
    SmartGridController.SaveResult sr = SmartGridController.saveRecords(new List<SObject>{acc});
    Test.stopTest();
    System.assert(sr.isSuccess, 'Insert should be successful');
    System.assertEquals(1, [SELECT count() FROM Account WHERE Name = 'New Insert Test'], 'Account should be inserted');
  }

  @isTest
  static void testSaveRecords_InsertPartialSuccess() {
    Account acc1 = new Account(Name = 'Valid Insert');
    Account acc2 = new Account(); // Missing Name
    Test.startTest();
    SmartGridController.SaveResult sr = SmartGridController.saveRecords(new List<SObject>{acc1, acc2});
    Test.stopTest();
    System.assertEquals(false, sr.isSuccess, 'Should be partial success');
    System.assertEquals(1, sr.rowErrors.size(), 'Should have 1 error');
    System.assertEquals('1', sr.rowErrors[0].id, 'Error ID should be the original index string');
  }
}

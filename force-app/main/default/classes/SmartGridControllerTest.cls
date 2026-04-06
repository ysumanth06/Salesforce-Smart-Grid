@isTest
public class SmartGridControllerTest {
  @isTest
  static void testGetGridConfig_Null() {
    Test.startTest();
    Smart_Grid_Config__mdt config = SmartGridController.getGridConfig(null);
    Test.stopTest();
    System.assertEquals(
      null,
      config,
      'Config should be null for null dev name'
    );
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
      'Industry',
      'Technology',
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
}

/**
 * @description PNB Unit Test Suite for SmartGridNLPDMLHandler.
 * Verifies safe natural language DML parsing, visual diff previews, and bulk execution.
 */
@IsTest
private class SmartGridNLPDMLHandlerTest {
  @TestSetup
  static void setupTestData() {
    SmartGridTestFactory.createAccounts(255, 'DML Test Account');
  }

  @IsTest
  static void testPreviewDML_UpdateRating() {
    List<Account> accts = [SELECT Id, Name, Rating FROM Account LIMIT 10];
    List<Id> acctIds = new List<Id>();
    for (Account a : accts) {
      acctIds.add(a.Id);
    }

    Test.startTest();
    SmartGridNLPDMLHandler.DmlPreviewResult preview = SmartGridNLPDMLHandler.previewDML(
      'Set Rating to Hot for selected accounts',
      'Account',
      acctIds,
      null
    );
    Test.stopTest();

    Assert.isTrue(preview.isSuccess, 'DML preview should succeed');
    Assert.areEqual('UPDATE', preview.operation, 'Operation should be UPDATE');
    Assert.areEqual(
      10,
      preview.totalAffectedRecords,
      'Should affect 10 records'
    );
    Assert.isTrue(
      preview.affectedFieldNames.contains('Rating'),
      'Affected fields should contain Rating'
    );
    Assert.isFalse(
      preview.previewRows.isEmpty(),
      'Preview rows should be generated'
    );
    Assert.areEqual('Hot', preview.previewRows[0].changes[0].newValue);
  }

  @IsTest
  static void testExecuteDML_Update() {
    List<Account> accts = [SELECT Id, Name, Rating FROM Account LIMIT 5];
    List<Id> acctIds = new List<Id>();
    for (Account a : accts) {
      acctIds.add(a.Id);
    }

    String updatesJson = '{"Rating":"Hot"}';

    Test.startTest();
    SmartGridNLPDMLHandler.DmlExecutionResult execResult = SmartGridNLPDMLHandler.executeDML(
      'UPDATE',
      acctIds,
      updatesJson
    );
    Test.stopTest();

    Assert.isTrue(execResult.isSuccess, 'Execution should succeed');
    Assert.areEqual(5, execResult.successCount, '5 records should succeed');
    Assert.areEqual(0, execResult.failureCount, '0 failures expected');

    List<Account> updatedAccts = [
      SELECT Rating
      FROM Account
      WHERE Id IN :acctIds
    ];
    for (Account a : updatedAccts) {
      Assert.areEqual('Hot', a.Rating, 'Account rating should now be Hot');
    }
  }

  @IsTest
  static void testPreviewAndExecute_Delete() {
    List<Account> accts = [SELECT Id FROM Account LIMIT 3];
    List<Id> acctIds = new List<Id>();
    for (Account a : accts) {
      acctIds.add(a.Id);
    }

    Test.startTest();
    SmartGridNLPDMLHandler.DmlPreviewResult preview = SmartGridNLPDMLHandler.previewDML(
      'Delete selected accounts',
      'Account',
      acctIds,
      null
    );

    SmartGridNLPDMLHandler.DmlExecutionResult execResult = SmartGridNLPDMLHandler.executeDML(
      'DELETE',
      acctIds,
      null
    );
    Test.stopTest();

    Assert.isTrue(preview.isSuccess, 'Delete preview should succeed');
    Assert.areEqual('DELETE', preview.operation);
    Assert.isTrue(execResult.isSuccess, 'Delete execution should succeed');
    Assert.areEqual(3, execResult.successCount);
  }

  @IsTest
  static void testPreviewDML_NegativeBlank() {
    Test.startTest();
    SmartGridNLPDMLHandler.DmlPreviewResult preview = SmartGridNLPDMLHandler.previewDML(
      '',
      'Account',
      null,
      null
    );
    Test.stopTest();

    Assert.isFalse(preview.isSuccess, 'Empty prompt should fail');
    Assert.isNotNull(preview.errorMessage);
  }

  @IsTest
  static void testExecuteDML_NegativeEmptyIds() {
    Test.startTest();
    SmartGridNLPDMLHandler.DmlExecutionResult execResult = SmartGridNLPDMLHandler.executeDML(
      'UPDATE',
      new List<Id>(),
      '{}'
    );
    Test.stopTest();

    Assert.isFalse(execResult.isSuccess, 'Empty IDs should fail');
    Assert.isFalse(execResult.errorMessages.isEmpty());
  }

  @IsTest
  static void testExecuteDML_Bulk255Records() {
    List<Account> allAccts = [SELECT Id FROM Account];
    List<Id> allIds = new List<Id>();
    for (Account a : allAccts) {
      allIds.add(a.Id);
    }

    Test.startTest();
    SmartGridNLPDMLHandler.DmlExecutionResult execResult = SmartGridNLPDMLHandler.executeDML(
      'UPDATE',
      allIds,
      '{"Rating":"Warm"}'
    );
    Test.stopTest();

    Assert.isTrue(execResult.isSuccess, 'Bulk DML should succeed');
    Assert.areEqual(allIds.size(), execResult.successCount);
  }
}

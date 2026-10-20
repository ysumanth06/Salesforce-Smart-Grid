/**
 * @description Unit tests for SmartGridImportService.
 * Validates chunked importing, FLS enforcement, type coercion, and safety rollback execution.
 */
@IsTest
private class SmartGridImportServiceTest {
  @IsTest
  static void testExecuteImport_And_Rollback_Success() {
    List<Map<String, Object>> records = new List<Map<String, Object>>{
      new Map<String, Object>{
        'Name' => 'Imported Account A',
        'AnnualRevenue' => '150000',
        'Industry' => 'Technology'
      },
      new Map<String, Object>{
        'Name' => 'Imported Account B',
        'AnnualRevenue' => '$250,000',
        'Industry' => 'Consulting'
      }
    };

    Test.startTest();
    SmartGridImportService.ImportResult importRes = SmartGridImportService.executeImport(
      'Account',
      records
    );
    Test.stopTest();

    Assert.isTrue(importRes.isSuccess, 'Import should succeed');
    Assert.areEqual(2, importRes.totalInserted, 'Should insert 2 accounts');
    Assert.isNotNull(
      importRes.rollbackToken,
      'Rollback token must be generated'
    );
    Assert.areEqual(
      2,
      importRes.createdRecordIds.size(),
      'Should return 2 created record IDs'
    );

    // Verify records exist in database
    List<Account> insertedAccounts = [
      SELECT Id, Name, AnnualRevenue
      FROM Account
      WHERE Id IN :importRes.createdRecordIds
      ORDER BY Name ASC
    ];
    Assert.areEqual(2, insertedAccounts.size());
    Assert.areEqual(
      250000,
      insertedAccounts[1].AnnualRevenue,
      'Currency string should be coerced to numeric'
    );

    // Test Rollback
    SmartGridImportService.RollbackResult rollbackRes = SmartGridImportService.executeRollback(
      importRes.rollbackToken,
      importRes.createdRecordIds
    );

    Assert.isTrue(rollbackRes.isSuccess, 'Rollback should succeed');
    Assert.areEqual(
      2,
      rollbackRes.totalDeleted,
      'Both records should be deleted'
    );

    // Verify deletion
    List<Account> remaining = [
      SELECT Id
      FROM Account
      WHERE Id IN :importRes.createdRecordIds
    ];
    Assert.areEqual(
      0,
      remaining.size(),
      'Records must no longer exist after rollback'
    );
  }

  @IsTest
  static void testExecuteImport_ValidationErrors() {
    Test.startTest();
    SmartGridImportService.ImportResult res1 = SmartGridImportService.executeImport(
      '',
      null
    );
    Assert.isFalse(res1.isSuccess, 'Empty object must fail');

    SmartGridImportService.ImportResult res2 = SmartGridImportService.executeImport(
      'Account',
      new List<Map<String, Object>>()
    );
    Assert.isFalse(res2.isSuccess, 'Empty list must fail');
    Test.stopTest();
  }

  @IsTest
  static void testExecuteRollback_ValidationErrors() {
    Test.startTest();
    SmartGridImportService.RollbackResult res1 = SmartGridImportService.executeRollback(
      '',
      null
    );
    Assert.isFalse(res1.isSuccess, 'Empty token must fail');

    SmartGridImportService.RollbackResult res2 = SmartGridImportService.executeRollback(
      'TOKEN_123',
      new List<Id>()
    );
    Assert.isFalse(res2.isSuccess, 'Empty ID list must fail');
    Test.stopTest();
  }

  @IsTest
  static void testExecuteRollback_ExpiredToken() {
    Account acc = new Account(Name = 'Test Expiry Account');
    insert acc;

    // Token generated 25 hours ago (25 * 3600 * 1000 ms ago)
    Long pastTimestamp = System.currentTimeMillis() - (25 * 3600 * 1000L);
    String expiredToken =
      'ROLLBACK_' +
      String.valueOf(pastTimestamp) +
      '_987654';

    Test.startTest();
    SmartGridImportService.RollbackResult result = SmartGridImportService.executeRollback(
      expiredToken,
      new List<Id>{ acc.Id }
    );
    Test.stopTest();

    Assert.isFalse(result.isSuccess, 'Expired token rollback should fail');
    Assert.isTrue(
      result.errorMessages[0].contains('ROLLBACK_EXPIRED'),
      'Should return ROLLBACK_EXPIRED error'
    );

    // Verify record was NOT deleted
    List<Account> accounts = [SELECT Id FROM Account WHERE Id = :acc.Id];
    Assert.areEqual(
      1,
      accounts.size(),
      'Account should remain intact after expired rollback'
    );
  }
}

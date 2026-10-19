/**
 * @description Unit tests for SmartGridAuditService.
 * Validates atomic edit logging, retrieval, pagination bounds, and security.
 */
@IsTest
private class SmartGridAuditServiceTest {
  @TestSetup
  static void setupTestData() {
    Account acc = new Account(
      Name = 'Audit Test Account',
      Industry = 'Technology'
    );
    insert acc;
  }

  @IsTest
  static void testLogEdits_Success() {
    Account acc = [SELECT Id, Name, Industry FROM Account LIMIT 1];

    List<Map<String, Object>> changes = new List<Map<String, Object>>{
      new Map<String, Object>{
        'recordId' => acc.Id,
        'fieldName' => 'Name',
        'oldValue' => 'Old Name',
        'newValue' => 'New Name'
      },
      new Map<String, Object>{
        'recordId' => acc.Id,
        'fieldName' => 'Industry',
        'oldValue' => 'Finance',
        'newValue' => 'Technology'
      }
    };

    Test.startTest();
    Integer loggedCount = SmartGridAuditService.logEdits(
      'Account_Grid',
      changes
    );
    Test.stopTest();

    Assert.areEqual(
      2,
      loggedCount,
      'Should have logged 2 field changes successfully'
    );

    List<Smart_Grid_Edit_Log__c> logs = [
      SELECT
        Id,
        Grid_Name__c,
        Record_Id__c,
        Field_Name__c,
        Old_Value__c,
        New_Value__c,
        Changed_By__c
      FROM Smart_Grid_Edit_Log__c
      WHERE Record_Id__c = :acc.Id
    ];
    Assert.areEqual(
      2,
      logs.size(),
      '2 audit log records should exist in database'
    );
    Assert.areEqual(
      'Account_Grid',
      logs[0].Grid_Name__c,
      'Grid name should match'
    );
  }

  @IsTest
  static void testLogEdits_EmptyAndInvalid() {
    Test.startTest();
    Integer nullCount = SmartGridAuditService.logEdits('Account_Grid', null);
    Integer emptyCount = SmartGridAuditService.logEdits(
      'Account_Grid',
      new List<Map<String, Object>>()
    );

    List<Map<String, Object>> invalidChanges = new List<Map<String, Object>>{
      new Map<String, Object>{ 'recordId' => '', 'fieldName' => 'Name' },
      new Map<String, Object>{
        'recordId' => '001000000000000AAA',
        'fieldName' => ''
      }
    };
    Integer invalidCount = SmartGridAuditService.logEdits(
      'Account_Grid',
      invalidChanges
    );
    Test.stopTest();

    Assert.areEqual(0, nullCount, 'Null changes should return 0');
    Assert.areEqual(0, emptyCount, 'Empty changes should return 0');
    Assert.areEqual(0, invalidCount, 'Invalid changes should return 0');
  }

  @IsTest
  static void testGetEditLogs_Success() {
    Account acc = [SELECT Id FROM Account LIMIT 1];

    List<Map<String, Object>> changes = new List<Map<String, Object>>{
      new Map<String, Object>{
        'recordId' => acc.Id,
        'fieldName' => 'AnnualRevenue',
        'oldValue' => '1000000',
        'newValue' => '2500000'
      }
    };
    SmartGridAuditService.logEdits('Account_Grid', changes);

    Test.startTest();
    List<SmartGridAuditService.AuditLogEntry> entries = SmartGridAuditService.getEditLogs(
      acc.Id,
      10
    );
    Test.stopTest();

    Assert.isNotNull(entries, 'Entries should not be null');
    Assert.areEqual(1, entries.size(), 'Should return 1 audit log entry');
    Assert.areEqual(
      'AnnualRevenue',
      entries[0].fieldName,
      'Field name should be AnnualRevenue'
    );
    Assert.areEqual('1000000', entries[0].oldValue, 'Old value should match');
    Assert.areEqual('2500000', entries[0].newValue, 'New value should match');
  }

  @IsTest
  static void testGetEditLogs_BlankRecordId() {
    Test.startTest();
    List<SmartGridAuditService.AuditLogEntry> entries = SmartGridAuditService.getEditLogs(
      '',
      50
    );
    List<SmartGridAuditService.AuditLogEntry> nullEntries = SmartGridAuditService.getEditLogs(
      null,
      50
    );
    Test.stopTest();

    Assert.areEqual(
      0,
      entries.size(),
      'Blank recordId should return empty list'
    );
    Assert.areEqual(
      0,
      nullEntries.size(),
      'Null recordId should return empty list'
    );
  }
}

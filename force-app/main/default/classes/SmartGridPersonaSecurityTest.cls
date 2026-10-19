/**
 * @description QA Security & Persona Validation Test Suite.
 * Executes operations across Standard User, Power User, and Administrator personas under System.runAs.
 */
@IsTest
private class SmartGridPersonaSecurityTest {
  @TestSetup
  static void setupTestData() {
    Account acc = new Account(
      Name = 'Persona Test Account',
      Industry = 'Technology',
      AnnualRevenue = 500000
    );
    insert acc;
  }

  private static User createTestUser(String aliasSuffix) {
    Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
    String uniqueUsername =
      'smartgriduser' +
      DateTime.now().getTime() +
      aliasSuffix +
      '@test.org';
    User u = new User(
      Alias = 'sg' +
        aliasSuffix.substring(0, Math.min(aliasSuffix.length(), 4)),
      Email = 'smartgriduser@test.org',
      EmailEncodingKey = 'UTF-8',
      LastName = 'Tester_' + aliasSuffix,
      LanguageLocaleKey = 'en_US',
      LocaleSidKey = 'en_US',
      ProfileId = p.Id,
      TimeZoneSidKey = 'America/Los_Angeles',
      UserName = uniqueUsername
    );
    insert u;
    return u;
  }

  @IsTest
  static void testStandardUserPersona() {
    User stdUser = createTestUser('std');

    System.runAs(stdUser) {
      Test.startTest();
      // Verify entitlements without power user permission set
      Map<String, Object> entitlements = SmartGridLicenseService.getGridUserEntitlements(
        'Default'
      );
      Assert.isNotNull(entitlements, 'Entitlements map must return');

      // Verify standard cursor pagination query execution in USER_MODE
      SmartGridCursorService.CursorPageRequest req = new SmartGridCursorService.CursorPageRequest();
      req.objectApiName = 'Account';
      req.fields = new List<String>{ 'Id', 'Name', 'Industry' };
      req.pageSize = 10;
      SmartGridCursorService.CursorPageResult res = SmartGridCursorService.fetchCursorPage(
        req
      );
      Assert.isNotNull(res, 'Cursor page result should return');
      Assert.isTrue(
        res.records.size() >= 1,
        'Standard user should read Account in USER_MODE'
      );
      Test.stopTest();
    }
  }

  @IsTest
  static void testPowerUserPersona() {
    User pwrUser = createTestUser('pwr');

    // Assign SmartGrid_Power_User if permission set exists
    List<PermissionSet> psList = [
      SELECT Id
      FROM PermissionSet
      WHERE Name = 'SmartGrid_Power_User'
      LIMIT 1
    ];
    if (!psList.isEmpty()) {
      insert new PermissionSetAssignment(
        AssigneeId = pwrUser.Id,
        PermissionSetId = psList[0].Id
      );
    }

    System.runAs(pwrUser) {
      Test.startTest();
      Map<String, Object> entitlements = SmartGridLicenseService.getGridUserEntitlements(
        'Default'
      );
      Assert.isNotNull(
        entitlements,
        'Entitlements should return for power user'
      );

      // Verify multi-dimensional grouping service
      SmartGridGroupService.GroupRequest req = new SmartGridGroupService.GroupRequest();
      req.objectApiName = 'Account';
      req.groupByFields = new List<String>{ 'Industry' };
      req.aggregateFields = new List<String>{ 'AnnualRevenue' };
      req.limitSize = 10;
      SmartGridGroupService.GroupResult groupRes = SmartGridGroupService.getGroupedData(
        req
      );
      Assert.isTrue(
        groupRes.isSuccess,
        'Power user should execute grouping aggregation successfully'
      );

      // Verify currency conversions
      Decimal converted = SmartGridCurrencyService.convertAmount(
        100,
        'USD',
        'USD'
      );
      Assert.areEqual(
        100,
        converted,
        'Currency service should function for power user'
      );
      Test.stopTest();
    }
  }

  @IsTest
  static void testAdminPersona() {
    User adminUser = createTestUser('adm');

    // Assign SmartGrid_Admin if permission set exists
    List<PermissionSet> psList = [
      SELECT Id
      FROM PermissionSet
      WHERE Name = 'SmartGrid_Admin'
      LIMIT 1
    ];
    if (!psList.isEmpty()) {
      insert new PermissionSetAssignment(
        AssigneeId = adminUser.Id,
        PermissionSetId = psList[0].Id
      );
    }

    System.runAs(adminUser) {
      Account acc = [SELECT Id FROM Account LIMIT 1];

      Test.startTest();
      // Test audit log writing and reading
      List<Map<String, Object>> changes = new List<Map<String, Object>>{
        new Map<String, Object>{
          'recordId' => acc.Id,
          'fieldName' => 'Name',
          'oldValue' => 'Old',
          'newValue' => 'New'
        }
      };
      Integer logged = SmartGridAuditService.logEdits('Account_Grid', changes);
      Assert.areEqual(1, logged, 'Admin should log audit entries');

      List<SmartGridAuditService.AuditLogEntry> logs = SmartGridAuditService.getEditLogs(
        acc.Id,
        10
      );
      Assert.isNotNull(logs, 'Admin should query audit entries');
      Test.stopTest();
    }
  }
}

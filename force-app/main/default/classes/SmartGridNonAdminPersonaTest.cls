/**
 * @description End-to-end persona test verifying that non-admin Standard Users with
 *              SmartGrid_User and Smart_Grid_AI_Premium permission sets have complete
 *              and unhindered access to all grid, licensing, data quality, NLP, and
 *              view persistence features without running into FLS, object, or setup permission errors.
 */
@IsTest
private class SmartGridNonAdminPersonaTest {
  @TestSetup
  static void setupTestData() {
    // Create test Accounts for query, pagination, and quality testing
    List<Account> testAccounts = new List<Account>{
      new Account(
        Name = 'Persona Test Alpha Corp',
        Type = 'Prospect',
        Rating = 'Hot',
        AnnualRevenue = 500000
      ),
      new Account(
        Name = 'Persona Test Beta LLC',
        Type = 'Customer - Direct',
        Rating = 'Warm',
        AnnualRevenue = 250000
      ),
      new Account(
        Name = 'Persona Test Gamma Inc',
        Type = 'Customer - Channel',
        Rating = 'Cold',
        AnnualRevenue = null
      ),
      new Account(
        Name = 'Persona Test Delta Services',
        Type = null,
        Rating = null,
        AnnualRevenue = 100000
      )
    };
    insert testAccounts;
  }

  /**
   * @description Retrieves or creates a test standard user with the SmartGrid permission sets assigned.
   */
  private static User getStandardSmartGridUser() {
    Profile stdProfile = [
      SELECT Id
      FROM Profile
      WHERE Name = 'Standard User'
      LIMIT 1
    ];
    String uniqueUsername =
      'smartgrid.qa.' +
      System.currentTimeMillis() +
      '@testorg.com';

    User u = new User(
      FirstName = 'QA',
      LastName = 'Tester',
      Email = 'smartgrid.qa@testorg.com',
      Username = uniqueUsername,
      Alias = 'qatest',
      TimeZoneSidKey = 'America/Los_Angeles',
      LocaleSidKey = 'en_US',
      EmailEncodingKey = 'UTF-8',
      LanguageLocaleKey = 'en_US',
      ProfileId = stdProfile.Id
    );
    insert u;

    // Assign permission sets
    List<PermissionSet> psets = [
      SELECT Id
      FROM PermissionSet
      WHERE Name IN ('SmartGrid_User', 'Smart_Grid_AI_Premium')
    ];
    List<PermissionSetAssignment> psas = new List<PermissionSetAssignment>();
    for (PermissionSet ps : psets) {
      psas.add(
        new PermissionSetAssignment(AssigneeId = u.Id, PermissionSetId = ps.Id)
      );
    }
    insert psas;

    return u;
  }

  @IsTest
  static void testNonAdminEntitlementsAndLicensing() {
    User qaUser = getStandardSmartGridUser();

    System.runAs(qaUser) {
      Test.startTest();
      Map<String, Boolean> entitlements = SmartGridLicenseService.checkFeatureEntitlements();
      Boolean nlpEnabled = SmartGridLicenseService.isFeatureAccessible(
        'NLP_COMMAND_PALETTE'
      );
      Boolean dqEnabled = SmartGridLicenseService.isFeatureAccessible(
        'AI_SUGGESTIONS'
      );
      Test.stopTest();

      System.assertNotEquals(
        null,
        entitlements,
        'Entitlements map should not be null'
      );
      System.assertEquals(
        true,
        entitlements.get('CORE_GRID'),
        'Standard user should have core grid access'
      );
      System.assertEquals(
        true,
        nlpEnabled,
        'NLP command palette should be accessible'
      );
      System.assertEquals(
        true,
        dqEnabled,
        'AI suggestions should be accessible'
      );
    }
  }

  @IsTest
  static void testNonAdminGridConfigAndDataOperations() {
    User qaUser = getStandardSmartGridUser();

    System.runAs(qaUser) {
      Test.startTest();
      // 1. Load Grid Configuration
      SmartGridController.GridConfigDTO config = SmartGridController.getGridConfig(
        'Account_Default_Grid'
      );
      if (config != null) {
        System.assertNotEquals(
          null,
          config.objectApiName,
          'Object API Name should be Account'
        );
      }

      // 2. Query Paginated Records
      SmartGridController.PagedResult result = SmartGridController.getRecordsPaged(
        'Account',
        new List<String>{ 'Id', 'Name', 'Type', 'Rating' },
        new Map<String, Object>(),
        null,
        null,
        null,
        'Name',
        'ASC',
        10,
        1
      );
      System.assertNotEquals(null, result, 'Paged result should be returned');
      System.assert(
        result.totalSize >= 4,
        'Should find at least 4 test accounts'
      );
      System.assert(result.records.size() >= 4, 'Page should contain records');

      // 3. Save Records (DML update via SObject)
      Account accToUpdate = (Account) result.records[0];
      accToUpdate.Rating = 'Hot';
      SmartGridController.SaveResult updateResult = SmartGridController.saveRecords(
        new List<SObject>{ accToUpdate }
      );
      System.assertEquals(
        true,
        updateResult.isSuccess,
        'Save should succeed for Standard User'
      );

      // 4. Save New Record (DML insert via SObject)
      Account newAcc = new Account(
        Name = 'Persona Newly Created Account',
        Type = 'Prospect'
      );
      SmartGridController.SaveResult insertResult = SmartGridController.saveRecords(
        new List<SObject>{ newAcc }
      );
      System.assertEquals(
        true,
        insertResult.isSuccess,
        'Insert should succeed for Standard User'
      );

      // 5. Delete Records (DML delete)
      SmartGridController.SaveResult deleteResult = SmartGridController.deleteRecords(
        new List<SObject>{ newAcc }
      );
      System.assertEquals(
        true,
        deleteResult.isSuccess,
        'Delete should succeed for Standard User'
      );
      Test.stopTest();
    }
  }

  @IsTest
  static void testNonAdminAiAndQualityServices() {
    User qaUser = getStandardSmartGridUser();

    System.runAs(qaUser) {
      Test.startTest();
      // 1. NLP Engine execution
      SmartGridNLPEngine.TranslationResult nlpRes = SmartGridNLPEngine.processPrompt(
        'show prospect accounts',
        'Account',
        'Account_Default_Grid',
        new List<String>{ 'Id', 'Name', 'Type', 'Rating' }
      );
      System.assertNotEquals(null, nlpRes, 'NLP result should not be null');

      // 2. Data Quality Analysis execution
      SmartGridDataQualityService.QualityAnalysisResult dqSummary = SmartGridDataQualityService.analyzeDataQuality(
        'Account',
        new List<String>{ 'Name', 'Type', 'Rating', 'AnnualRevenue' }
      );
      System.assertNotEquals(
        null,
        dqSummary,
        'Data quality summary should not be null'
      );
      System.assert(
        dqSummary.healthScore >= 0,
        'Health score should be calculated'
      );
      System.assert(
        dqSummary.totalRecordsEvaluated >= 4,
        'Should analyze at least 4 test accounts'
      );
      Test.stopTest();
    }
  }

  @IsTest
  static void testNonAdminViewsAndPreferencesPersistence() {
    User qaUser = getStandardSmartGridUser();

    System.runAs(qaUser) {
      Test.startTest();
      // 1. Save View
      Smart_Grid_View__c view = SmartGridController.saveView(
        null,
        'QA Test View',
        'Account',
        '{"fields":["Name","Type"]}',
        false
      );
      System.assertNotEquals(
        null,
        view.Id,
        'User view should be persisted with ID'
      );

      // 2. Query Views
      List<Smart_Grid_View__c> views = SmartGridController.getViews('Account');
      System.assert(views.size() >= 1, 'Should find at least 1 saved view');

      // 3. Save Preferences via Service
      SmartGridUserPrefService.savePrefs(
        'Account',
        '{"pageSize":50,"density":"compact"}'
      );

      // 4. Query Preferences
      String loadedPref = SmartGridUserPrefService.getPrefs('Account');
      System.assertNotEquals(
        null,
        loadedPref,
        'User preferences should be retrievable'
      );
      System.assert(
        loadedPref.contains('50'),
        'Preferences should contain saved pageSize'
      );

      // 5. Delete View
      SmartGridController.deleteView(view.Id);
      List<Smart_Grid_View__c> remainingViews = SmartGridController.getViews(
        'Account'
      );
      Boolean foundDeleted = false;
      for (Smart_Grid_View__c v : remainingViews) {
        if (v.Id == view.Id) {
          foundDeleted = true;
        }
      }
      System.assertEquals(
        false,
        foundDeleted,
        'Deleted view should not be returned'
      );
      Test.stopTest();
    }
  }
}

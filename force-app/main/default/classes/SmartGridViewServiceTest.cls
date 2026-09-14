@IsTest
public class SmartGridViewServiceTest {
  @IsTest
  static void testSaveView_And_GetViews_Positive() {
    Test.startTest();
    Smart_Grid_View__c saved = SmartGridViewService.saveView(
      null,
      'My Open Accounts',
      'Account',
      '{"columns":["Name","Industry"]}',
      false
    );
    Test.stopTest();

    Assert.isNotNull(saved.Id, 'Saved view ID should not be null');

    List<Smart_Grid_View__c> views = SmartGridViewService.getViews('Account');
    Assert.areEqual(1, views.size(), 'Should return 1 saved view');
    Assert.areEqual(
      'My Open Accounts',
      views[0].View_Name__c,
      'Name should match'
    );
    Assert.isFalse(views[0].Is_Default__c, 'Is_Default should be false');
  }

  @IsTest
  static void testSaveView_DefaultSwitching_TC_09_P4() {
    // 1. Create first default view
    Smart_Grid_View__c view1 = SmartGridViewService.saveView(
      null,
      'Default View 1',
      'Account',
      '{"columns":["Name"]}',
      true
    );
    Assert.isTrue(view1.Is_Default__c, 'View 1 should be default');

    // 2. Create second default view -> view1 should no longer be default
    Test.startTest();
    Smart_Grid_View__c view2 = SmartGridViewService.saveView(
      null,
      'Default View 2',
      'Account',
      '{"columns":["Name","BillingCity"]}',
      true
    );
    Test.stopTest();

    List<Smart_Grid_View__c> views = SmartGridViewService.getViews('Account');
    Assert.areEqual(2, views.size(), 'Should have 2 views');

    for (Smart_Grid_View__c v : views) {
      if (v.Id == view2.Id) {
        Assert.isTrue(v.Is_Default__c, 'View 2 should now be the default');
      } else if (v.Id == view1.Id) {
        Assert.isFalse(v.Is_Default__c, 'View 1 should no longer be default');
      }
    }
  }

  @IsTest
  static void testUpdateExistingView() {
    Smart_Grid_View__c view = SmartGridViewService.saveView(
      null,
      'Original Name',
      'Account',
      '{"col":"Name"}',
      false
    );

    Test.startTest();
    Smart_Grid_View__c updated = SmartGridViewService.saveView(
      view.Id,
      'Updated Name',
      'Account',
      '{"col":"Industry"}',
      true
    );
    Test.stopTest();

    Assert.areEqual(view.Id, updated.Id, 'ID should remain same');
    Assert.areEqual(
      'Updated Name',
      updated.View_Name__c,
      'Name should be updated'
    );
    Assert.isTrue(updated.Is_Default__c, 'Should now be default');
  }

  @IsTest
  static void testDeleteView_TC_09_N1() {
    Smart_Grid_View__c view = SmartGridViewService.saveView(
      null,
      'To Delete',
      'Account',
      '{}',
      false
    );

    Test.startTest();
    SmartGridViewService.deleteView(view.Id);
    Test.stopTest();

    List<Smart_Grid_View__c> views = SmartGridViewService.getViews('Account');
    Assert.areEqual(0, views.size(), 'View should be deleted');
  }

  @IsTest
  static void testQueryHistory_Last10Maintained_TC_09_P3() {
    Test.startTest();
    // Simulate 12 query executions
    for (Integer i = 1; i <= 12; i++) {
      SmartGridViewService.saveQueryHistory(
        'Account',
        '{"filterIndex":' + i + '}'
      );
    }
    Test.stopTest();

    List<Smart_Grid_View__c> historyRecords = [
      SELECT Id, View_Name__c
      FROM Smart_Grid_View__c
      WHERE Object_API_Name__c = 'Account' AND View_Name__c LIKE '__history_%'
    ];

    Assert.areEqual(
      10,
      historyRecords.size(),
      'Should maintain exactly the last 10 history entries'
    );
  }

  @IsTest
  static void testUserPrivacy_TC_09_N2() {
    // Run as standard user A
    Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
    User userA = new User(
      Alias = 'usera',
      Email = 'usera_test@example.com',
      EmailEncodingKey = 'UTF-8',
      LastName = 'UserA',
      LanguageLocaleKey = 'en_US',
      LocaleSidKey = 'en_US',
      ProfileId = p.Id,
      TimeZoneSidKey = 'America/Los_Angeles',
      UserName = 'usera_smartgrid_test' +
        Datetime.now().getTime() +
        '@example.com'
    );
    insert userA;

    // Give User A permission set
    PermissionSet ps = [
      SELECT Id
      FROM PermissionSet
      WHERE Name = 'SmartGrid_User'
      LIMIT 1
    ];
    insert new PermissionSetAssignment(
      AssigneeId = userA.Id,
      PermissionSetId = ps.Id
    );

    System.runAs(userA) {
      SmartGridViewService.saveView(
        null,
        'User A Secret View',
        'Account',
        '{}',
        false
      );
      List<Smart_Grid_View__c> aViews = SmartGridViewService.getViews(
        'Account'
      );
      Assert.areEqual(1, aViews.size(), 'User A should see their view');
    }

    // Now check current user (User B)
    List<Smart_Grid_View__c> bViews = SmartGridViewService.getViews('Account');
    for (Smart_Grid_View__c v : bViews) {
      Assert.areNotEqual(
        'User A Secret View',
        v.View_Name__c,
        'User B should not see User A views'
      );
    }
  }

  @IsTest
  static void testSaveView_Validation_Negative() {
    try {
      SmartGridViewService.saveView(null, '', 'Account', '{}', false);
      Assert.fail('Should throw exception for blank view name');
    } catch (AuraHandledException e) {
      Assert.isTrue(true, 'Caught validation exception');
    }

    try {
      SmartGridViewService.saveView(null, 'Valid', '', '{}', false);
      Assert.fail('Should throw exception for blank object name');
    } catch (AuraHandledException e) {
      Assert.isTrue(true, 'Caught validation exception');
    }
  }

  @IsTest
  static void testBulkViews_TC_09_B1() {
    List<Smart_Grid_View__c> bulkViews = new List<Smart_Grid_View__c>();
    Id currUserId = UserInfo.getUserId();
    for (Integer i = 0; i < 50; i++) {
      bulkViews.add(
        new Smart_Grid_View__c(
          User__c = currUserId,
          Object_API_Name__c = 'Contact',
          View_Name__c = 'Bulk View ' + i,
          View_Config_JSON__c = '{"index":' + i + '}',
          Is_Default__c = false
        )
      );
    }
    insert bulkViews;

    Test.startTest();
    List<Smart_Grid_View__c> results = SmartGridViewService.getViews('Contact');
    Test.stopTest();

    Assert.areEqual(50, results.size(), 'Should load 50 views performantly');
  }
}

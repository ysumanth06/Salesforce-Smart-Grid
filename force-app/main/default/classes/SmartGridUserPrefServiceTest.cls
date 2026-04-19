@isTest
public class SmartGridUserPrefServiceTest {

    @testSetup
    static void setupTestData() {
        // Create user prefs
        Smart_Grid_User_Pref__c pref = new Smart_Grid_User_Pref__c(
            Object_API_Name__c = 'Account',
            Preferences_JSON__c = '{"columns":[{"label":"Name","fieldName":"Name"}]}',
            User__c = UserInfo.getUserId()
        );
        insert pref;
    }

    @isTest
    static void testGetPrefs_Success() {
        Test.startTest();
        String result = SmartGridUserPrefService.getPrefs('Account');
        Test.stopTest();

        System.assertNotEquals(null, result, 'Preferences should be returned');
        System.assert(result.contains('Name'), 'Preferences JSON should contain Name');
    }

    @isTest
    static void testGetPrefs_NotFound() {
        Test.startTest();
        String result = SmartGridUserPrefService.getPrefs('Contact');
        Test.stopTest();

        System.assertEquals(null, result, 'Preferences should be null for an object without preferences');
    }

    @isTest
    static void testSavePrefs_InsertNew() {
        Test.startTest();
        SmartGridUserPrefService.savePrefs('Contact', '{"columns":[{"label":"LastName","fieldName":"LastName"}]}');
        Test.stopTest();

        List<Smart_Grid_User_Pref__c> prefs = [SELECT Preferences_JSON__c FROM Smart_Grid_User_Pref__c WHERE Object_API_Name__c = 'Contact' AND User__c = :UserInfo.getUserId()];
        System.assertEquals(1, prefs.size(), 'One preference record should be created');
        System.assert(prefs[0].Preferences_JSON__c.contains('LastName'), 'The correct JSON should be saved');
    }

    @isTest
    static void testSavePrefs_UpdateExisting() {
        Test.startTest();
        SmartGridUserPrefService.savePrefs('Account', '{"columns":[{"label":"Industry","fieldName":"Industry"}]}');
        Test.stopTest();

        List<Smart_Grid_User_Pref__c> prefs = [SELECT Preferences_JSON__c FROM Smart_Grid_User_Pref__c WHERE Object_API_Name__c = 'Account' AND User__c = :UserInfo.getUserId()];
        System.assertEquals(1, prefs.size(), 'Still only one preference record should exist for Account');
        System.assert(prefs[0].Preferences_JSON__c.contains('Industry'), 'The JSON should be updated');
    }

    @isTest
    static void testResetPrefs() {
        Test.startTest();
        SmartGridUserPrefService.resetPrefs('Account');
        Test.stopTest();

        List<Smart_Grid_User_Pref__c> prefs = [SELECT Id FROM Smart_Grid_User_Pref__c WHERE Object_API_Name__c = 'Account' AND User__c = :UserInfo.getUserId()];
        System.assertEquals(0, prefs.size(), 'Preference record should be deleted');
    }
}

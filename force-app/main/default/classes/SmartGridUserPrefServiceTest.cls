@IsTest
private class SmartGridUserPrefServiceTest {
    
    @IsTest
    static void testSaveAndGetPrefs() {
        String objectName = 'Account';
        String jsonPrefs = '{"hiddenColumns":["AnnualRevenue"],"frozenColumns":["Name"]}';
        
        Test.startTest();
        Smart_Grid_User_Pref__c savedPref = SmartGridUserPrefService.savePrefs(objectName, jsonPrefs);
        Smart_Grid_User_Pref__c retrievedPref = SmartGridUserPrefService.getPrefs(objectName);
        Test.stopTest();
        
        System.assertNotEquals(null, savedPref, 'Saved preference should not be null');
        System.assertEquals(UserInfo.getUserId(), savedPref.User__c, 'User should be current user');
        System.assertEquals(objectName, savedPref.Object_API_Name__c, 'Object API Name should match');
        System.assertEquals(jsonPrefs, savedPref.Preferences_JSON__c, 'JSON string should match');
        
        System.assertNotEquals(null, retrievedPref, 'Retrieved preference should not be null');
        System.assertEquals(savedPref.Id, retrievedPref.Id, 'IDs should match');
    }

    @IsTest
    static void testResetPrefs() {
        String objectName = 'Account';
        String jsonPrefs = '{"hiddenColumns":["AnnualRevenue"]}';
        
        SmartGridUserPrefService.savePrefs(objectName, jsonPrefs);
        Smart_Grid_User_Pref__c prefBefore = SmartGridUserPrefService.getPrefs(objectName);
        System.assertNotEquals(null, prefBefore, 'Preference should exist before reset');
        
        Test.startTest();
        SmartGridUserPrefService.resetPrefs(objectName);
        Test.stopTest();
        
        Smart_Grid_User_Pref__c prefAfter = SmartGridUserPrefService.getPrefs(objectName);
        System.assertEquals(null, prefAfter, 'Preference should be null after reset');
    }

    @IsTest
    static void testGetPrefsEmpty() {
        Test.startTest();
        Smart_Grid_User_Pref__c pref = SmartGridUserPrefService.getPrefs('Contact');
        Smart_Grid_User_Pref__c blankPref = SmartGridUserPrefService.getPrefs('');
        Test.stopTest();
        
        System.assertEquals(null, pref, 'Preference should be null for non-existent record');
        System.assertEquals(null, blankPref, 'Preference should be null for blank object name');
    }

    @IsTest
    static void testSavePrefsBlank() {
        Test.startTest();
        try {
            SmartGridUserPrefService.savePrefs('', '{}');
            System.assert(false, 'Should have thrown exception for blank object name');
        } catch (Exception e) {
            System.assert(e.getMessage().contains('Object API Name is required'), 'Error message should match');
        }
        Test.stopTest();
    }

    @IsTest
    static void testResetPrefsBlank() {
        Test.startTest();
        SmartGridUserPrefService.resetPrefs('');
        // Should not throw exception
        Test.stopTest();
    }
}

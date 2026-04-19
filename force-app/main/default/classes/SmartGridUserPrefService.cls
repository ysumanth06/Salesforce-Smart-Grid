public with sharing class SmartGridUserPrefService {

    @AuraEnabled(cacheable=false)
    public static String getPrefs(String objectApiName) {
        try {
            List<Smart_Grid_User_Pref__c> prefs = [
                SELECT Preferences_JSON__c 
                FROM Smart_Grid_User_Pref__c 
                WHERE Object_API_Name__c = :objectApiName 
                AND User__c = :UserInfo.getUserId()
                WITH USER_MODE
                LIMIT 1
            ];
            return prefs.isEmpty() ? null : prefs[0].Preferences_JSON__c;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static void savePrefs(String objectApiName, String prefsJson) {
        try {
            List<Smart_Grid_User_Pref__c> prefs = [
                SELECT Id 
                FROM Smart_Grid_User_Pref__c 
                WHERE Object_API_Name__c = :objectApiName 
                AND User__c = :UserInfo.getUserId()
                WITH USER_MODE
                LIMIT 1
            ];
            
            Smart_Grid_User_Pref__c prefToSave = new Smart_Grid_User_Pref__c(
                Object_API_Name__c = objectApiName,
                Preferences_JSON__c = prefsJson,
                User__c = UserInfo.getUserId()
            );

            if (!prefs.isEmpty()) {
                prefToSave.Id = prefs[0].Id;
            }

            upsert as user prefToSave;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static void resetPrefs(String objectApiName) {
        try {
            List<Smart_Grid_User_Pref__c> prefs = [
                SELECT Id 
                FROM Smart_Grid_User_Pref__c 
                WHERE Object_API_Name__c = :objectApiName 
                AND User__c = :UserInfo.getUserId()
                WITH USER_MODE
            ];
            
            if (!prefs.isEmpty()) {
                delete as user prefs;
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}

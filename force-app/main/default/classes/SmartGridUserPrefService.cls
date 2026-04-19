/**
 * @description Service class for managing Smart Grid User Preferences.
 * Handles GET, UPSERT, and DELETE operations for user-specific grid overrides.
 */
public with sharing class SmartGridUserPrefService {
    
    /**
     * @description Retrieves the user preference record for the current user and object.
     * @param objectApiName The API name of the object context.
     * @return Smart_Grid_User_Pref__c The user preference record or null if not found.
     */
    @AuraEnabled
    public static Smart_Grid_User_Pref__c getPrefs(String objectApiName) {
        if (String.isBlank(objectApiName)) {
            return null;
        }

        List<Smart_Grid_User_Pref__c> prefs = [
            SELECT Id, Object_API_Name__c, Preferences_JSON__c, User__c
            FROM Smart_Grid_User_Pref__c
            WHERE User__c = :UserInfo.getUserId()
            AND Object_API_Name__c = :objectApiName
            WITH USER_MODE
            LIMIT 1
        ];

        return prefs.isEmpty() ? null : prefs[0];
    }

    /**
     * @description Saves (Upserts) the user preference record for the current user and object.
     * @param objectApiName The API name of the object context.
     * @param preferencesJson The JSON string representing the preferences.
     * @return Smart_Grid_User_Pref__c The saved user preference record.
     */
    @AuraEnabled
    public static Smart_Grid_User_Pref__c savePrefs(String objectApiName, String preferencesJson) {
        if (String.isBlank(objectApiName)) {
            throw new AuraHandledException('Object API Name is required.');
        }

        Smart_Grid_User_Pref__c pref = getPrefs(objectApiName);
        if (pref == null) {
            pref = new Smart_Grid_User_Pref__c(
                User__c = UserInfo.getUserId(),
                Object_API_Name__c = objectApiName
            );
        }
        
        pref.Preferences_JSON__c = preferencesJson;

        try {
            upsert as user pref;
            return pref;
        } catch (Exception e) {
            throw new AuraHandledException('Error saving preferences: ' + e.getMessage());
        }
    }

    /**
     * @description Resets (Deletes) the user preference record for the current user and object.
     * @param objectApiName The API name of the object context.
     */
    @AuraEnabled
    public static void resetPrefs(String objectApiName) {
        if (String.isBlank(objectApiName)) {
            return;
        }

        Smart_Grid_User_Pref__c pref = getPrefs(objectApiName);
        if (pref != null) {
            try {
                delete as user pref;
            } catch (Exception e) {
                throw new AuraHandledException('Error resetting preferences: ' + e.getMessage());
            }
        }
    }
}

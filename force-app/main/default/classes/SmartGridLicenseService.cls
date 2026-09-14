/**
 * @description Licensing and Feature Gating Service for Smart Grid AppExchange distribution.
 * Enforces server-side license verification against Smart_Grid_License__mdt and Permission Sets.
 */
public with sharing class SmartGridLicenseService {
  @TestVisible
  public static Map<String, Boolean> mockEntitlements;

  /**
   * @description Checks feature entitlements for the current running user
   * @return Map of feature name to Boolean indicating access grant
   */
  @AuraEnabled(cacheable=true)
  public static Map<String, Boolean> checkFeatureEntitlements() {
    if (mockEntitlements != null) {
      return mockEntitlements;
    }

    Map<String, Boolean> entitlements = new Map<String, Boolean>();

    // Default entitlements
    entitlements.put('CORE_GRID', true);
    entitlements.put('NLP_COMMAND_PALETTE', false);
    entitlements.put('AI_SUGGESTIONS', false);
    entitlements.put('CONVERSATIONAL_ASSISTANT', false);

    List<Smart_Grid_License__mdt> licenses = [
      SELECT Feature_Name__c, Is_Premium__c, Is_Enabled__c, Permission_Set__c
      FROM Smart_Grid_License__mdt
      WITH USER_MODE
    ];

    if (licenses.isEmpty()) {
      // Default: grant full access in dev/trial mode if no license records configured
      entitlements.put('NLP_COMMAND_PALETTE', true);
      entitlements.put('AI_SUGGESTIONS', true);
      entitlements.put('CONVERSATIONAL_ASSISTANT', true);
      return entitlements;
    }

    Set<String> requiredPermSets = new Set<String>();
    for (Smart_Grid_License__mdt lic : licenses) {
      if (
        lic.Is_Enabled__c &&
        lic.Is_Premium__c &&
        String.isNotBlank(lic.Permission_Set__c)
      ) {
        requiredPermSets.add(lic.Permission_Set__c);
      }
    }

    // Query active permission set assignments for running user
    Set<String> userAssignedPermSets = new Set<String>();
    if (!requiredPermSets.isEmpty()) {
      Id userId = UserInfo.getUserId();
      for (PermissionSetAssignment psa : [
        SELECT PermissionSet.Name
        FROM PermissionSetAssignment
        WHERE AssigneeId = :userId AND PermissionSet.Name IN :requiredPermSets
        WITH USER_MODE
      ]) {
        userAssignedPermSets.add(psa.PermissionSet.Name);
      }
    }

    for (Smart_Grid_License__mdt lic : licenses) {
      if (!lic.Is_Enabled__c) {
        entitlements.put(lic.Feature_Name__c, false);
      } else if (!lic.Is_Premium__c) {
        entitlements.put(lic.Feature_Name__c, true);
      } else {
        Boolean hasPerm =
          String.isNotBlank(lic.Permission_Set__c) &&
          userAssignedPermSets.contains(lic.Permission_Set__c);
        entitlements.put(lic.Feature_Name__c, hasPerm);
      }
    }

    return entitlements;
  }

  /**
   * @description Verifies if a specific feature is enabled and accessible to the running user
   * @param featureName Unique feature key
   * @return Boolean
   */
  public static Boolean isFeatureAccessible(String featureName) {
    if (String.isBlank(featureName)) {
      return false;
    }
    Map<String, Boolean> entitlements = checkFeatureEntitlements();
    return entitlements.containsKey(featureName) &&
      entitlements.get(featureName) == true;
  }
}

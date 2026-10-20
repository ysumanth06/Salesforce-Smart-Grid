/**
 * @description Licensing and Feature Gating Service for Smart Grid AppExchange distribution.
 * Enforces server-side license verification against Smart_Grid_License__mdt and Permission Sets.
 */
public with sharing class SmartGridLicenseService {
  @TestVisible
  public static Map<String, Boolean> mockEntitlements;

  @TestVisible
  public static Map<String, Object> mockGridEntitlements;

  /**
   * @description Retrieves 3-tier user governance entitlements for grid operations (Transpose, AI, Admin)
   * @param gridConfigName DeveloperName of the active Smart_Grid_Config__mdt
   * @return Map of entitlement keys to boolean/numeric values
   */
  @AuraEnabled(cacheable=true)
  public static Map<String, Object> getGridUserEntitlements(
    String gridConfigName
  ) {
    if (mockGridEntitlements != null) {
      return mockGridEntitlements;
    }

    Map<String, Object> result = new Map<String, Object>();
    Id userId = UserInfo.getUserId();

    Set<String> assignedPermSets = new Set<String>();
    for (PermissionSetAssignment psa : [
      SELECT PermissionSet.Name
      FROM PermissionSetAssignment
      WHERE AssigneeId = :userId
      WITH SYSTEM_MODE
    ]) {
      assignedPermSets.add(psa.PermissionSet.Name);
    }

    Boolean hasPowerUser =
      assignedPermSets.contains('SmartGrid_Power_User') ||
      assignedPermSets.contains('SmartGrid_Admin');
    Boolean hasAiPremium = assignedPermSets.contains('Smart_Grid_AI_Premium');
    Boolean hasAdmin = assignedPermSets.contains('SmartGrid_Admin');

    // Query global settings from Smart_Grid_Admin_Setting__mdt
    Boolean globalTransposeEnabled = true;
    Boolean globalAiEnabled = true;
    Decimal maxTransposeLimit = 20;
    Decimal defaultColumnWidth = 140;

    try {
      List<Smart_Grid_Admin_Setting__mdt> adminSettings = [
        SELECT
          Enable_AI_Suite__c,
          Enable_Transpose__c,
          Max_Transpose_Limit__c,
          Default_Record_Column_Width__c
        FROM Smart_Grid_Admin_Setting__mdt
        WITH USER_MODE
        LIMIT 1
      ];

      if (!adminSettings.isEmpty()) {
        Smart_Grid_Admin_Setting__mdt adminSetting = adminSettings[0];
        if (adminSetting.Enable_Transpose__c != null) {
          globalTransposeEnabled = adminSetting.Enable_Transpose__c;
        }
        if (adminSetting.Enable_AI_Suite__c != null) {
          globalAiEnabled = adminSetting.Enable_AI_Suite__c;
        }
        if (adminSetting.Max_Transpose_Limit__c != null) {
          maxTransposeLimit = adminSetting.Max_Transpose_Limit__c;
        }
        if (adminSetting.Default_Record_Column_Width__c != null) {
          defaultColumnWidth = adminSetting.Default_Record_Column_Width__c;
        }
      }
    } catch (Exception e) {
      // Gracefully fall back to defaults if user has no FLS/access to admin metadata
    }

    // Query per-grid override from Smart_Grid_Config__mdt
    Boolean gridTransposeAllowed = true;
    if (String.isNotBlank(gridConfigName)) {
      try {
        List<Smart_Grid_Config__mdt> gridConfigs = [
          SELECT Enable_Transpose__c, Max_Transpose_Records__c
          FROM Smart_Grid_Config__mdt
          WHERE DeveloperName = :gridConfigName
          WITH USER_MODE
          LIMIT 1
        ];
        if (!gridConfigs.isEmpty()) {
          Smart_Grid_Config__mdt config = gridConfigs[0];
          if (config.Enable_Transpose__c != null) {
            gridTransposeAllowed = config.Enable_Transpose__c;
          }
          if (config.Max_Transpose_Records__c != null) {
            maxTransposeLimit = config.Max_Transpose_Records__c;
          }
        }
      } catch (Exception e) {
        // Fall back to default grid settings
      }
    }

    // Check if System Administrator in dev/scratch org
    Boolean isSysAdmin = false;
    List<Profile> profList = [
      SELECT Name
      FROM Profile
      WHERE Id = :UserInfo.getProfileId()
      WITH USER_MODE
      LIMIT 1
    ];
    if (!profList.isEmpty() && profList[0].Name == 'System Administrator') {
      isSysAdmin = true;
    }

    Boolean canTranspose =
      (hasPowerUser || isSysAdmin) &&
      globalTransposeEnabled &&
      gridTransposeAllowed;
    Boolean canUseAi = (hasAiPremium || isSysAdmin) && globalAiEnabled;
    Boolean isAdmin = hasAdmin || isSysAdmin;

    result.put('CAN_TRANSPOSE', canTranspose);
    result.put('CAN_USE_AI', canUseAi);
    result.put('IS_ADMIN', isAdmin);
    result.put('MAX_TRANSPOSE_COUNT', maxTransposeLimit);
    result.put('DEFAULT_COLUMN_WIDTH', defaultColumnWidth);

    return result;
  }

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
        WITH SYSTEM_MODE
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

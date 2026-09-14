@SuppressWarnings('sfge:ApexFlsViolation')
public with sharing class SmartGridViewService {
  /**
   * @description Fetches saved views and query history for the current user and target object.
   * Views are user-private (AC-09-5).
   * @param objectApiName SObject API name to filter views by
   * @return List of Smart_Grid_View__c records
   */
  public static List<Smart_Grid_View__c> getViews(String objectApiName) {
    if (String.isBlank(objectApiName)) {
      return new List<Smart_Grid_View__c>();
    }
    Id currentUserId = UserInfo.getUserId();
    return [
      SELECT
        Id,
        View_Name__c,
        Object_API_Name__c,
        Is_Default__c,
        Last_Used__c,
        View_Config_JSON__c
      FROM Smart_Grid_View__c
      WHERE Object_API_Name__c = :objectApiName AND User__c = :currentUserId
      WITH USER_MODE
      ORDER BY
        Is_Default__c DESC,
        Last_Used__c DESC NULLS LAST,
        View_Name__c ASC
      LIMIT 100
    ];
  }

  /**
   * @description Saves or updates a saved view for the current user.
   * If isDefault is true, clears default flag on any existing default views for this object.
   * @param viewId Optional Id for updating an existing view
   * @param viewName Display name of the view
   * @param objectApiName Target SObject API name
   * @param configJson Serialized view configuration JSON
   * @param isDefault Whether this view should be the default on grid load
   * @return Saved Smart_Grid_View__c record
   */
  @SuppressWarnings('sfge:ApexFlsViolation')
  public static Smart_Grid_View__c saveView(
    Id viewId,
    String viewName,
    String objectApiName,
    String configJson,
    Boolean isDefault
  ) {
    if (String.isBlank(viewName) || String.isBlank(objectApiName)) {
      throw new AuraHandledException(
        'View name and object API name are required.'
      );
    }

    Id currentUserId = UserInfo.getUserId();

    // Check CRUD access
    if (viewId != null) {
      if (
        !Smart_Grid_View__c.sObjectType.getDescribe(
            SObjectDescribeOptions.DEFERRED
          )
          .isUpdateable()
      ) {
        throw new AuraHandledException(
          'Insufficient permissions to update views.'
        );
      }
    } else {
      if (
        !Smart_Grid_View__c.sObjectType.getDescribe(
            SObjectDescribeOptions.DEFERRED
          )
          .isCreateable()
      ) {
        throw new AuraHandledException(
          'Insufficient permissions to create views.'
        );
      }
    }

    // If setting as default, clear default flag on existing views for this user & object
    if (isDefault == true) {
      List<Smart_Grid_View__c> existingDefaults = [
        SELECT Id, Is_Default__c
        FROM Smart_Grid_View__c
        WHERE
          Object_API_Name__c = :objectApiName
          AND User__c = :currentUserId
          AND Is_Default__c = TRUE
        WITH USER_MODE
      ];
      List<Smart_Grid_View__c> toUpdate = new List<Smart_Grid_View__c>();
      for (Smart_Grid_View__c v : existingDefaults) {
        if (viewId == null || v.Id != viewId) {
          v.Is_Default__c = false;
          toUpdate.add(v);
        }
      }
      if (!toUpdate.isEmpty()) {
        Database.update(toUpdate, AccessLevel.USER_MODE);
      }
    }

    Smart_Grid_View__c recordToSave = new Smart_Grid_View__c();
    if (viewId != null) {
      // Validate ownership (AC-09-5)
      List<Smart_Grid_View__c> existing = [
        SELECT Id, User__c
        FROM Smart_Grid_View__c
        WHERE Id = :viewId AND User__c = :currentUserId
        WITH USER_MODE
        LIMIT 1
      ];
      if (existing.isEmpty()) {
        throw new AuraHandledException('View not found or unauthorized.');
      }
      recordToSave.Id = viewId;
    } else {
      recordToSave.User__c = currentUserId;
    }

    recordToSave.View_Name__c = viewName;
    recordToSave.Object_API_Name__c = objectApiName;
    recordToSave.View_Config_JSON__c = configJson;
    recordToSave.Is_Default__c = (isDefault == true);
    recordToSave.Last_Used__c = Datetime.now();

    Database.upsert(recordToSave, AccessLevel.USER_MODE);
    return recordToSave;
  }

  /**
   * @description Deletes a saved view owned by the current user.
   * @param viewId Id of the view to delete
   */
  @SuppressWarnings('sfge:ApexFlsViolation')
  public static void deleteView(Id viewId) {
    if (viewId == null) {
      return;
    }
    if (
      !Smart_Grid_View__c.sObjectType.getDescribe(
          SObjectDescribeOptions.DEFERRED
        )
        .isDeletable()
    ) {
      throw new AuraHandledException(
        'Insufficient permissions to delete views.'
      );
    }
    Id currentUserId = UserInfo.getUserId();
    List<Smart_Grid_View__c> views = [
      SELECT Id
      FROM Smart_Grid_View__c
      WHERE Id = :viewId AND User__c = :currentUserId
      WITH USER_MODE
      LIMIT 1
    ];
    if (views.isEmpty()) {
      throw new AuraHandledException('View not found or unauthorized.');
    }
    Database.delete(views, AccessLevel.USER_MODE);
  }

  /**
   * @description Maintains the last 10 auto-history views without explicit save (AC-09-3).
   * @param objectApiName Target SObject API name
   * @param configJson Current grid configuration JSON
   */
  @SuppressWarnings('sfge:ApexFlsViolation')
  public static void saveQueryHistory(String objectApiName, String configJson) {
    if (String.isBlank(objectApiName) || String.isBlank(configJson)) {
      return;
    }
    if (
      !Smart_Grid_View__c.sObjectType.getDescribe(
          SObjectDescribeOptions.DEFERRED
        )
        .isCreateable()
    ) {
      return;
    }
    Id currentUserId = UserInfo.getUserId();
    String historyPrefix = '__history_';

    // Insert new history record
    Smart_Grid_View__c hist = new Smart_Grid_View__c(
      User__c = currentUserId,
      Object_API_Name__c = objectApiName,
      View_Name__c = historyPrefix + Datetime.now().getTime(),
      View_Config_JSON__c = configJson,
      Is_Default__c = false,
      Last_Used__c = Datetime.now()
    );
    Database.insert(hist, AccessLevel.USER_MODE);

    // Maintain only the last 10 history entries (AC-09-3)
    List<Smart_Grid_View__c> oldHistories = [
      SELECT Id
      FROM Smart_Grid_View__c
      WHERE
        Object_API_Name__c = :objectApiName
        AND User__c = :currentUserId
        AND View_Name__c LIKE :historyPrefix + '%'
      WITH USER_MODE
      ORDER BY Last_Used__c DESC, CreatedDate DESC
    ];

    if (oldHistories.size() > 10) {
      if (
        !Smart_Grid_View__c.sObjectType.getDescribe(
            SObjectDescribeOptions.DEFERRED
          )
          .isDeletable()
      ) {
        return;
      }
      List<Smart_Grid_View__c> toDelete = new List<Smart_Grid_View__c>();
      for (Integer i = 10; i < oldHistories.size(); i++) {
        toDelete.add(oldHistories[i]);
      }
      Database.delete(toDelete, AccessLevel.USER_MODE);
    }
  }
}

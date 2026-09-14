/**
 * @description Security utility class that validates 15- and 18-character Salesforce record IDs
 * against regular expression patterns to protect against injection and tampering before DML.
 */
public with sharing class SmartGridIdValidator {
  private static final Pattern ID_PATTERN = Pattern.compile(
    '^[a-zA-Z0-9]{15}([a-zA-Z0-9]{3})?$'
  );

  @TestVisible
  private static Boolean forceInvalidIdForTest = false;

  /**
   * @description Validates whether a given string matches the standard Salesforce Record ID pattern.
   * @param idValue The ID string to validate
   * @return Boolean true if the ID is non-blank and matches the alphanumeric 15-18 char pattern
   */
  public static Boolean isValidSalesforceId(String idValue) {
    if (String.isBlank(idValue)) {
      return false;
    }
    return ID_PATTERN.matcher(idValue).matches();
  }

  /**
   * @description Validates IDs on a list of SObjects before save/upsert.
   * New records (where Id is null) bypass validation. Any non-null ID must match the pattern.
   * @param records List of SObjects to validate
   * @throws AuraHandledException if any record has an invalid or tampered ID
   */
  public static void validateIds(List<SObject> records) {
    if (records == null || records.isEmpty()) {
      return;
    }

    for (SObject record : records) {
      if (record != null && record.Id != null) {
        String idStr = String.valueOf(record.Id);
        if (
          !isValidSalesforceId(idStr) ||
          (Test.isRunningTest() && forceInvalidIdForTest)
        ) {
          AuraHandledException ex = new AuraHandledException(
            'Invalid Record ID detected: ' + idStr
          );
          ex.setMessage('Invalid Record ID detected: ' + idStr);
          throw ex;
        }
      }
    }
  }

  /**
   * @description Validates that every SObject in the list has a non-null, valid Salesforce ID for deletion.
   * @param records List of SObjects to delete
   * @throws AuraHandledException if any record is missing an ID or has an invalid ID
   */
  public static void validateIdsForDelete(List<SObject> records) {
    if (records == null || records.isEmpty()) {
      return;
    }

    for (SObject record : records) {
      if (record == null || record.Id == null) {
        AuraHandledException ex = new AuraHandledException(
          'Cannot delete record without a valid Record ID.'
        );
        ex.setMessage('Cannot delete record without a valid Record ID.');
        throw ex;
      }
      String idStr = String.valueOf(record.Id);
      if (
        !isValidSalesforceId(idStr) ||
        (Test.isRunningTest() && forceInvalidIdForTest)
      ) {
        AuraHandledException ex = new AuraHandledException(
          'Invalid Record ID detected for deletion: ' + idStr
        );
        ex.setMessage('Invalid Record ID detected for deletion: ' + idStr);
        throw ex;
      }
    }
  }

  /**
   * @description Validates a list of raw ID strings before processing.
   * @param idStrings List of ID strings to validate
   * @throws AuraHandledException if any ID is invalid
   */
  public static void validateIdStrings(List<String> idStrings) {
    if (idStrings == null || idStrings.isEmpty()) {
      return;
    }

    for (String idStr : idStrings) {
      if (!isValidSalesforceId(idStr)) {
        AuraHandledException ex = new AuraHandledException(
          'Invalid Record ID detected: ' + idStr
        );
        ex.setMessage('Invalid Record ID detected: ' + idStr);
        throw ex;
      }
    }
  }
}

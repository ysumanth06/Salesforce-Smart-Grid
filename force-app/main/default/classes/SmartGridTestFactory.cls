/**
 * @description Centralized Test Data Factory for Smart Grid Phase 3 unit and integration tests.
 * Follows Constitution Article V (Positive / Negative / Bulk test data generation).
 */
@IsTest
public class SmartGridTestFactory {
  /**
   * @description Creates and inserts a batch of Account records for PNB testing.
   * @param count Number of records to generate (e.g. 251+ for bulk tests)
   * @param namePrefix Prefix for Account Name
   * @return List of inserted Account records
   */
  public static List<Account> createAccounts(Integer count, String namePrefix) {
    List<Account> accounts = new List<Account>();
    for (Integer i = 0; i < count; i++) {
      accounts.add(
        new Account(
          Name = namePrefix + ' ' + i,
          BillingState = (Math.mod(i, 2) == 0) ? 'CA' : 'NY',
          AnnualRevenue = 100000.00 * (i + 1),
          Rating = (Math.mod(i, 3) == 0) ? 'Hot' : 'Warm',
          Industry = (Math.mod(i, 2) == 0) ? 'Technology' : 'Finance'
        )
      );
    }
    insert accounts;
    return accounts;
  }

  /**
   * @description Creates and inserts a batch of Contact records for PNB testing.
   * @param count Number of records to generate
   * @param accountId Parent Account ID
   * @return List of inserted Contact records
   */
  public static List<Contact> createContacts(Integer count, Id accountId) {
    List<Contact> contacts = new List<Contact>();
    for (Integer i = 0; i < count; i++) {
      contacts.add(
        new Contact(
          FirstName = 'TestFirst' + i,
          LastName = 'TestLast' + i,
          Email = 'test' + i + '@example.com',
          AccountId = accountId
        )
      );
    }
    insert contacts;
    return contacts;
  }

  /**
   * @description Helper to deserialize mock Smart_Grid_AI_Config__mdt records for unit tests.
   * @param devName Developer name
   * @param providerType Provider Type (Offline_Mock, Einstein, OpenAI_Compatible, etc.)
   * @return Smart_Grid_AI_Config__mdt mock record
   */
  public static Smart_Grid_AI_Config__mdt createMockAiConfig(
    String devName,
    String providerType
  ) {
    String jsonStr =
      '{"DeveloperName":"' +
      devName +
      '","Enable_NLP__c":true,"Enable_Suggestions__c":true,"Enable_Chat__c":true,"Provider_Type__c":"' +
      providerType +
      '","Max_Tokens__c":1000,"Confidence_Threshold__c":0.70}';
    return (Smart_Grid_AI_Config__mdt) JSON.deserialize(
      jsonStr,
      Smart_Grid_AI_Config__mdt.class
    );
  }
}

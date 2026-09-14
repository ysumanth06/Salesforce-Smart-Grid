@IsTest
public class SmartGridFormatEngineTest {
  @IsTest
  static void testGetFormatRules_BlankConfig() {
    Test.startTest();
    List<SmartGridFormatEngine.FormatRuleDTO> rules = SmartGridFormatEngine.getFormatRules(
      '',
      'Account'
    );
    Test.stopTest();

    Assert.areEqual(
      0,
      rules.size(),
      'Should return empty list for blank config'
    );
  }

  @IsTest
  static void testGetFormatRules_WithMockRules_PriorityAndFiltering() {
    String jsonStr =
      '[' +
      '{"Id":"m02000000000001", "DeveloperName":"Rule_Won", "Field_API_Name__c":"StageName", "Operator__c":"EQUALS", "Value__c":"Closed Won", "Cell_Color__c":"#d4edda", "Row_Highlight__c":true, "Priority__c":1, "Is_Active__c":true},' +
      '{"Id":"m02000000000002", "DeveloperName":"Rule_Lost", "Field_API_Name__c":"StageName", "Operator__c":"EQUALS", "Value__c":"Closed Lost", "Cell_Color__c":"#f8d7da", "Priority__c":2, "Is_Active__c":true},' +
      '{"Id":"m02000000000003", "DeveloperName":"Rule_Inactive", "Field_API_Name__c":"StageName", "Operator__c":"EQUALS", "Value__c":"Prospecting", "Priority__c":3, "Is_Active__c":false},' +
      '{"Id":"m02000000000004", "DeveloperName":"Rule_BadField", "Field_API_Name__c":"NonExistentField__c", "Operator__c":"EQUALS", "Value__c":"Val", "Priority__c":4, "Is_Active__c":true}' +
      ']';

    SmartGridFormatEngine.mockRules = (List<Smart_Grid_Format_Rule__mdt>) JSON.deserialize(
      jsonStr,
      List<Smart_Grid_Format_Rule__mdt>.class
    );

    Test.startTest();
    List<SmartGridFormatEngine.FormatRuleDTO> rules = SmartGridFormatEngine.getFormatRules(
      'Test_Config',
      'Opportunity'
    );
    Test.stopTest();

    // Inactive rule and BadField rule should be filtered out
    Assert.areEqual(2, rules.size(), 'Should return 2 valid rules');
    Assert.areEqual(
      'Rule_Won',
      rules[0].developerName,
      'Priority 1 rule should be first'
    );
    Assert.isTrue(
      rules[0].rowHighlight,
      'Rule_Won should have rowHighlight true'
    );
    Assert.areEqual(1, rules[0].priority, 'Priority should be 1');
    Assert.areEqual(
      'Rule_Lost',
      rules[1].developerName,
      'Priority 2 rule should be second'
    );
    Assert.isFalse(
      rules[1].rowHighlight,
      'Rule_Lost should have rowHighlight false'
    );
  }

  @IsTest
  static void testGetFormatRules_WithoutObjectValidation() {
    String jsonStr =
      '[' +
      '{"Id":"m02000000000005", "DeveloperName":"Rule_NoObj", "Field_API_Name__c":"CustomField__c", "Operator__c":"EQUALS", "Value__c":"Test", "Priority__c":10, "Is_Active__c":true}' +
      ']';

    SmartGridFormatEngine.mockRules = (List<Smart_Grid_Format_Rule__mdt>) JSON.deserialize(
      jsonStr,
      List<Smart_Grid_Format_Rule__mdt>.class
    );

    Test.startTest();
    // Pass blank objectApiName - should skip object-level field describe validation
    List<SmartGridFormatEngine.FormatRuleDTO> rules = SmartGridFormatEngine.getFormatRules(
      'Test_Config',
      null
    );
    Test.stopTest();

    Assert.areEqual(
      1,
      rules.size(),
      'Should return rule without object validation'
    );
    Assert.areEqual(
      'CustomField__c',
      rules[0].fieldApiName,
      'Field API name should match'
    );
  }

  @IsTest
  static void testGetFormatRules_RealQuery() {
    // Test the live SOQL query path with nonexistent config
    Test.startTest();
    List<SmartGridFormatEngine.FormatRuleDTO> rules = SmartGridFormatEngine.getFormatRules(
      'Non_Existent_Config_XYZ',
      'Account'
    );
    Test.stopTest();

    Assert.isNotNull(rules, 'Rules list should not be null');
  }
}

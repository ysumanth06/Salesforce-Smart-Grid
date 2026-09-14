public with sharing class SmartGridFormatEngine {
  @TestVisible
  private static List<Smart_Grid_Format_Rule__mdt> mockRules;

  public class FormatRuleDTO {
    @AuraEnabled
    public String id;
    @AuraEnabled
    public String developerName;
    @AuraEnabled
    public String fieldApiName;
    @AuraEnabled
    public String operator;
    @AuraEnabled
    public String value;
    @AuraEnabled
    public String cellColor;
    @AuraEnabled
    public String textColor;
    @AuraEnabled
    public Boolean rowHighlight;
    @AuraEnabled
    public String iconName;
    @AuraEnabled
    public Integer priority;
  }

  /**
   * @description Fetches active format rules for a given Smart Grid Config,
   * validating field accessibility and ordering by priority ascending.
   * @param configDevName DeveloperName of the Smart_Grid_Config__mdt record
   * @param objectApiName SObject API name to validate field accessibility
   * @return List of FormatRuleDTO
   */
  @AuraEnabled(cacheable=true)
  public static List<FormatRuleDTO> getFormatRules(
    String configDevName,
    String objectApiName
  ) {
    List<FormatRuleDTO> dtos = new List<FormatRuleDTO>();
    if (String.isBlank(configDevName)) {
      return dtos;
    }

    List<Smart_Grid_Format_Rule__mdt> rules;
    if (Test.isRunningTest() && mockRules != null) {
      rules = mockRules;
    } else {
      rules = [
        SELECT
          Id,
          DeveloperName,
          MasterLabel,
          Field_API_Name__c,
          Operator__c,
          Value__c,
          Cell_Color__c,
          Text_Color__c,
          Row_Highlight__c,
          Icon_Name__c,
          Priority__c,
          Is_Active__c,
          Smart_Grid_Config__r.DeveloperName
        FROM Smart_Grid_Format_Rule__mdt
        WHERE
          Smart_Grid_Config__r.DeveloperName = :configDevName
          AND Is_Active__c = TRUE
        WITH USER_MODE
        ORDER BY Priority__c ASC NULLS LAST
      ];
    }

    Map<String, SObjectField> fieldMap = null;
    if (String.isNotBlank(objectApiName)) {
      SObjectType sType = Schema.getGlobalDescribe().get(objectApiName);
      if (sType != null && sType.getDescribe().isAccessible()) {
        fieldMap = sType.getDescribe().fields.getMap();
      }
    }

    for (Smart_Grid_Format_Rule__mdt rule : rules) {
      // AC-01-4: Inactive or missing field rules are silently skipped
      if (rule.Is_Active__c != true || String.isBlank(rule.Field_API_Name__c)) {
        continue;
      }

      // AC-01-4 & TC-01-N2: Field must exist and be accessible if objectApiName is provided
      if (fieldMap != null) {
        String lowerField = rule.Field_API_Name__c.toLowerCase();
        if (
          !fieldMap.containsKey(lowerField) ||
          !fieldMap.get(lowerField).getDescribe().isAccessible()
        ) {
          continue;
        }
      }

      FormatRuleDTO dto = new FormatRuleDTO();
      dto.id = rule.Id;
      dto.developerName = rule.DeveloperName;
      dto.fieldApiName = rule.Field_API_Name__c;
      dto.operator = rule.Operator__c;
      dto.value = rule.Value__c;
      dto.cellColor = rule.Cell_Color__c;
      dto.textColor = rule.Text_Color__c;
      dto.rowHighlight = rule.Row_Highlight__c == true;
      dto.iconName = rule.Icon_Name__c;
      dto.priority = rule.Priority__c != null
        ? Integer.valueOf(rule.Priority__c)
        : 100;
      dtos.add(dto);
    }

    return dtos;
  }
}

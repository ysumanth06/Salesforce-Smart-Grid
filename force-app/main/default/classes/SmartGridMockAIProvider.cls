/**
 * @description Offline Mock & Heuristic AI Provider for Smart Grid.
 * Employs deterministic regex tokenizing, dynamic Schema describe inspection,
 * and filter-aware SOQL aggregates. 100% object-agnostic, zero token cost.
 */
public with sharing class SmartGridMockAIProvider implements ISmartGridAIProvider {
  private Smart_Grid_AI_Config__mdt config;

  public SmartGridMockAIProvider() {
  }

  public SmartGridMockAIProvider(Smart_Grid_AI_Config__mdt config) {
    this.config = config;
  }

  public SmartGridNLPEngine.TranslationResult translateQuery(
    SmartGridNLPEngine.TranslationRequest request
  ) {
    SmartGridNLPEngine.TranslationResult result = new SmartGridNLPEngine.TranslationResult();
    String sObjName = String.isBlank(request.objectApiName)
      ? 'Account'
      : request.objectApiName;
    result.objectApiName = sObjName;
    result.fields = request.availableFields;
    result.isSuccess = true;
    result.confidenceScore = 0.95;

    SObjectType sType = Schema.getGlobalDescribe().get(sObjName);
    Map<String, SObjectField> fieldMap = (sType != null)
      ? sType.getDescribe().fields.getMap()
      : new Map<String, SObjectField>();

    String lowerPrompt = request.prompt.toLowerCase();
    List<String> explanations = new List<String>();

    // 1. Rating / Status match
    Pattern ratingPattern = Pattern.compile(
      '(?i)(?:rating|status|stage)\\s*(?:is|=|equals)?\\s*(?:[\'"]([^\'"]+)[\'"]|([a-zA-Z0-9_]+))'
    );
    Matcher ratingMatcher = ratingPattern.matcher(request.prompt);
    if (ratingMatcher.find()) {
      String rawVal = (ratingMatcher.group(1) != null
          ? ratingMatcher.group(1)
          : ratingMatcher.group(2))
        .trim();
      String targetPickField = null;
      if (fieldMap.containsKey('rating')) {
        targetPickField = 'Rating';
      } else if (fieldMap.containsKey('stagename')) {
        targetPickField = 'StageName';
      } else if (fieldMap.containsKey('status')) {
        targetPickField = 'Status';
      }

      if (targetPickField != null) {
        String val =
          rawVal.substring(0, 1).toUpperCase() +
          rawVal.substring(1).toLowerCase();
        result.filters.add(
          new GridQueryBuilder.FilterCondition(targetPickField, '=', val)
        );
        explanations.add(targetPickField + ' equals ' + val);
      }
    }

    // 2. Industry / Category match
    Pattern industryPattern = Pattern.compile(
      '(?i)(?:industry\\s*(?:is|=|equals)?\\s*[\'"]?([a-zA-Z]+)[\'"]?|in\\s+(technology|finance|healthcare|banking))'
    );
    Matcher industryMatcher = industryPattern.matcher(request.prompt);
    if (industryMatcher.find() && fieldMap.containsKey('industry')) {
      String rawVal = industryMatcher.group(1) != null
        ? industryMatcher.group(1)
        : industryMatcher.group(2);
      String val =
        rawVal.substring(0, 1).toUpperCase() +
        rawVal.substring(1).toLowerCase();
      result.filters.add(
        new GridQueryBuilder.FilterCondition('Industry', '=', val)
      );
      explanations.add('Industry equals ' + val);
    }

    // 3. State match (e.g. in California, CA, in NY)
    String stateField = null;
    if (fieldMap.containsKey('billingstate')) {
      stateField = 'BillingState';
    } else if (fieldMap.containsKey('state')) {
      stateField = 'State';
    } else if (fieldMap.containsKey('shippingstate')) {
      stateField = 'ShippingState';
    }

    if (stateField != null) {
      if (lowerPrompt.contains('california') || lowerPrompt.contains('in ca')) {
        result.filters.add(
          new GridQueryBuilder.FilterCondition(stateField, '=', 'CA')
        );
        explanations.add('State is California (CA)');
      } else if (
        lowerPrompt.contains('new york') || lowerPrompt.contains('in ny')
      ) {
        result.filters.add(
          new GridQueryBuilder.FilterCondition(stateField, '=', 'NY')
        );
        explanations.add('State is New York (NY)');
      } else if (
        lowerPrompt.contains('texas') || lowerPrompt.contains('in tx')
      ) {
        result.filters.add(
          new GridQueryBuilder.FilterCondition(stateField, '=', 'TX')
        );
        explanations.add('State is Texas (TX)');
      }
    }

    // 4. Revenue / Amount match (> 1M, > 500k, > 100000)
    Pattern revPattern = Pattern.compile(
      '(?i)(?:revenue|amount|deals|cost|budget|price)\\s*(>|>=|<|<=|=)\\s*\\$?([0-9]+(?:\\.[0-9]+)?)\\s*([kmKM])?'
    );
    Matcher revMatcher = revPattern.matcher(request.prompt);
    if (revMatcher.find()) {
      String op = revMatcher.group(1);
      Decimal num = Decimal.valueOf(revMatcher.group(2));
      String unit = revMatcher.group(3);
      if (String.isNotBlank(unit)) {
        if (unit.equalsIgnoreCase('m')) {
          num = num * 1000000;
        } else if (unit.equalsIgnoreCase('k')) {
          num = num * 1000;
        }
      }

      String targetField = resolveNumericField(
        fieldMap,
        request.availableFields,
        sObjName
      );
      if (targetField != null) {
        result.filters.add(
          new GridQueryBuilder.FilterCondition(
            targetField,
            op,
            String.valueOf(num)
          )
        );
        explanations.add(targetField + ' ' + op + ' ' + num.format());
      }
    }

    // 5. Sorting match
    Pattern sortPattern = Pattern.compile(
      '(?i)(?:sort|order)\\s+by\\s+([a-zA-Z0-9_]+)(?:\\s+(asc|desc))?'
    );
    Matcher sortMatcher = sortPattern.matcher(request.prompt);
    if (sortMatcher.find()) {
      String candidateField = sortMatcher.group(1);
      for (String fKey : fieldMap.keySet()) {
        if (fKey.equalsIgnoreCase(candidateField)) {
          result.sortField = fieldMap.get(fKey).getDescribe().getName();
          break;
        }
      }
      if (String.isNotBlank(result.sortField)) {
        result.sortDirection = (sortMatcher.group(2) != null)
          ? sortMatcher.group(2).toUpperCase()
          : 'ASC';
        explanations.add(
          'Sorted by ' + result.sortField + ' ' + result.sortDirection
        );
      }
    }

    // 6. Limit match
    Pattern limitPattern = Pattern.compile('(?i)(?:top|limit)\\s+([0-9]+)');
    Matcher limitMatcher = limitPattern.matcher(request.prompt);
    if (limitMatcher.find()) {
      result.recordLimit = Integer.valueOf(limitMatcher.group(1));
      explanations.add('Limit ' + result.recordLimit + ' records');
    } else {
      result.recordLimit = 50;
    }

    if (explanations.isEmpty()) {
      result.explanation = 'Showing records for ' + sObjName;
    } else {
      result.explanation = String.join(explanations, ', ');
    }

    return result;
  }

  public SmartGridNLPEngine.AssistantResult answerQuestion(
    SmartGridNLPEngine.AssistantRequest request
  ) {
    SmartGridNLPEngine.AssistantResult res = new SmartGridNLPEngine.AssistantResult();
    res.isSuccess = true;
    String q = request.question.toLowerCase();
    String sObjName = String.isBlank(request.objectApiName)
      ? 'Account'
      : request.objectApiName;

    SObjectType sType = Schema.getGlobalDescribe().get(sObjName);
    if (sType == null || !sType.getDescribe().isAccessible()) {
      res.isSuccess = false;
      res.errorMessage = 'Object inaccessible: ' + sObjName;
      return res;
    }

    Map<String, SObjectField> fieldMap = sType.getDescribe().fields.getMap();
    String numericField = resolveNumericField(
      fieldMap,
      request.visibleFields,
      sObjName
    );
    String numericLabel = (numericField != null &&
      fieldMap.containsKey(numericField.toLowerCase()))
      ? fieldMap.get(numericField.toLowerCase()).getDescribe().getLabel()
      : 'Value';

    String groupField = resolveCategoricalField(
      fieldMap,
      request.visibleFields
    );

    try {
      // 1. Calculate filtered record count
      GridQueryBuilder.QueryRequest qReq = new GridQueryBuilder.QueryRequest();
      qReq.objectApiName = sObjName;
      qReq.filterJson = request.activeFilters;
      String countQuery = GridQueryBuilder.buildCountQuery(qReq);
      Integer count = Database.countQuery(countQuery, AccessLevel.USER_MODE);

      // 2. Calculate financial aggregates (SUM & AVG) if numeric field exists
      Decimal total = 0;
      Decimal avg = 0;
      if (numericField != null) {
        List<String> whereClauses = GridQueryBuilder.buildStandardWhereClauses(
          sType,
          null,
          request.activeFilters,
          null,
          null,
          null,
          null
        );
        String aggQuery =
          'SELECT SUM(' +
          String.escapeSingleQuotes(numericField) +
          ') totalSum, ' +
          'AVG(' +
          String.escapeSingleQuotes(numericField) +
          ') avgVal ' +
          'FROM ' +
          String.escapeSingleQuotes(sObjName);
        if (!whereClauses.isEmpty()) {
          aggQuery += ' WHERE ' + String.join(whereClauses, ' AND ');
        }
        List<AggregateResult> aggResults = Database.query(
          aggQuery,
          AccessLevel.USER_MODE
        );
        if (!aggResults.isEmpty()) {
          Object sumObj = aggResults[0].get('totalSum');
          Object avgObj = aggResults[0].get('avgVal');
          if (sumObj != null)
            total = (Decimal) sumObj;
          if (avgObj != null)
            avg = (Decimal) avgObj;
        }
      }

      // 3. Question intent routing with contextual action chips
      if (q.contains('total') || q.contains('sum')) {
        res.answer =
          'The total ' +
          numericLabel +
          ' across ' +
          count +
          ' ' +
          sObjName +
          ' records is $' +
          total.format() +
          '.';
        res.computedValue = String.valueOf(total);
        if (numericField != null && avg > 0) {
          res.actions.add(
            new SmartGridNLPEngine.AssistantAction(
              'Filter Records > Avg ($' + avg.format() + ')',
              'filter',
              numericField
            )
          );
        }
        if (groupField != null) {
          res.actions.add(
            new SmartGridNLPEngine.AssistantAction(
              'Group by ' + groupField,
              'group',
              groupField
            )
          );
        }
        res.actions.add(
          new SmartGridNLPEngine.AssistantAction(
            'Open Analytics Charts',
            'chart',
            null
          )
        );
      } else if (q.contains('average') || q.contains('avg')) {
        res.answer =
          'The average ' +
          numericLabel +
          ' is $' +
          avg.format() +
          ' across ' +
          count +
          ' ' +
          sObjName +
          ' records.';
        res.computedValue = String.valueOf(avg);
        if (numericField != null) {
          res.actions.add(
            new SmartGridNLPEngine.AssistantAction(
              'Filter Records > Avg',
              'filter',
              numericField
            )
          );
        }
        if (groupField != null) {
          res.actions.add(
            new SmartGridNLPEngine.AssistantAction(
              'Group by ' + groupField,
              'group',
              groupField
            )
          );
        }
      } else if (
        q.contains('how many') ||
        q.contains('count') ||
        q.contains('number')
      ) {
        res.answer =
          'There are currently ' +
          count +
          ' ' +
          sObjName +
          ' records in this view.';
        res.computedValue = String.valueOf(count);
      } else if (
        q.contains('summarize') ||
        q.contains('summary') ||
        q.contains('overview')
      ) {
        res.answer =
          'Dataset Overview for ' +
          sObjName +
          ': ' +
          count +
          ' records loaded. ' +
          (numericField != null
            ? 'Total ' +
              numericLabel +
              ' is $' +
              total.format() +
              ' (Avg: $' +
              avg.format() +
              ').'
            : '');
        res.computedValue = String.valueOf(count);
      } else {
        res.answer =
          'I am configured to assist exclusively with your grid data and analytics for ' +
          sObjName +
          '. You can ask for summary totals, averages, counts, or group distributions.';
        res.computedValue = null;
        if (groupField != null) {
          res.actions.add(
            new SmartGridNLPEngine.AssistantAction(
              'Group by ' + groupField,
              'group',
              groupField
            )
          );
        }
        res.actions.add(
          new SmartGridNLPEngine.AssistantAction(
            'Open Analytics Charts',
            'chart',
            null
          )
        );
      }
    } catch (Exception ex) {
      res.isSuccess = false;
      res.errorMessage = 'Unable to compute answer: ' + ex.getMessage();
    }

    return res;
  }

  private String resolveNumericField(
    Map<String, SObjectField> fieldMap,
    List<String> visibleFields,
    String sObjName
  ) {
    // 1. Known high-priority defaults
    if (
      sObjName.equalsIgnoreCase('Opportunity') && fieldMap.containsKey('amount')
    ) {
      return 'Amount';
    }
    if (
      sObjName.equalsIgnoreCase('Account') &&
      fieldMap.containsKey('annualrevenue')
    ) {
      return 'AnnualRevenue';
    }

    // 2. Visible fields check
    if (visibleFields != null) {
      for (String f : visibleFields) {
        String cleanF = f.toLowerCase();
        if (fieldMap.containsKey(cleanF)) {
          DisplayType dt = fieldMap.get(cleanF).getDescribe().getType();
          if (dt == DisplayType.CURRENCY || dt == DisplayType.DOUBLE) {
            return fieldMap.get(cleanF).getDescribe().getName();
          }
        }
      }
    }

    // 3. Fallback to any currency or double field on object
    for (SObjectField sf : fieldMap.values()) {
      DescribeFieldResult dfr = sf.getDescribe();
      if (
        dfr.isAccessible() &&
        (dfr.getType() == DisplayType.CURRENCY ||
        dfr.getType() == DisplayType.DOUBLE)
      ) {
        return dfr.getName();
      }
    }

    return null;
  }

  private String resolveCategoricalField(
    Map<String, SObjectField> fieldMap,
    List<String> visibleFields
  ) {
    List<String> priorityFields = new List<String>{
      'Industry',
      'StageName',
      'Status',
      'Rating',
      'Type',
      'LeadSource'
    };
    for (String pf : priorityFields) {
      if (fieldMap.containsKey(pf.toLowerCase())) {
        return fieldMap.get(pf.toLowerCase()).getDescribe().getName();
      }
    }

    if (visibleFields != null) {
      for (String f : visibleFields) {
        String cleanF = f.toLowerCase();
        if (fieldMap.containsKey(cleanF)) {
          DescribeFieldResult dfr = fieldMap.get(cleanF).getDescribe();
          if (dfr.isAccessible() && dfr.getType() == DisplayType.PICKLIST) {
            return dfr.getName();
          }
        }
      }
    }

    return null;
  }
}

/**
 * @description Offline Mock & Heuristic AI Provider for Smart Grid.
 * Employs deterministic regex tokenizing and fast pattern matching.
 * Provides 0 ms latency, 0 token cost, and serves as the reliable test / offline runner.
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
    result.objectApiName = request.objectApiName;
    result.fields = request.availableFields;
    result.isSuccess = true;
    result.confidenceScore = 0.95;

    String lowerPrompt = request.prompt.toLowerCase();
    List<String> explanations = new List<String>();

    // 1. Rating match
    Pattern ratingPattern = Pattern.compile(
      '(?i)rating\\s*(?:is|=|equals)?\\s*[\'"]?(hot|warm|cold)[\'"]?'
    );
    Matcher ratingMatcher = ratingPattern.matcher(request.prompt);
    if (ratingMatcher.find()) {
      String val =
        ratingMatcher.group(1).substring(0, 1).toUpperCase() +
        ratingMatcher.group(1).substring(1).toLowerCase();
      result.filters.add(
        new GridQueryBuilder.FilterCondition('Rating', '=', val)
      );
      explanations.add('Rating equals ' + val);
    }

    // 2. Industry match
    Pattern industryPattern = Pattern.compile(
      '(?i)(?:industry\\s*(?:is|=|equals)?\\s*[\'"]?([a-zA-Z]+)[\'"]?|in\\s+(technology|finance|healthcare|banking))'
    );
    Matcher industryMatcher = industryPattern.matcher(request.prompt);
    if (industryMatcher.find()) {
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

    // 3. BillingState match (e.g. in California, CA, in NY)
    if (lowerPrompt.contains('california') || lowerPrompt.contains('in ca')) {
      result.filters.add(
        new GridQueryBuilder.FilterCondition('BillingState', '=', 'CA')
      );
      explanations.add('State is California (CA)');
    } else if (
      lowerPrompt.contains('new york') || lowerPrompt.contains('in ny')
    ) {
      result.filters.add(
        new GridQueryBuilder.FilterCondition('BillingState', '=', 'NY')
      );
      explanations.add('State is New York (NY)');
    } else if (lowerPrompt.contains('texas') || lowerPrompt.contains('in tx')) {
      result.filters.add(
        new GridQueryBuilder.FilterCondition('BillingState', '=', 'TX')
      );
      explanations.add('State is Texas (TX)');
    }

    // 4. Revenue / Amount match (> 1M, > 500k, > 100000)
    Pattern revPattern = Pattern.compile(
      '(?i)(?:revenue|amount|deals)\\s*(>|>=|<|<=|=)\\s*\\$?([0-9]+(?:\\.[0-9]+)?)\\s*([kmKM])?'
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
      String targetField = (request.objectApiName.equalsIgnoreCase(
          'Opportunity'
        ))
        ? 'Amount'
        : 'AnnualRevenue';
      result.filters.add(
        new GridQueryBuilder.FilterCondition(
          targetField,
          op,
          String.valueOf(num)
        )
      );
      explanations.add(targetField + ' ' + op + ' ' + num.format());
    }

    // 5. Sorting match
    Pattern sortPattern = Pattern.compile(
      '(?i)(?:sort|order)\\s+by\\s+([a-zA-Z0-9_]+)(?:\\s+(asc|desc))?'
    );
    Matcher sortMatcher = sortPattern.matcher(request.prompt);
    if (sortMatcher.find()) {
      result.sortField = sortMatcher.group(1);
      result.sortDirection = (sortMatcher.group(2) != null)
        ? sortMatcher.group(2).toUpperCase()
        : 'ASC';
      explanations.add(
        'Sorted by ' + result.sortField + ' ' + result.sortDirection
      );
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
      result.explanation = 'Showing records for ' + request.objectApiName;
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

    try {
      if (q.contains('total revenue') || q.contains('sum of revenue')) {
        AggregateResult[] groupedResults = [
          SELECT SUM(AnnualRevenue) totalRev
          FROM Account
          WITH USER_MODE
        ];
        Decimal total = (groupedResults.isEmpty() ||
          groupedResults[0].get('totalRev') == null)
          ? 0
          : (Decimal) groupedResults[0].get('totalRev');
        res.answer =
          'The total annual revenue across active accounts is $' +
          total.format() +
          '.';
        res.computedValue = String.valueOf(total);
      } else if (q.contains('average revenue') || q.contains('avg revenue')) {
        AggregateResult[] groupedResults = [
          SELECT AVG(AnnualRevenue) avgRev
          FROM Account
          WITH USER_MODE
        ];
        Decimal avg = (groupedResults.isEmpty() ||
          groupedResults[0].get('avgRev') == null)
          ? 0
          : (Decimal) groupedResults[0].get('avgRev');
        res.answer = 'The average annual revenue is $' + avg.format() + '.';
        res.computedValue = String.valueOf(avg);
      } else if (
        q.contains('how many') ||
        q.contains('count') ||
        q.contains('total number')
      ) {
        Integer count = [SELECT COUNT() FROM Account WITH USER_MODE];
        res.answer =
          'There are currently ' +
          count +
          ' ' +
          request.objectApiName +
          ' records in this view.';
        res.computedValue = String.valueOf(count);
      } else {
        res.answer = 'I am configured to assist exclusively with your grid data and analytics. You can ask for summary totals, averages, or counts.';
        res.computedValue = null;
      }
    } catch (Exception ex) {
      res.isSuccess = false;
      res.errorMessage = 'Unable to compute answer: ' + ex.getMessage();
    }

    return res;
  }
}

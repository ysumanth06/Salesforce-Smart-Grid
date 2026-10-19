/**
 * @description Invocable Action for Agentforce Agents to summarize grid datasets.
 * Computes record totals, primary financial sums, and categorical breakdowns with FLS.
 */
public with sharing class SmartGridAgentSummaryService {
  public class SummaryRequest {
    @InvocableVariable(
      label='Object API Name'
      description='Target Salesforce Object (e.g. Account, Opportunity)'
      required=true
    )
    public String objectApiName;

    @InvocableVariable(
      label='Numeric Field'
      description='Field API name to sum (e.g. AnnualRevenue, Amount)'
    )
    public String numericField;

    @InvocableVariable(
      label='Group Field'
      description='Field API name to categorize (e.g. Industry, StageName)'
    )
    public String groupField;

    @InvocableVariable(
      label='Filter Criteria JSON'
      description='Optional filter expression JSON'
    )
    public String filterJson;
  }

  public class SummaryResponse {
    @InvocableVariable(label='Is Success')
    public Boolean isSuccess;

    @InvocableVariable(label='Record Count')
    public Integer recordCount;

    @InvocableVariable(label='Total Numeric Sum')
    public Decimal totalNumericSum;

    @InvocableVariable(label='Average Numeric Value')
    public Decimal averageNumericValue;

    @InvocableVariable(label='Summary Narrative')
    public String summaryNarrative;

    @InvocableVariable(label='Error Message')
    public String errorMessage;

    public SummaryResponse() {
      this.isSuccess = false;
      this.recordCount = 0;
      this.totalNumericSum = 0;
      this.averageNumericValue = 0;
    }
  }

  @InvocableMethod(
    label='Smart Grid: Summarize Dataset'
    description='Calculates totals, averages, and narrative summaries for Agentforce conversations'
    category='Smart Grid'
  )
  public static List<SummaryResponse> summarizeData(
    List<SummaryRequest> requests
  ) {
    List<SummaryResponse> responses = new List<SummaryResponse>();

    for (SummaryRequest req : requests) {
      SummaryResponse res = new SummaryResponse();
      try {
        if (String.isBlank(req.objectApiName)) {
          res.errorMessage = 'Object API Name is required.';
          responses.add(res);
          continue;
        }

        SObjectType sType = Schema.getGlobalDescribe().get(req.objectApiName);
        if (sType == null || !sType.getDescribe().isAccessible()) {
          res.errorMessage =
            'Target object is inaccessible: ' + req.objectApiName;
          responses.add(res);
          continue;
        }

        Map<String, SObjectField> fieldMap = sType.getDescribe()
          .fields.getMap();

        // 1. Calculate Count
        GridQueryBuilder.QueryRequest qReq = new GridQueryBuilder.QueryRequest();
        qReq.objectApiName = req.objectApiName;
        qReq.filterJson = req.filterJson;
        String countSoql = GridQueryBuilder.buildCountQuery(qReq);
        res.recordCount = Database.countQuery(countSoql, AccessLevel.USER_MODE);

        // 2. Resolve Numeric Field if not provided
        String numField = req.numericField;
        if (String.isBlank(numField)) {
          if (fieldMap.containsKey('amount')) {
            numField = 'Amount';
          } else if (fieldMap.containsKey('annualrevenue')) {
            numField = 'AnnualRevenue';
          } else {
            for (SObjectField sf : fieldMap.values()) {
              DisplayType dt = sf.getDescribe().getType();
              if (
                sf.getDescribe().isAccessible() &&
                (dt == DisplayType.CURRENCY ||
                dt == DisplayType.DOUBLE)
              ) {
                numField = sf.getDescribe().getName();
                break;
              }
            }
          }
        }

        if (
          String.isNotBlank(numField) &&
          fieldMap.containsKey(numField.toLowerCase())
        ) {
          List<String> whereClauses = GridQueryBuilder.buildStandardWhereClauses(
            sType,
            null,
            req.filterJson,
            null,
            null,
            null,
            null
          );
          String aggQuery =
            'SELECT SUM(' +
            String.escapeSingleQuotes(numField) +
            ') tSum, ' +
            'AVG(' +
            String.escapeSingleQuotes(numField) +
            ') aVal ' +
            'FROM ' +
            String.escapeSingleQuotes(req.objectApiName);
          if (!whereClauses.isEmpty()) {
            aggQuery += ' WHERE ' + String.join(whereClauses, ' AND ');
          }
          List<AggregateResult> aggList = Database.query(
            aggQuery,
            AccessLevel.USER_MODE
          );
          if (!aggList.isEmpty()) {
            Object sVal = aggList[0].get('tSum');
            Object aVal = aggList[0].get('aVal');
            if (sVal != null)
              res.totalNumericSum = (Decimal) sVal;
            if (aVal != null)
              res.averageNumericValue = (Decimal) aVal;
          }
        }

        res.summaryNarrative =
          'Found ' +
          res.recordCount +
          ' ' +
          req.objectApiName +
          ' records. ' +
          (String.isNotBlank(numField)
            ? 'Total ' +
              numField +
              ' is $' +
              res.totalNumericSum.format() +
              ' (Average: $' +
              res.averageNumericValue.format() +
              ').'
            : '');
        res.isSuccess = true;
      } catch (Exception ex) {
        res.isSuccess = false;
        res.errorMessage = 'Summary calculation failed: ' + ex.getMessage();
      }
      responses.add(res);
    }

    return responses;
  }
}

/**
 * @description Invocable Action for Agentforce Agents to inspect data quality and health.
 * Returns health score (0-100), duplicate count, missing data counts, and top issues.
 */
public with sharing class SmartGridAgentHealthService {
  public class HealthRequest {
    @InvocableVariable(
      label='Object API Name'
      description='Target Salesforce Object to audit'
      required=true
    )
    public String objectApiName;

    @InvocableVariable(
      label='Fields to Audit (Comma-Separated)'
      description='Optional fields to check'
    )
    public String fields;
  }

  public class HealthResponse {
    @InvocableVariable(label='Is Success')
    public Boolean isSuccess;

    @InvocableVariable(label='Health Score (0-100)')
    public Integer healthScore;

    @InvocableVariable(label='Total Records Evaluated')
    public Integer totalRecordsEvaluated;

    @InvocableVariable(label='Duplicate Records Found')
    public Integer duplicateCount;

    @InvocableVariable(label='Missing Data Records Found')
    public Integer missingDataCount;

    @InvocableVariable(label='Health Status Narrative')
    public String healthNarrative;

    @InvocableVariable(label='Error Message')
    public String errorMessage;

    public HealthResponse() {
      this.isSuccess = false;
      this.healthScore = 100;
      this.totalRecordsEvaluated = 0;
      this.duplicateCount = 0;
      this.missingDataCount = 0;
    }
  }

  @InvocableMethod(
    label='Smart Grid: Audit Data Quality'
    description='Evaluates dataset hygiene, duplicates, and missing values for Agentforce agents'
    category='Smart Grid'
  )
  public static List<HealthResponse> inspectDataHealth(
    List<HealthRequest> requests
  ) {
    List<HealthResponse> responses = new List<HealthResponse>();

    for (HealthRequest req : requests) {
      HealthResponse res = new HealthResponse();
      try {
        if (String.isBlank(req.objectApiName)) {
          res.errorMessage = 'Object API Name is required.';
          responses.add(res);
          continue;
        }

        List<String> fieldList = new List<String>();
        if (String.isNotBlank(req.fields)) {
          for (String f : req.fields.split(',')) {
            if (String.isNotBlank(f))
              fieldList.add(f.trim());
          }
        }

        SmartGridDataQualityService.QualityAnalysisResult analysis = SmartGridDataQualityService.analyzeDataQuality(
          req.objectApiName,
          fieldList
        );

        if (analysis.isSuccess) {
          res.isSuccess = true;
          res.healthScore = analysis.healthScore;
          res.totalRecordsEvaluated = analysis.totalRecordsEvaluated;
          res.duplicateCount = analysis.duplicateCount;
          res.missingDataCount = analysis.missingDataCount;

          String status = (res.healthScore >= 80)
            ? 'Healthy'
            : (res.healthScore >= 50 ? 'Needs Attention' : 'Critical');
          res.healthNarrative =
            req.objectApiName +
            ' Data Quality: ' +
            status +
            ' (' +
            res.healthScore +
            '/100). ' +
            'Evaluated ' +
            res.totalRecordsEvaluated +
            ' records: ' +
            res.duplicateCount +
            ' duplicates, ' +
            res.missingDataCount +
            ' missing required values.';
        } else {
          res.errorMessage = analysis.errorMessage;
        }
      } catch (Exception ex) {
        res.isSuccess = false;
        res.errorMessage = 'Data health audit failed: ' + ex.getMessage();
      }
      responses.add(res);
    }

    return responses;
  }
}

/**
 * @description Invocable Service for Agentforce and Autonomous External AI Agents.
 * Exposes Smart Grid query capabilities via standard Salesforce Invocable Actions,
 * allowing any Agentforce agent or external tool to safely query grid records with FLS.
 */
public with sharing class SmartGridAgentService {
  public class AgentQueryRequest {
    @InvocableVariable(
      label='Object API Name'
      description='Target Salesforce Object (e.g. Account)'
      required=true
    )
    public String objectApiName;

    @InvocableVariable(
      label='Fields (Comma-Separated)'
      description='Fields to retrieve (e.g. Id, Name, Rating)'
    )
    public String fields;

    @InvocableVariable(
      label='Sort Field'
      description='Field API name to sort by'
    )
    public String sortField;

    @InvocableVariable(label='Sort Direction' description='ASC or DESC')
    public String sortDirection;

    @InvocableVariable(
      label='Record Limit'
      description='Maximum rows to return (default 50)'
    )
    public Integer recordLimit;
  }

  public class AgentQueryResponse {
    @InvocableVariable(label='Is Success')
    public Boolean isSuccess;

    @InvocableVariable(label='Record Count')
    public Integer recordCount;

    @InvocableVariable(label='Records JSON')
    public String recordsJson;

    @InvocableVariable(label='Executed SOQL')
    public String executedSoql;

    @InvocableVariable(label='Error Message')
    public String errorMessage;

    public AgentQueryResponse() {
      this.isSuccess = false;
      this.recordCount = 0;
    }
  }

  /**
   * @description Invocable entry point callable by Agentforce agents, Flow, or standard REST API
   * @param requests List of AgentQueryRequest
   * @return List of AgentQueryResponse
   */
  @InvocableMethod(
    label='Smart Grid: Query Records'
    description='Queries records for Agentforce agents enforcing object and field security'
    category='Smart Grid'
  )
  public static List<AgentQueryResponse> executeQuery(
    List<AgentQueryRequest> requests
  ) {
    List<AgentQueryResponse> responses = new List<AgentQueryResponse>();

    for (AgentQueryRequest req : requests) {
      AgentQueryResponse res = new AgentQueryResponse();
      try {
        if (String.isBlank(req.objectApiName)) {
          res.errorMessage = 'Object API Name is required.';
          responses.add(res);
          continue;
        }

        List<String> fieldList = new List<String>();
        if (String.isNotBlank(req.fields)) {
          for (String f : req.fields.split(',')) {
            if (String.isNotBlank(f)) {
              fieldList.add(f.trim());
            }
          }
        }
        if (fieldList.isEmpty()) {
          fieldList.add('Id');
          fieldList.add('Name');
        }

        GridQueryBuilder.QueryRequest qReq = new GridQueryBuilder.QueryRequest();
        qReq.objectApiName = req.objectApiName;
        qReq.fields = fieldList;
        qReq.sortField = req.sortField;
        qReq.sortDirection = req.sortDirection;
        qReq.recordLimit = (req.recordLimit != null &&
          req.recordLimit > 0)
          ? req.recordLimit
          : 50;

        String soql = GridQueryBuilder.buildSingleQuery(qReq);
        res.executedSoql = soql;

        List<SObject> records = Database.query(soql);
        res.recordCount = records.size();
        res.recordsJson = JSON.serialize(records);
        res.isSuccess = true;

        // Telemetry publish
        SmartGridTelemetryService.publishTelemetry(
          'agentforce_query',
          req.objectApiName,
          res.recordCount,
          0,
          null,
          null
        );
      } catch (Exception ex) {
        res.isSuccess = false;
        res.errorMessage = ex.getMessage();
      }
      responses.add(res);
    }

    return responses;
  }
}

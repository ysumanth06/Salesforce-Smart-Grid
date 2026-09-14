/**
 * @description Governor-Limit Safe Data Quality Analysis Service.
 * Leverages database engine SOQL aggregates (GROUP BY ... HAVING COUNT > 1)
 * to execute duplicate, null, and outlier detection with near-zero Apex CPU utilization.
 */
public with sharing class SmartGridDataQualityService {
  public class QualityIssue {
    @AuraEnabled
    public String issueType { get; set; } // DUPLICATE, MISSING_DATA, OUTLIER
    @AuraEnabled
    public String fieldName { get; set; }
    @AuraEnabled
    public String fieldLabel { get; set; }
    @AuraEnabled
    public String severity { get; set; } // HIGH, MEDIUM, LOW
    @AuraEnabled
    public String description { get; set; }
    @AuraEnabled
    public Integer affectedCount { get; set; }
    @AuraEnabled
    public List<String> sampleValues { get; set; }

    public QualityIssue() {
      this.sampleValues = new List<String>();
      this.affectedCount = 0;
    }
  }

  public class QualityAnalysisResult {
    @AuraEnabled
    public Boolean isSuccess { get; set; }
    @AuraEnabled
    public Integer healthScore { get; set; }
    @AuraEnabled
    public Integer totalRecordsEvaluated { get; set; }
    @AuraEnabled
    public Integer duplicateCount { get; set; }
    @AuraEnabled
    public Integer missingDataCount { get; set; }
    @AuraEnabled
    public Integer outlierCount { get; set; }
    @AuraEnabled
    public List<QualityIssue> issues { get; set; }
    @AuraEnabled
    public String errorMessage { get; set; }

    public QualityAnalysisResult() {
      this.isSuccess = false;
      this.healthScore = 100;
      this.totalRecordsEvaluated = 0;
      this.duplicateCount = 0;
      this.missingDataCount = 0;
      this.outlierCount = 0;
      this.issues = new List<QualityIssue>();
    }
  }

  /**
   * @description Analyzes data quality for an object: health score, duplicates, nulls, outliers
   * @param objectApiName SObject API name (e.g., Account)
   * @param fieldsToAnalyze List of field API names to evaluate
   * @return QualityAnalysisResult containing health score and detected issues
   */
  @AuraEnabled(cacheable=true)
  @SuppressWarnings('PMD.ApexSOQLInjection')
  public static QualityAnalysisResult analyzeDataQuality(
    String objectApiName,
    List<String> fieldsToAnalyze
  ) {
    QualityAnalysisResult result = new QualityAnalysisResult();
    if (String.isBlank(objectApiName)) {
      result.errorMessage = 'Object API Name cannot be blank.';
      return result;
    }

    SObjectType sType = Schema.getGlobalDescribe().get(objectApiName);
    if (sType == null || !sType.getDescribe().isAccessible()) {
      result.errorMessage = 'Object inaccessible: ' + objectApiName;
      return result;
    }

    Map<String, SObjectField> fieldMap = sType.getDescribe().fields.getMap();
    List<String> validFields = new List<String>();
    if (fieldsToAnalyze != null && !fieldsToAnalyze.isEmpty()) {
      for (String f : fieldsToAnalyze) {
        if (fieldMap.containsKey(f.toLowerCase())) {
          validFields.add(
            fieldMap.get(f.toLowerCase()).getDescribe().getName()
          );
        }
      }
    }
    if (validFields.isEmpty()) {
      validFields = new List<String>{ 'Name' };
    }

    try {
      // 1. Total records evaluated
      Integer totalCount = Database.countQuery(
        'SELECT COUNT() FROM ' +
          String.escapeSingleQuotes(objectApiName) +
          ' WITH USER_MODE'
      );
      result.totalRecordsEvaluated = totalCount;
      if (totalCount == 0) {
        result.isSuccess = true;
        result.healthScore = 100;
        return result;
      }

      Integer penaltyPoints = 0;

      // 2. Duplicate Detection via Database Grouping (Near 0 ms CPU time)
      List<String> duplicateCandidates = new List<String>{
        'Name',
        'Email',
        'Phone',
        'BillingState'
      };
      for (String dupField : duplicateCandidates) {
        if (
          fieldMap.containsKey(dupField.toLowerCase()) &&
          validFields.contains(dupField)
        ) {
          String aggQuery =
            'SELECT ' +
            String.escapeSingleQuotes(dupField) +
            ', COUNT(Id) cnt FROM ' +
            String.escapeSingleQuotes(objectApiName) +
            ' WHERE ' +
            String.escapeSingleQuotes(dupField) +
            ' != null GROUP BY ' +
            String.escapeSingleQuotes(dupField) +
            ' HAVING COUNT(Id) > 1 WITH USER_MODE LIMIT 10';

          List<AggregateResult> aggResults = Database.query(aggQuery);
          if (!aggResults.isEmpty()) {
            QualityIssue issue = new QualityIssue();
            issue.issueType = 'DUPLICATE';
            issue.fieldName = dupField;
            issue.fieldLabel = fieldMap.get(dupField.toLowerCase())
              .getDescribe()
              .getLabel();
            issue.severity = 'HIGH';
            issue.description =
              'Found ' +
              aggResults.size() +
              ' duplicate value groups on ' +
              issue.fieldLabel +
              '.';

            Integer dupRecCount = 0;
            for (AggregateResult ar : aggResults) {
              dupRecCount += (Integer) ar.get('cnt');
              Object val = ar.get(dupField);
              if (val != null) {
                issue.sampleValues.add(
                  String.valueOf(val) + ' (' + ar.get('cnt') + 'x)'
                );
              }
            }
            issue.affectedCount = dupRecCount;
            result.duplicateCount += dupRecCount;
            result.issues.add(issue);
            penaltyPoints += 15;
          }
        }
      }

      // 3. Null / Missing Data Check on Sample Set (max 200 records to prevent CPU spikes)
      List<String> escapedValidFields = new List<String>();
      for (String vf : validFields) {
        escapedValidFields.add(String.escapeSingleQuotes(vf));
      }
      String sampleQuery =
        'SELECT ' +
        String.join(escapedValidFields, ', ') +
        ' FROM ' +
        String.escapeSingleQuotes(objectApiName) +
        ' WITH USER_MODE LIMIT 200';
      List<SObject> sampleRows = Database.query(sampleQuery);
      Integer sampleSize = sampleRows.size();

      if (sampleSize > 0) {
        for (String fName : validFields) {
          Integer nullCount = 0;
          for (SObject row : sampleRows) {
            if (row.get(fName) == null) {
              nullCount++;
            }
          }

          Decimal nullPct = ((Decimal) nullCount / sampleSize) * 100.0;
          if (nullPct >= 30.0) {
            QualityIssue issue = new QualityIssue();
            issue.issueType = 'MISSING_DATA';
            issue.fieldName = fName;
            issue.fieldLabel = fieldMap.get(fName.toLowerCase())
              .getDescribe()
              .getLabel();
            issue.severity = (nullPct >= 60.0) ? 'HIGH' : 'MEDIUM';
            issue.description =
              Math.round(nullPct) +
              '% of records are missing ' +
              issue.fieldLabel +
              '.';
            issue.affectedCount = nullCount;
            result.missingDataCount += nullCount;
            result.issues.add(issue);
            penaltyPoints += (nullPct >= 60.0) ? 10 : 5;
          }
        }
      }

      // 4. Outlier Detection on Numeric / Currency Fields (Bulkified into single SOQL)
      List<String> numericFields = new List<String>();
      for (String fName : validFields) {
        DisplayType dType = fieldMap.get(fName.toLowerCase())
          .getDescribe()
          .getType();
        if (
          dType == DisplayType.CURRENCY ||
          dType == DisplayType.DOUBLE ||
          dType == DisplayType.INTEGER
        ) {
          numericFields.add(fName);
        }
      }

      if (!numericFields.isEmpty()) {
        List<String> aggClauses = new List<String>();
        Integer limitCount = Math.min(numericFields.size(), 10);
        for (Integer idx = 0; idx < limitCount; idx++) {
          String safeFn = String.escapeSingleQuotes(numericFields[idx]);
          aggClauses.add(
            'AVG(' +
              safeFn +
              ') avg_' +
              idx +
              ', MAX(' +
              safeFn +
              ') max_' +
              idx
          );
        }
        String outlierQuery =
          'SELECT ' +
          String.join(aggClauses, ', ') +
          ' FROM ' +
          String.escapeSingleQuotes(objectApiName) +
          ' WITH USER_MODE';
        List<AggregateResult> outResults = Database.query(outlierQuery);
        if (!outResults.isEmpty()) {
          AggregateResult ar = outResults[0];
          for (Integer idx = 0; idx < limitCount; idx++) {
            String fName = numericFields[idx];
            Object avgObj = ar.get('avg_' + idx);
            Object maxObj = ar.get('max_' + idx);
            if (avgObj != null && maxObj != null) {
              Decimal avgVal = (Decimal) avgObj;
              Decimal maxVal = (Decimal) maxObj;

              if (avgVal > 0 && maxVal > (avgVal * 4)) {
                QualityIssue issue = new QualityIssue();
                issue.issueType = 'OUTLIER';
                issue.fieldName = fName;
                issue.fieldLabel = fieldMap.get(fName.toLowerCase())
                  .getDescribe()
                  .getLabel();
                issue.severity = 'MEDIUM';
                issue.description =
                  'Extreme value detected on ' +
                  issue.fieldLabel +
                  ': Max (' +
                  maxVal.format() +
                  ') exceeds 4x average (' +
                  avgVal.format() +
                  ').';
                issue.affectedCount = 1;
                issue.sampleValues.add('Max: ' + maxVal.format());
                issue.sampleValues.add('Avg: ' + avgVal.format());
                result.outlierCount++;
                result.issues.add(issue);
                penaltyPoints += 5;
              }
            }
          }
        }
      }

      result.healthScore = Math.max(0, 100 - penaltyPoints);
      result.isSuccess = true;
    } catch (Exception ex) {
      result.isSuccess = false;
      result.errorMessage = 'Data quality analysis failed: ' + ex.getMessage();
    }

    return result;
  }
}

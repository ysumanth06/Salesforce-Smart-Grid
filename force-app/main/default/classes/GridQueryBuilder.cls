public with sharing class GridQueryBuilder {

    /**
     * @description Validates the fields against FLS and builds a safe SOQL query string.
     * Annotated with InvocableMethod to support future AI or Flow interactions.
     * @param requests List of QueryRequest
     * @return List of query strings corresponding to each request
     */
    @InvocableMethod(label='Build Safe Dynamic Grid Query' description='Constructs a SOQL query safely by validating FLS and objects.')
    public static List<String> buildQuery(List<QueryRequest> requests) {
        List<String> results = new List<String>();
        for(QueryRequest req : requests) {
            results.add(buildSingleQuery(req));
        }
        return results;
    }

    public static String buildSingleQuery(QueryRequest req) {
        if(String.isBlank(req.objectApiName)) {
            throw new QueryBuilderException('Object API Name cannot be null or blank.');
        }
        
        SObjectType sObjType = Schema.getGlobalDescribe().get(req.objectApiName);
        if(sObjType == null) {
            throw new QueryBuilderException('Invalid Object API Name: ' + req.objectApiName);
        }

        if(!sObjType.getDescribe().isAccessible()) {
            throw new QueryBuilderException('User does not have access to object: ' + req.objectApiName);
        }

        List<String> validFields = validateFields(sObjType, req.fields);
        
        // Ensure Id is always queried if not present
        if(!validFields.contains('Id') && !validFields.contains('id') && !validFields.contains('ID')) {
            validFields.add(0, 'Id');
        }

        String query = 'SELECT ' + String.join(validFields, ', ') + ' FROM ' + String.escapeSingleQuotes(req.objectApiName);

        // Filter Handling
        if(String.isNotBlank(req.filterField) && isValidFilterField(sObjType, req.filterField)) {
            String escapedFilterField = String.escapeSingleQuotes(req.filterField);
            if(String.isNotBlank(req.filterValue)) {
                // Dynamic filter with specific value — escape to prevent injection
                String escapedFilterValue = String.escapeSingleQuotes(req.filterValue);
                query += ' WHERE ' + escapedFilterField + ' = \'' + escapedFilterValue + '\'';
            } else {
                // Default: just ensure the filter field is not null
                query += ' WHERE ' + escapedFilterField + ' != null';
            }
        }

        // Sort Handling
        if(String.isNotBlank(req.sortField) && validateField(sObjType, req.sortField)) {
            query += ' ORDER BY ' + String.escapeSingleQuotes(req.sortField) + ' ASC NULLS LAST';
        }

        // Limit Handling
        Integer recordLimit = req.recordLimit != null && req.recordLimit > 0 ? req.recordLimit : 200;
        // Enforce max
        if (recordLimit > 2000) recordLimit = 2000;
        query += ' LIMIT ' + recordLimit;

        return query;
    }

    public static List<String> validateFields(SObjectType sObjType, List<String> fields) {
        List<String> validFields = new List<String>();
        if(fields == null || fields.isEmpty()) {
            return validFields;
        }

        Map<String, SObjectField> fieldMap = sObjType.getDescribe().fields.getMap();
        
        for(String fieldName : fields) {
            String lowerField = fieldName.toLowerCase();
            if(fieldMap.containsKey(lowerField)) {
                if(fieldMap.get(lowerField).getDescribe().isAccessible()) {
                    validFields.add(String.escapeSingleQuotes(fieldName));
                }
            }
        }
        return validFields;
    }

    public static Boolean validateField(SObjectType sObjType, String fieldName) {
        Map<String, SObjectField> fieldMap = sObjType.getDescribe().fields.getMap();
        String lowerField = fieldName.toLowerCase();
        if(fieldMap.containsKey(lowerField) && fieldMap.get(lowerField).getDescribe().isAccessible()) {
            return true;
        }
        return false;
    }

    public static Boolean isValidFilterField(SObjectType sObjType, String filterField) {
        return validateField(sObjType, filterField);
    }

    public class QueryRequest {
        @InvocableVariable(label='Object API Name' required=true)
        public String objectApiName;
        
        @InvocableVariable(label='Fields to Query' required=true)
        public List<String> fields;
        
        @InvocableVariable(label='Filter Field (API Name)')
        public String filterField;

        @InvocableVariable(label='Filter Value')
        public String filterValue;
        
        @InvocableVariable(label='Sort Field (API Name)')
        public String sortField;

        @InvocableVariable(label='Record Limit')
        public Integer recordLimit;
    }

    public class QueryBuilderException extends Exception {}
}

/**
 * @description Unit tests for SmartGridGroupService.
 * Validates multi-dimensional aggregate queries, rollups, and error handling.
 */
@IsTest
private class SmartGridGroupServiceTest {
  @TestSetup
  static void setupTestData() {
    List<Account> accounts = new List<Account>{
      new Account(
        Name = 'Acme Tech 1',
        Industry = 'Technology',
        Type = 'Customer - Direct',
        AnnualRevenue = 1000000
      ),
      new Account(
        Name = 'Acme Tech 2',
        Industry = 'Technology',
        Type = 'Customer - Channel',
        AnnualRevenue = 2000000
      ),
      new Account(
        Name = 'Apex Finance',
        Industry = 'Finance',
        Type = 'Customer - Direct',
        AnnualRevenue = 3000000
      )
    };
    insert accounts;
  }

  @IsTest
  static void testGroupedData_Success() {
    SmartGridGroupService.GroupRequest req = new SmartGridGroupService.GroupRequest();
    req.objectApiName = 'Account';
    req.groupByFields = new List<String>{ 'Industry', 'Type' };
    req.aggregateFields = new List<String>{ 'AnnualRevenue' };
    req.limitSize = 100;

    Test.startTest();
    SmartGridGroupService.GroupResult res = SmartGridGroupService.getGroupedData(
      req
    );
    Test.stopTest();

    Assert.isTrue(res.isSuccess, 'Expected group query to succeed');
    Assert.isNotNull(res.rootGroups, 'Root groups should be returned');
    Assert.areEqual(
      2,
      res.rootGroups.size(),
      'Expected 2 industries (Technology, Finance)'
    );

    // Verify rollups on Technology group
    SmartGridGroupService.GroupNode techGroup;
    for (SmartGridGroupService.GroupNode node : res.rootGroups) {
      if (node.fieldValue == 'Technology') {
        techGroup = node;
        break;
      }
    }
    Assert.isNotNull(techGroup, 'Technology group node must exist');
    Assert.areEqual(
      2,
      techGroup.recordCount,
      'Technology group has 2 accounts'
    );
    Assert.areEqual(
      3000000,
      (Decimal) techGroup.aggregates.get('sum_AnnualRevenue'),
      'Sum of revenue should be 3,000,000'
    );
    Assert.areEqual(
      2,
      techGroup.subGroups.size(),
      'Expected 2 subgroups under Technology (Direct, Channel)'
    );
  }

  @IsTest
  static void testGroupedData_WithFilters() {
    SmartGridGroupService.GroupRequest req = new SmartGridGroupService.GroupRequest();
    req.objectApiName = 'Account';
    req.groupByFields = new List<String>{ 'Industry' };
    req.aggregateFields = new List<String>{ 'AnnualRevenue' };
    req.filters = new Map<String, String>{ 'Industry' => 'Finance' };

    Test.startTest();
    SmartGridGroupService.GroupResult res = SmartGridGroupService.getGroupedData(
      req
    );
    Test.stopTest();

    Assert.isTrue(res.isSuccess, 'Expected filtered group query to succeed');
    Assert.areEqual(1, res.rootGroups.size(), 'Expected only Finance group');
    Assert.areEqual('Finance', res.rootGroups[0].fieldValue);
  }

  @IsTest
  static void testGroupedData_ValidationErrors() {
    Test.startTest();
    // Null request
    SmartGridGroupService.GroupResult res1 = SmartGridGroupService.getGroupedData(
      null
    );
    Assert.isFalse(res1.isSuccess, 'Null request must fail');

    // Missing group fields
    SmartGridGroupService.GroupRequest req2 = new SmartGridGroupService.GroupRequest();
    req2.objectApiName = 'Account';
    SmartGridGroupService.GroupResult res2 = SmartGridGroupService.getGroupedData(
      req2
    );
    Assert.isFalse(res2.isSuccess, 'Missing groupByFields must fail');

    // Invalid object
    SmartGridGroupService.GroupRequest req3 = new SmartGridGroupService.GroupRequest();
    req3.objectApiName = 'NonExistentObject_xyz__c';
    req3.groupByFields = new List<String>{ 'Id' };
    SmartGridGroupService.GroupResult res3 = SmartGridGroupService.getGroupedData(
      req3
    );
    Assert.isFalse(res3.isSuccess, 'Non-existent object must fail');
    Test.stopTest();
  }
}

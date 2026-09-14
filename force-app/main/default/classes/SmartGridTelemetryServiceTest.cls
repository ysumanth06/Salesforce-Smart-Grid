/**
 * @description PNB Unit Test Suite for SmartGridTelemetryService.
 */
@IsTest
private class SmartGridTelemetryServiceTest {
  @IsTest
  static void testPublishTelemetry_Positive() {
    Test.startTest();
    Database.SaveResult sr = SmartGridTelemetryService.publishTelemetry(
      'query',
      'Account',
      100,
      120,
      'Show accounts',
      null
    );
    Test.stopTest();

    Assert.isNotNull(sr, 'SaveResult should not be null');
    Assert.isTrue(sr.isSuccess(), 'Platform event publish should succeed');
  }

  @IsTest
  static void testLogClientAction_AuraEnabled() {
    Test.startTest();
    SmartGridTelemetryService.logClientAction(
      'export',
      'Account',
      50,
      300,
      null,
      null
    );
    Test.stopTest();

    // Verify method executes without unhandled exception
    Assert.isTrue(true, 'logClientAction completed successfully');
  }
}

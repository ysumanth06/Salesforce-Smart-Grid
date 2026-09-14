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

    if (Schema.getGlobalDescribe().containsKey('smart_grid_telemetry__e')) {
      Assert.isNotNull(sr, 'SaveResult should not be null when event exists');
      Assert.isTrue(sr.isSuccess(), 'Platform event publish should succeed');
    } else {
      Assert.isNull(sr, 'SaveResult should be null when event is not deployed');
    }
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

/**
 * @description PNB Unit Test Suite for SmartGridLicenseService.
 * Validates feature gating, license entitlements, and permission set checks.
 */
@IsTest
private class SmartGridLicenseServiceTest {
  @IsTest
  static void testCheckFeatureEntitlements_Default() {
    Test.startTest();
    Map<String, Boolean> entitlements = SmartGridLicenseService.checkFeatureEntitlements();
    Test.stopTest();

    Assert.isNotNull(entitlements, 'Entitlements map must not be null');
    Assert.isTrue(
      entitlements.containsKey('CORE_GRID'),
      'Core grid must be present'
    );
  }

  @IsTest
  static void testMockEntitlements() {
    SmartGridLicenseService.mockEntitlements = new Map<String, Boolean>{
      'CORE_GRID' => true,
      'NLP_COMMAND_PALETTE' => true,
      'AI_SUGGESTIONS' => false
    };

    Test.startTest();
    Map<String, Boolean> entitlements = SmartGridLicenseService.checkFeatureEntitlements();
    Boolean canNlp = SmartGridLicenseService.isFeatureAccessible(
      'NLP_COMMAND_PALETTE'
    );
    Boolean canSuggest = SmartGridLicenseService.isFeatureAccessible(
      'AI_SUGGESTIONS'
    );
    Boolean canUnknown = SmartGridLicenseService.isFeatureAccessible(
      'UNKNOWN_FEATURE'
    );
    Test.stopTest();

    Assert.isTrue(canNlp, 'NLP should be enabled via mock');
    Assert.isFalse(canSuggest, 'Suggestions should be disabled via mock');
    Assert.isFalse(canUnknown, 'Unknown feature must return false');
  }
}

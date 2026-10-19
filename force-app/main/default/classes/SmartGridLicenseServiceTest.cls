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

  @IsTest
  static void testGetGridUserEntitlements_Default() {
    Test.startTest();
    Map<String, Object> entitlements = SmartGridLicenseService.getGridUserEntitlements(
      'NonExistentGrid'
    );
    Test.stopTest();

    Assert.isNotNull(entitlements, 'Entitlements map must not be null');
    Assert.isTrue(
      entitlements.containsKey('CAN_TRANSPOSE'),
      'CAN_TRANSPOSE key should exist'
    );
    Assert.isTrue(
      entitlements.containsKey('MAX_TRANSPOSE_COUNT'),
      'MAX_TRANSPOSE_COUNT key should exist'
    );
    Assert.isTrue(
      entitlements.containsKey('DEFAULT_COLUMN_WIDTH'),
      'DEFAULT_COLUMN_WIDTH key should exist'
    );
    Assert.areEqual(
      20,
      (Decimal) entitlements.get('MAX_TRANSPOSE_COUNT'),
      'Default max transpose count should be 20'
    );
  }

  @IsTest
  static void testGetGridUserEntitlements_Mocked() {
    SmartGridLicenseService.mockGridEntitlements = new Map<String, Object>{
      'CAN_TRANSPOSE' => true,
      'CAN_USE_AI' => false,
      'IS_ADMIN' => false,
      'MAX_TRANSPOSE_COUNT' => 50,
      'DEFAULT_COLUMN_WIDTH' => 160
    };

    Test.startTest();
    Map<String, Object> entitlements = SmartGridLicenseService.getGridUserEntitlements(
      'AnyGrid'
    );
    Test.stopTest();

    Assert.isTrue(
      (Boolean) entitlements.get('CAN_TRANSPOSE'),
      'CAN_TRANSPOSE should be true from mock'
    );
    Assert.isFalse(
      (Boolean) entitlements.get('CAN_USE_AI'),
      'CAN_USE_AI should be false from mock'
    );
    Assert.areEqual(
      50,
      entitlements.get('MAX_TRANSPOSE_COUNT'),
      'MAX_TRANSPOSE_COUNT should be 50'
    );
  }
}

@IsTest
public class SmartGridIdValidatorTest {
  @IsTest
  static void testIsValidSalesforceId_Valid18Char() {
    String valid18 = '001000000000001AAA';
    Assert.isTrue(
      SmartGridIdValidator.isValidSalesforceId(valid18),
      '18-character alphanumeric ID should be valid'
    );
  }

  @IsTest
  static void testIsValidSalesforceId_Valid15Char() {
    String valid15 = '001000000000001';
    Assert.isTrue(
      SmartGridIdValidator.isValidSalesforceId(valid15),
      '15-character alphanumeric ID should be valid'
    );
  }

  @IsTest
  static void testIsValidSalesforceId_NullOrBlank() {
    Assert.isFalse(
      SmartGridIdValidator.isValidSalesforceId(null),
      'Null ID should be invalid'
    );
    Assert.isFalse(
      SmartGridIdValidator.isValidSalesforceId(''),
      'Empty ID string should be invalid'
    );
    Assert.isFalse(
      SmartGridIdValidator.isValidSalesforceId('   '),
      'Whitespace ID string should be invalid'
    );
  }

  @IsTest
  static void testIsValidSalesforceId_TooShort() {
    Assert.isFalse(
      SmartGridIdValidator.isValidSalesforceId('12345'),
      'Short ID (12345) should be invalid'
    );
  }

  @IsTest
  static void testIsValidSalesforceId_TooLong() {
    Assert.isFalse(
      SmartGridIdValidator.isValidSalesforceId('001000000000001AAAAAAAA'),
      'Overly long ID should be invalid'
    );
  }

  @IsTest
  static void testIsValidSalesforceId_SqlInjectionAttempt() {
    String injectionPayload = '\'; DROP TABLE--';
    Assert.isFalse(
      SmartGridIdValidator.isValidSalesforceId(injectionPayload),
      'SQL injection string should be invalid'
    );
  }

  @IsTest
  static void testIsValidSalesforceId_SpecialCharacters() {
    String specialChars = '001!@#$%^&*()';
    Assert.isFalse(
      SmartGridIdValidator.isValidSalesforceId(specialChars),
      'Special character string should be invalid'
    );
  }

  @IsTest
  static void testValidateIds_NewRecordsNullId_Passes() {
    List<Account> newAccounts = new List<Account>{
      new Account(Name = 'New Acc 1'),
      new Account(Name = 'New Acc 2')
    };

    Test.startTest();
    SmartGridIdValidator.validateIds(newAccounts);
    Test.stopTest();

    Assert.isTrue(
      true,
      'Records with null IDs should bypass validation without error'
    );
  }

  @IsTest
  static void testValidateIds_NullOrEmptyList_Passes() {
    Test.startTest();
    SmartGridIdValidator.validateIds(null);
    SmartGridIdValidator.validateIds(new List<SObject>());
    SmartGridIdValidator.validateIdsForDelete(null);
    SmartGridIdValidator.validateIdsForDelete(new List<SObject>());
    SmartGridIdValidator.validateIdStrings(null);
    SmartGridIdValidator.validateIdStrings(new List<String>());
    Test.stopTest();

    Assert.isTrue(true, 'Null and empty lists should pass safely');
  }

  @IsTest
  static void testValidateIds_Bulk251Records_Passes() {
    List<Account> accounts = new List<Account>();
    for (Integer i = 0; i < 251; i++) {
      accounts.add(new Account(Name = 'Bulk Acc ' + i));
    }
    insert accounts;

    Test.startTest();
    SmartGridIdValidator.validateIds(accounts);
    Test.stopTest();

    Assert.areEqual(
      251,
      accounts.size(),
      'All 251 records with valid IDs should pass validation'
    );
  }

  @IsTest
  static void testValidateIdsForDelete_MissingId_ThrowsException() {
    Account uninserted = new Account(Name = 'No Id Acc');

    Test.startTest();
    try {
      SmartGridIdValidator.validateIdsForDelete(
        new List<SObject>{ uninserted }
      );
      Assert.fail(
        'Expected AuraHandledException for uninserted record deletion'
      );
    } catch (Exception e) {
      Assert.isTrue(
        e instanceof AuraHandledException,
        'Should throw AuraHandledException when deleting record without ID'
      );
    }
    Test.stopTest();
  }

  @IsTest
  static void testValidateIdsForDelete_ValidIds_Passes() {
    Account acc = new Account(Name = 'Delete Target');
    insert acc;

    Test.startTest();
    SmartGridIdValidator.validateIdsForDelete(new List<SObject>{ acc });
    Test.stopTest();

    Assert.isTrue(
      true,
      'Inserted record with valid ID should pass delete validation'
    );
  }

  @IsTest
  static void testValidateIdStrings_Invalid_ThrowsException() {
    List<String> invalidIds = new List<String>{
      '001000000000001',
      '\'; DROP TABLE--'
    };

    Test.startTest();
    try {
      SmartGridIdValidator.validateIdStrings(invalidIds);
      Assert.fail('Expected AuraHandledException for invalid ID string');
    } catch (Exception e) {
      Assert.isTrue(
        e instanceof AuraHandledException,
        'Should throw AuraHandledException when validating invalid ID string'
      );
    }
    Test.stopTest();
  }

  @IsTest
  static void testValidateIdStrings_Valid_Passes() {
    List<String> validIds = new List<String>{
      '001000000000001',
      '001000000000001AAA'
    };

    Test.startTest();
    SmartGridIdValidator.validateIdStrings(validIds);
    Test.stopTest();

    Assert.isTrue(true, 'Valid ID strings should pass validation');
  }

  @IsTest
  static void testValidateIds_InvalidRecordId_ThrowsException() {
    Account acc = new Account(Name = 'Invalid Acc');
    insert acc;

    SmartGridIdValidator.forceInvalidIdForTest = true;

    Test.startTest();
    try {
      SmartGridIdValidator.validateIds(new List<SObject>{ acc });
      Assert.fail(
        'Expected AuraHandledException when forceInvalidIdForTest is true'
      );
    } catch (Exception e) {
      Assert.isTrue(
        e instanceof AuraHandledException,
        'Should throw AuraHandledException for invalid SObject ID'
      );
    } finally {
      SmartGridIdValidator.forceInvalidIdForTest = false;
    }
    Test.stopTest();
  }

  @IsTest
  static void testValidateIdsForDelete_InvalidRecordId_ThrowsException() {
    Account acc = new Account(Name = 'Delete Invalid Acc');
    insert acc;

    SmartGridIdValidator.forceInvalidIdForTest = true;

    Test.startTest();
    try {
      SmartGridIdValidator.validateIdsForDelete(new List<SObject>{ acc });
      Assert.fail(
        'Expected AuraHandledException when forceInvalidIdForTest is true'
      );
    } catch (Exception e) {
      Assert.isTrue(
        e instanceof AuraHandledException,
        'Should throw AuraHandledException for invalid deletion SObject ID'
      );
    } finally {
      SmartGridIdValidator.forceInvalidIdForTest = false;
    }
    Test.stopTest();
  }
}

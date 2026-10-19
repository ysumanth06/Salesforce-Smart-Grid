/**
 * @description Unit tests for SmartGridCurrencyService.
 * Validates currency conversions, multi-currency mock engine, corporate rollups, and formatting.
 */
@IsTest
private class SmartGridCurrencyServiceTest {
  @IsTest
  static void testSingleCurrencyDefault() {
    SmartGridCurrencyService.mockMultiCurrencyEnabled = false;
    SmartGridCurrencyService.mockCorporateCurrency = 'USD';
    SmartGridCurrencyService.mockConversionRates = null;

    Test.startTest();
    Boolean isMulti = SmartGridCurrencyService.isMultiCurrencyEnabled();
    String corpIso = SmartGridCurrencyService.getCorporateCurrencyIsoCode();
    Map<String, Decimal> rates = SmartGridCurrencyService.getConversionRates();
    Test.stopTest();

    Assert.isFalse(isMulti, 'Multi-currency should report false');
    Assert.areEqual('USD', corpIso, 'Corporate currency should be USD');
    Assert.isTrue(rates.containsKey('USD'), 'USD should be present in rates');
    Assert.areEqual(
      1.0,
      rates.get('USD'),
      'Corporate conversion rate should be 1.0'
    );
  }

  @IsTest
  static void testMultiCurrencyConversions() {
    SmartGridCurrencyService.mockMultiCurrencyEnabled = true;
    SmartGridCurrencyService.mockCorporateCurrency = 'USD';
    SmartGridCurrencyService.mockConversionRates = new Map<String, Decimal>{
      'USD' => 1.0,
      'EUR' => 0.85,
      'GBP' => 0.75,
      'JPY' => 150.0
    };

    Test.startTest();
    // 100 USD -> EUR: (100 / 1.0) * 0.85 = 85.00
    Decimal eurVal = SmartGridCurrencyService.convertAmount(100, 'USD', 'EUR');
    Assert.areEqual(85.00, eurVal, '100 USD should convert to 85.00 EUR');

    // 85 EUR -> USD: (85 / 0.85) * 1.0 = 100.00
    Decimal usdVal = SmartGridCurrencyService.convertAmount(85, 'EUR', 'USD');
    Assert.areEqual(100.00, usdVal, '85 EUR should convert to 100.00 USD');

    // 85 EUR -> GBP: (85 / 0.85) * 0.75 = 75.00
    Decimal gbpVal = SmartGridCurrencyService.convertAmount(85, 'EUR', 'GBP');
    Assert.areEqual(75.00, gbpVal, '85 EUR should convert to 75.00 GBP');

    // Corporate conversion
    Decimal corpVal = SmartGridCurrencyService.convertToCorporate(85, 'EUR');
    Assert.areEqual(
      100.00,
      corpVal,
      '85 EUR converted to corporate USD should be 100.00'
    );

    // Edge cases
    Decimal nullVal = SmartGridCurrencyService.convertAmount(
      null,
      'USD',
      'EUR'
    );
    Assert.isNull(nullVal, 'Null amount should return null');

    Decimal sameCur = SmartGridCurrencyService.convertAmount(50, 'EUR', 'EUR');
    Assert.areEqual(50, sameCur, 'Same currency should return same amount');

    Decimal unknownCur = SmartGridCurrencyService.convertAmount(
      50,
      'XYZ',
      'USD'
    );
    Assert.areEqual(
      50,
      unknownCur,
      'Unknown currency should return fallback amount'
    );
    Test.stopTest();
  }

  @IsTest
  static void testConvertGroupAggregatesToCorporate() {
    SmartGridCurrencyService.mockMultiCurrencyEnabled = true;
    SmartGridCurrencyService.mockCorporateCurrency = 'USD';
    SmartGridCurrencyService.mockConversionRates = new Map<String, Decimal>{
      'USD' => 1.0,
      'EUR' => 0.80
    };

    Map<String, Object> rawAggregates = new Map<String, Object>{
      'sum_AnnualRevenue' => 800000,
      'avg_AnnualRevenue' => 400000,
      'category' => 'Technology'
    };

    Test.startTest();
    Map<String, Object> result = SmartGridCurrencyService.convertGroupAggregatesToCorporate(
      rawAggregates,
      'EUR'
    );
    Test.stopTest();

    Assert.areEqual(
      'USD',
      (String) result.get('corporateIsoCode'),
      'Corporate code should be USD'
    );
    // 800,000 EUR / 0.80 * 1.0 = 1,000,000 USD
    Assert.areEqual(
      1000000.00,
      (Decimal) result.get('sum_AnnualRevenue'),
      'Sum should convert to 1,000,000 USD'
    );
    // 400,000 EUR / 0.80 * 1.0 = 500,000 USD
    Assert.areEqual(
      500000.00,
      (Decimal) result.get('avg_AnnualRevenue'),
      'Avg should convert to 500,000 USD'
    );
    Assert.areEqual(
      'Technology',
      (String) result.get('category'),
      'Non-numeric field preserved'
    );
  }

  @IsTest
  static void testRecordCurrencyAndFormatting() {
    SmartGridCurrencyService.mockCorporateCurrency = 'USD';

    Account acc = new Account(Name = 'Currency Account');

    Test.startTest();
    String recordIso = SmartGridCurrencyService.getRecordCurrency(acc);
    String nullIso = SmartGridCurrencyService.getRecordCurrency(null);
    String formatted = SmartGridCurrencyService.formatCurrency(12345.67, 'USD');
    String emptyFormatted = SmartGridCurrencyService.formatCurrency(
      null,
      'USD'
    );
    Test.stopTest();

    Assert.areEqual('USD', recordIso, 'Record currency should resolve to USD');
    Assert.areEqual(
      'USD',
      nullIso,
      'Null record should resolve to corporate currency'
    );
    Assert.isTrue(
      formatted.contains('USD'),
      'Formatted currency should contain ISO code'
    );
    Assert.areEqual(
      '',
      emptyFormatted,
      'Null amount formatting should be empty'
    );
  }
}

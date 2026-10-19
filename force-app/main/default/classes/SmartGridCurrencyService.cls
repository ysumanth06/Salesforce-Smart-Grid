/**
 * @description Multi-Currency & Corporate Currency Rollup Engine for Smart Grid.
 * Handles ISO currency extraction, dynamic multi-currency org detection,
 * exchange rate conversions, and group subtotal corporate normalization.
 */
public with sharing class SmartGridCurrencyService {
  @TestVisible
  public static Boolean mockMultiCurrencyEnabled;
  @TestVisible
  public static String mockCorporateCurrency;
  @TestVisible
  public static Map<String, Decimal> mockConversionRates;

  private static Map<String, Decimal> cachedRates;

  /**
   * @description Checks if multi-currency is active in the org
   * @return Boolean indicating multi-currency org status
   */
  @AuraEnabled(cacheable=true)
  public static Boolean isMultiCurrencyEnabled() {
    if (mockMultiCurrencyEnabled != null) {
      return mockMultiCurrencyEnabled;
    }
    return UserInfo.isMultiCurrencyOrganization();
  }

  /**
   * @description Returns the corporate currency ISO code
   * @return String ISO code (e.g., 'USD', 'EUR')
   */
  @AuraEnabled(cacheable=true)
  public static String getCorporateCurrencyIsoCode() {
    if (String.isNotBlank(mockCorporateCurrency)) {
      return mockCorporateCurrency;
    }

    if (!isMultiCurrencyEnabled()) {
      return UserInfo.getDefaultCurrency();
    }

    try {
      List<SObject> corporateCurrencies = Database.query(
        'SELECT IsoCode FROM CurrencyType WHERE IsCorporate = true AND IsActive = true WITH USER_MODE LIMIT 1'
      );
      if (!corporateCurrencies.isEmpty()) {
        return (String) corporateCurrencies[0].get('IsoCode');
      }
    } catch (Exception ex) {
      System.debug(
        LoggingLevel.WARN,
        'Could not query corporate CurrencyType: ' + ex.getMessage()
      );
    }

    return UserInfo.getDefaultCurrency();
  }

  /**
   * @description Returns active conversion rates mapping IsoCode -> ConversionRate
   * @return Map<String, Decimal>
   */
  @AuraEnabled(cacheable=true)
  public static Map<String, Decimal> getConversionRates() {
    if (mockConversionRates != null) {
      return mockConversionRates;
    }

    if (cachedRates != null) {
      return cachedRates;
    }

    Map<String, Decimal> rates = new Map<String, Decimal>();
    String corpIso = getCorporateCurrencyIsoCode();
    rates.put(corpIso, 1.0);

    if (isMultiCurrencyEnabled()) {
      try {
        List<SObject> currencyTypes = Database.query(
          'SELECT IsoCode, ConversionRate FROM CurrencyType WHERE IsActive = true WITH USER_MODE'
        );
        for (SObject ct : currencyTypes) {
          String iso = (String) ct.get('IsoCode');
          Decimal rate = (Decimal) ct.get('ConversionRate');
          if (String.isNotBlank(iso) && rate != null && rate > 0) {
            rates.put(iso, rate);
          }
        }
      } catch (Exception ex) {
        System.debug(
          LoggingLevel.WARN,
          'Error querying CurrencyType rates: ' + ex.getMessage()
        );
      }
    }

    cachedRates = rates;
    return rates;
  }

  /**
   * @description Converts an amount from source currency to target currency
   * Formula in Salesforce: AmountInTarget = (AmountInSource / SourceRate) * TargetRate
   * @param amount Decimal amount to convert
   * @param fromIso Source ISO code
   * @param toIso Target ISO code
   * @return Converted Decimal rounded to 2 decimal places
   */
  @AuraEnabled
  public static Decimal convertAmount(
    Decimal amount,
    String fromIso,
    String toIso
  ) {
    if (amount == null) {
      return null;
    }
    if (
      String.isBlank(fromIso) ||
      String.isBlank(toIso) ||
      fromIso.equalsIgnoreCase(toIso)
    ) {
      return amount;
    }

    Map<String, Decimal> rates = getConversionRates();
    Decimal fromRate = rates.get(fromIso.toUpperCase());
    Decimal toRate = rates.get(toIso.toUpperCase());

    if (fromRate == null || fromRate <= 0 || toRate == null || toRate <= 0) {
      return amount; // Fallback if rates cannot be resolved
    }

    // Convert to Corporate Currency, then to Target Currency
    Decimal corporateAmount = amount / fromRate;
    Decimal convertedAmount = corporateAmount * toRate;

    return convertedAmount.setScale(2, System.RoundingMode.HALF_UP);
  }

  /**
   * @description Converts an amount into the org's Corporate Currency
   * @param amount Decimal amount
   * @param fromIso Source currency ISO code
   * @return Converted Decimal in Corporate Currency
   */
  @AuraEnabled
  public static Decimal convertToCorporate(Decimal amount, String fromIso) {
    String corporateIso = getCorporateCurrencyIsoCode();
    return convertAmount(amount, fromIso, corporateIso);
  }

  /**
   * @description Normalizes group aggregate metrics (sum, avg, min, max) into Corporate Currency
   * @param aggregates Map containing raw metric names and numeric values
   * @param sourceIsoCode Currency ISO code of the records in the group
   * @return Updated Map with converted corporate values and corporateIsoCode metadata
   */
  @AuraEnabled
  public static Map<String, Object> convertGroupAggregatesToCorporate(
    Map<String, Object> aggregates,
    String sourceIsoCode
  ) {
    Map<String, Object> corporateRollups = new Map<String, Object>();
    String corpIso = getCorporateCurrencyIsoCode();
    corporateRollups.put('corporateIsoCode', corpIso);

    if (aggregates == null || aggregates.isEmpty()) {
      return corporateRollups;
    }

    for (String key : aggregates.keySet()) {
      Object rawVal = aggregates.get(key);
      if (
        rawVal instanceof Decimal ||
        rawVal instanceof Double ||
        rawVal instanceof Integer
      ) {
        Decimal numVal = Decimal.valueOf(String.valueOf(rawVal));
        Decimal converted = convertAmount(numVal, sourceIsoCode, corpIso);
        corporateRollups.put(key, converted);
      } else {
        corporateRollups.put(key, rawVal);
      }
    }

    return corporateRollups;
  }

  /**
   * @description Extracts ISO currency code from an SObject record
   * @param record Target SObject
   * @return ISO code string (e.g. 'USD', 'EUR')
   */
  @SuppressWarnings('PMD.EmptyCatchBlock')
  public static String getRecordCurrency(SObject record) {
    if (record == null) {
      return getCorporateCurrencyIsoCode();
    }

    if (isMultiCurrencyEnabled()) {
      try {
        Object isoVal = record.get('CurrencyIsoCode');
        if (isoVal != null && String.isNotBlank(String.valueOf(isoVal))) {
          return String.valueOf(isoVal);
        }
      } catch (Exception ex) {
        // Field does not exist on this SObject
      }
    }

    return getCorporateCurrencyIsoCode();
  }

  /**
   * @description Formats a currency value with its ISO code
   * @param amount Decimal amount
   * @param isoCode ISO code
   * @return Formatted string (e.g. 'USD 1,250.00')
   */
  @AuraEnabled
  public static String formatCurrency(Decimal amount, String isoCode) {
    if (amount == null) {
      return '';
    }
    String code = String.isNotBlank(isoCode)
      ? isoCode.toUpperCase()
      : getCorporateCurrencyIsoCode();
    return code +
      ' ' +
      amount.setScale(2, System.RoundingMode.HALF_UP).format();
  }
}

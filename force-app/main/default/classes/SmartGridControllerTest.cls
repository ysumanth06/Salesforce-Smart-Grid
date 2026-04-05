@isTest
public class SmartGridControllerTest {
    
    @isTest
    static void testGetGridConfig_Null() {
        Test.startTest();
        Smart_Grid_Config__mdt config = SmartGridController.getGridConfig(null);
        Test.stopTest();
        System.assertEquals(null, config, 'Config should be null for null dev name');
    }

    @isTest
    static void testGetObjectFields_Valid() {
        Test.startTest();
        List<SmartGridController.ColumnInfo> fields = SmartGridController.getObjectFields('Account');
        Test.stopTest();
        System.assertNotEquals(0, fields.size(), 'Should return fields for Account');
    }
    
    @isTest
    static void testGetObjectFields_Invalid() {
        Test.startTest();
        List<SmartGridController.ColumnInfo> fields = SmartGridController.getObjectFields('InvalidObjectXYZ123__c');
        Test.stopTest();
        System.assertEquals(0, fields.size(), 'Should return no fields for invalid object');
    }

    @isTest
    static void testGetRecords_Valid() {
        Account target = new Account(Name='Test Smart Grid Acc');
        insert target;
        
        Test.startTest();
        List<SObject> records = SmartGridController.getRecords('Account', new List<String>{'Name'}, null, null, 10);
        Test.stopTest();
        
        System.assertEquals(1, records.size(), 'Should return 1 record');
    }

    @isTest
    static void testSaveRecords_Valid() {
        Account target = new Account(Name='Save Test Acc');
        insert target;
        
        target.Name = 'Updated Acc';
        Test.startTest();
        SmartGridController.SaveResult sr = SmartGridController.saveRecords(new List<SObject>{target});
        Test.stopTest();
        
        System.assert(sr.isSuccess, 'Save should be successful');
        
        Account updatedAcc = [SELECT Name FROM Account WHERE Id = :target.Id];
        System.assertEquals('Updated Acc', updatedAcc.Name, 'Name should be updated');
    }
}

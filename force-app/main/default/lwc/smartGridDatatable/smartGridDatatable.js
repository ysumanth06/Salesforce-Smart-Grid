import LightningDatatable from "lightning/datatable";
import picklistTemplate from "./picklistTemplate.html";

export default class SmartGridDatatable extends LightningDatatable {
  static customTypes = {
    picklist: {
      template: picklistTemplate,
      standardCellLayout: true,
      typeAttributes: [
        "label",
        "placeholder",
        "options",
        "context",
        "fieldName"
      ]
    }
  };
}

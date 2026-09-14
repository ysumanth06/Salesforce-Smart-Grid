import LightningDatatable from "lightning/datatable";
import picklistTemplate from "./picklistTemplate.html";
import picklistEditTemplate from "./picklistEditTemplate.html";

export default class SmartGridDatatable extends LightningDatatable {
  static customTypes = {
    picklist: {
      template: picklistTemplate,
      editTemplate: picklistEditTemplate,
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

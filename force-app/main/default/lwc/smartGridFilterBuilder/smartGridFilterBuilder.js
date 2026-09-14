import { LightningElement, api, track } from "lwc";

export default class SmartGridFilterBuilder extends LightningElement {
  @api columns = [];
  @track rootGroup = {
    id: "root",
    logic: "AND",
    conditions: [
      {
        id: "c_init_1",
        field: "",
        operator: "=",
        value: "",
        operatorOptions: [
          { label: "contains", value: "contains" },
          { label: "equals (=)", value: "=" },
          { label: "not equal (!=)", value: "!=" },
          { label: "starts with", value: "starts_with" },
          { label: "ends with", value: "ends_with" },
          { label: "does not contain", value: "not_contains" }
        ]
      }
    ],
    groups: []
  };

  connectedCallback() {
    if (this.rootGroup && this.rootGroup.conditions) {
      this.rootGroup.conditions.forEach((c) => {
        if (!c.operatorOptions || c.operatorOptions.length === 0) {
          c.operatorOptions = this.getOperatorOptionsForField(c.field);
        }
      });
    }
  }

  @api
  get filterExpression() {
    return this.serializeGroup(this.rootGroup);
  }
  set filterExpression(val) {
    if (val) {
      try {
        const parsed = typeof val === "string" ? JSON.parse(val) : val;
        this.rootGroup = this.hydrateGroup(parsed, "root");
      } catch {
        // Fallback to default structure
      }
    }
  }

  get fieldOptions() {
    if (!this.columns || this.columns.length === 0) return [];
    return this.columns
      .filter((col) => col.fieldName && col.fieldName !== "Id")
      .map((col) => ({
        label: col.label || col.fieldName,
        value: col.fieldName
      }));
  }

  get logicOptions() {
    return [
      { label: "All conditions must be met (AND)", value: "AND" },
      { label: "Any condition can be met (OR)", value: "OR" }
    ];
  }

  getOperatorOptionsForType(type) {
    const t = (type || "").toUpperCase();
    if (["DOUBLE", "INTEGER", "LONG", "CURRENCY", "PERCENT"].includes(t)) {
      return [
        { label: "equals (=)", value: "=" },
        { label: "not equal (!=)", value: "!=" },
        { label: "greater than (>)", value: ">" },
        { label: "greater or equal (>=)", value: ">=" },
        { label: "less than (<)", value: "<" },
        { label: "less or equal (<=)", value: "<=" }
      ];
    }
    if (["DATE", "DATETIME"].includes(t)) {
      return [
        { label: "on (=)", value: "=" },
        { label: "not on (!=)", value: "!=" },
        { label: "after (>)", value: ">" },
        { label: "on or after (>=)", value: ">=" },
        { label: "before (<)", value: "<" },
        { label: "on or before (<=)", value: "<=" }
      ];
    }
    if (t === "BOOLEAN") {
      return [
        { label: "equals (=)", value: "=" },
        { label: "not equal (!=)", value: "!=" }
      ];
    }
    return [
      { label: "contains", value: "contains" },
      { label: "equals (=)", value: "=" },
      { label: "not equal (!=)", value: "!=" },
      { label: "starts with", value: "starts_with" },
      { label: "ends with", value: "ends_with" },
      { label: "does not contain", value: "not_contains" }
    ];
  }

  @api
  getOperatorOptionsForField(fieldName) {
    if (!fieldName || !this.columns || this.columns.length === 0) {
      return this.getOperatorOptionsForType("STRING");
    }
    const lowerName = fieldName.toLowerCase();
    const col = this.columns.find(
      (c) =>
        (c.fieldName && c.fieldName.toLowerCase() === lowerName) ||
        (c.fieldApiName && c.fieldApiName.toLowerCase() === lowerName)
    );
    const type = col ? col.type || "STRING" : "STRING";
    return this.getOperatorOptionsForType(type);
  }

  hydrateGroup(group, idPrefix) {
    return {
      id: idPrefix,
      logic: group.logic || "AND",
      conditions: (group.conditions || []).map((c, idx) => ({
        id: `${idPrefix}_c_${idx}_${Date.now()}`,
        field: c.field || "",
        operator: c.operator || "=",
        value: c.value != null ? String(c.value) : "",
        operatorOptions: this.getOperatorOptionsForField(c.field)
      })),
      groups: (group.groups || []).map((g, idx) =>
        this.hydrateGroup(g, `${idPrefix}_g_${idx}_${Date.now()}`)
      )
    };
  }

  serializeGroup(group) {
    return {
      logic: group.logic,
      conditions: group.conditions
        .filter((c) => c.field && c.operator)
        .map((c) => ({
          field: c.field,
          operator: c.operator,
          value: c.value
        })),
      groups: group.groups
        .map((g) => this.serializeGroup(g))
        .filter((g) => g.conditions.length > 0 || g.groups.length > 0)
    };
  }

  handleRootLogicChange(event) {
    this.rootGroup.logic = event.detail.value;
  }

  handleConditionChange(event) {
    const { id, field } = event.target.dataset;
    const value = event.detail ? event.detail.value : event.target.value;
    this.updateCondition(this.rootGroup, id, field, value);
  }

  updateCondition(group, condId, fieldName, newVal) {
    let found = false;
    group.conditions = (group.conditions || []).map((cond) => {
      if (cond.id === condId) {
        found = true;
        const updated = { ...cond, [fieldName]: newVal };
        if (fieldName === "field") {
          updated.operatorOptions = this.getOperatorOptionsForField(newVal);
          if (updated.operatorOptions && updated.operatorOptions.length > 0) {
            updated.operator = updated.operatorOptions[0].value;
          }
        }
        return updated;
      }
      return cond;
    });

    if (!found && group.groups) {
      for (const childGroup of group.groups) {
        this.updateCondition(childGroup, condId, fieldName, newVal);
      }
    }
  }

  @api
  handleAddCondition() {
    const defaultField = this.fieldOptions[0] ? this.fieldOptions[0].value : "";
    this.rootGroup.conditions = [
      ...this.rootGroup.conditions,
      {
        id: `c_${Date.now()}_${Math.random()}`,
        field: defaultField,
        operator: "=",
        value: "",
        operatorOptions: this.getOperatorOptionsForField(defaultField)
      }
    ];
  }

  @api
  handleAddGroup() {
    const defaultField = this.fieldOptions[0] ? this.fieldOptions[0].value : "";
    this.rootGroup.groups = [
      ...this.rootGroup.groups,
      {
        id: `g_${Date.now()}_${Math.random()}`,
        logic: "OR",
        conditions: [
          {
            id: `c_${Date.now()}_${Math.random()}`,
            field: defaultField,
            operator: "=",
            value: "",
            operatorOptions: this.getOperatorOptionsForField(defaultField)
          }
        ],
        groups: []
      }
    ];
  }

  handleRemoveCondition(event) {
    const condId = event.target.dataset.id;
    this.removeConditionFromGroup(this.rootGroup, condId);
  }

  removeConditionFromGroup(group, condId) {
    group.conditions = (group.conditions || []).filter((c) => c.id !== condId);
    if (group.groups) {
      for (const child of group.groups) {
        this.removeConditionFromGroup(child, condId);
      }
    }
  }

  handleRemoveGroup(event) {
    const groupId = event.target.dataset.id;
    this.rootGroup.groups = (this.rootGroup.groups || []).filter(
      (g) => g.id !== groupId
    );
  }

  @api
  handleClearAll() {
    this.rootGroup = {
      id: "root",
      logic: "AND",
      conditions: [],
      groups: []
    };
  }

  @api
  handleApply() {
    const serialized = this.serializeGroup(this.rootGroup);
    this.dispatchEvent(
      new CustomEvent("applyfilter", {
        detail: {
          expression: serialized,
          json: JSON.stringify(serialized)
        }
      })
    );
  }

  @api
  handleClose() {
    this.dispatchEvent(new CustomEvent("close"));
  }
}

import { LightningElement, api, track } from "lwc";

export default class SmartGridCellDateTime extends LightningElement {
  @api context = "";
  @api fieldName = "";
  @api isEditable = false;
  @api timeInterval = 15;

  @api
  get value() {
    return this._currentValue;
  }
  set value(val) {
    this._currentValue = val;
    this.parseValueToInputs();
  }

  @track _currentValue = "";
  @track isEditing = false;
  @track editDate = "";
  @track editTime = "09:00";

  connectedCallback() {
    this.parseValueToInputs();
  }

  parseValueToInputs() {
    if (!this._currentValue) {
      this.editDate = "";
      this.editTime = "09:00";
      return;
    }

    try {
      const d = new Date(this._currentValue);
      if (!isNaN(d.getTime())) {
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, "0");
        const day = String(d.getUTCDate()).padStart(2, "0");
        this.editDate = `${year}-${month}-${day}`;

        const hours = String(d.getUTCHours()).padStart(2, "0");
        const mins = String(Math.floor(d.getUTCMinutes() / 15) * 15).padStart(
          2,
          "0"
        );
        this.editTime = `${hours}:${mins}`;
      }
    } catch {
      this.editDate = "";
      this.editTime = "09:00";
    }
  }

  get computedDisplayValue() {
    if (!this._currentValue) {
      return "";
    }
    try {
      const d = new Date(this._currentValue);
      if (isNaN(d.getTime())) {
        return this._currentValue;
      }
      return d.toLocaleString();
    } catch {
      return this._currentValue;
    }
  }

  get timeOptions() {
    const list = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        const val = `${hh}:${mm}`;
        list.push({
          label: val,
          value: val,
          isSelected: val === this.editTime
        });
      }
    }
    return list;
  }

  handleStartEdit() {
    if (this.isEditable === false) {
      return;
    }
    this.parseValueToInputs();
    this.isEditing = true;
  }

  handleCancel() {
    this.parseValueToInputs();
    this.isEditing = false;
  }

  handleDateChange(event) {
    this.editDate = event.target.value;
  }

  handleTimeChange(event) {
    this.editTime = event.target.value;
  }

  handleApply() {
    if (!this.editDate) {
      this.isEditing = false;
      return;
    }

    const [year, month, day] = this.editDate.split("-");
    const [hours, mins] = (this.editTime || "00:00").split(":");

    const isoString = new Date(
      Date.UTC(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
        parseInt(hours, 10),
        parseInt(mins, 10)
      )
    ).toISOString();

    const oldValue = this._currentValue;
    this._currentValue = isoString;
    this.isEditing = false;

    if (isoString !== oldValue) {
      this.dispatchEvent(
        new CustomEvent("cellchange", {
          bubbles: true,
          composed: true,
          detail: {
            recordId: this.context,
            fieldName: this.fieldName,
            value: isoString,
            displayValue: this.computedDisplayValue,
            oldValue
          }
        })
      );
    }
  }
}

import { LightningElement, api, track } from "lwc";
import {
  createRange,
  isCellInRange,
  isRangeOrigin,
  expandRange,
  computeFillDown,
  computeClearRange
} from "c/rangeSelectionManager";
import {
  serializeRangeToTsv,
  parseTsvToMatrix,
  applyPastedMatrix
} from "c/clipboardManager";

export default class SmartGridTable extends LightningElement {
  @api columns = [];
  @api records = [];
  @api keyField = "Id";
  @api sortedBy;
  @api sortedDirection = "asc";
  @api draftValues = [];
  @api isLoading = false;
  @api hasMore = false;
  @api rowHeight = 36;
  @api bufferRows = 15;
  @api selectedRowIds = [];

  @track scrollTop = 0;
  @track viewportHeight = 600;
  @track activeEditingCell = null; // { recordId, fieldName }
  @track activeRange = null; // 2D selection bounding box
  @track isSelectingRange = false;

  @api
  get selectedRange() {
    return this.activeRange;
  }

  @api
  setRange(startRow, startCol, endRow, endCol) {
    this.activeRange = createRange(startRow, startCol, endRow, endCol);
  }

  @api
  clearSelectedRange() {
    this.activeRange = null;
  }

  connectedCallback() {
    this.updateViewportDimensions();
  }

  renderedCallback() {
    this.updateViewportDimensions();
  }

  updateViewportDimensions() {
    const container = this.template.querySelector(
      ".smart-grid-table-container"
    );
    if (
      container &&
      container.clientHeight > 0 &&
      container.clientHeight !== this.viewportHeight
    ) {
      this.viewportHeight = container.clientHeight;
    }
  }

  get totalColCount() {
    return (this.columns ? this.columns.length : 0) + 2; // + Checkbox + Row #
  }

  @api
  get totalRows() {
    return this.records ? this.records.length : 0;
  }

  get isAllSelected() {
    if (!this.totalRows || !this.selectedRowIds) {
      return false;
    }
    return this.selectedRowIds.length >= this.totalRows;
  }

  @api
  get isVirtualActive() {
    // Engage virtualization when total rows exceed 50
    return this.totalRows > 50;
  }

  @api
  get startIndex() {
    if (!this.isVirtualActive) {
      return 0;
    }
    const computed =
      Math.floor(this.scrollTop / this.rowHeight) - this.bufferRows;
    return Math.max(0, computed);
  }

  @api
  get endIndex() {
    if (!this.isVirtualActive) {
      return this.totalRows;
    }
    const visibleCount = Math.ceil(this.viewportHeight / this.rowHeight);
    const computed = this.startIndex + visibleCount + 2 * this.bufferRows;
    return Math.min(this.totalRows, computed);
  }

  @api
  get topSpacerHeight() {
    return this.startIndex * this.rowHeight;
  }

  @api
  get bottomSpacerHeight() {
    return Math.max(0, (this.totalRows - this.endIndex) * this.rowHeight);
  }

  get showTopSpacer() {
    return this.isVirtualActive && this.topSpacerHeight > 0;
  }

  get showBottomSpacer() {
    return this.isVirtualActive && this.bottomSpacerHeight > 0;
  }

  get topSpacerStyle() {
    return `height: ${this.topSpacerHeight}px;`;
  }

  get bottomSpacerStyle() {
    return `height: ${this.bottomSpacerHeight}px;`;
  }

  get viewportStyle() {
    return `min-height: 200px;`;
  }

  get computedColumns() {
    if (!this.columns) {
      return [];
    }
    return this.columns.map((col) => {
      const isSorted = this.sortedBy === col.fieldName;
      const isDesc =
        this.sortedDirection && this.sortedDirection.toLowerCase() === "desc";
      return {
        ...col,
        isSorted,
        sortIconName: isDesc ? "utility:arrowdown" : "utility:arrowup",
        headerClass: `slds-is-resizable ${col.sortable ? "slds-is-sortable" : ""}`,
        style: col.width ? `width: ${col.width}px;` : "min-width: 140px;"
      };
    });
  }

  get draftMap() {
    const map = new Map();
    if (this.draftValues && Array.isArray(this.draftValues)) {
      this.draftValues.forEach((draft) => {
        const id = draft[this.keyField];
        if (id) {
          map.set(id, draft);
        }
      });
    }
    return map;
  }

  get selectedIdSet() {
    return new Set(this.selectedRowIds || []);
  }

  get visibleRows() {
    if (!this.records || this.records.length === 0) {
      return [];
    }

    const currentDraftMap = this.draftMap;
    const currentSelectedSet = this.selectedIdSet;
    const slice = this.records.slice(this.startIndex, this.endIndex);

    return slice.map((record, index) => {
      const globalIndex = this.startIndex + index;
      const id = record[this.keyField];
      const isSelected = currentSelectedSet.has(id);
      const rowDraft = currentDraftMap.get(id) || {};

      const cells = (this.columns || []).map((col, colIndex) => {
        const field = col.fieldName;
        const isDraft = rowDraft[field] !== undefined;
        const rawValue = isDraft ? rowDraft[field] : record[field];
        const isEditing =
          this.activeEditingCell &&
          this.activeEditingCell.recordId === id &&
          this.activeEditingCell.fieldName === field;

        const inRange = isCellInRange(globalIndex, colIndex, this.activeRange);
        const origin = isRangeOrigin(globalIndex, colIndex, this.activeRange);

        let inputType = "text";
        if (
          col.type === "number" ||
          col.type === "currency" ||
          col.type === "percent"
        ) {
          inputType = "number";
        } else if (col.type === "date") {
          inputType = "date";
        }

        let cellClass = isDraft
          ? "slds-cell-edit slds-is-edited"
          : "slds-cell-edit";
        if (inRange) {
          cellClass += " in-range-cell";
        }
        if (origin) {
          cellClass += " in-range-origin";
        }

        return {
          key: `${id}-${field}`,
          fieldName: field,
          rowIndex: globalIndex,
          colIndex,
          displayValue:
            rawValue !== null && rawValue !== undefined ? String(rawValue) : "",
          isDraft,
          isEditing: isEditing && col.editable !== false,
          inputType,
          cellClass,
          isInRange: inRange,
          isRangeOrigin: origin
        };
      });

      return {
        id,
        displayIndex: globalIndex + 1,
        checkboxId: `row-cb-${id}`,
        isSelected,
        rowClass: isSelected
          ? "slds-hint-parent is-selected"
          : "slds-hint-parent",
        cells
      };
    });
  }

  @api
  handleScroll(event) {
    const target = event.target;
    this.scrollTop = target.scrollTop;
    this.viewportHeight = target.clientHeight || 600;

    // Check if scrolled near bottom to trigger loadmore
    if (this.hasMore && !this.isLoading) {
      const scrollBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight;
      if (scrollBottom < 250) {
        this.dispatchEvent(new CustomEvent("loadmore"));
      }
    }
  }

  handleSelectAll(event) {
    const isChecked = event.target.checked;
    const selectedRows = isChecked
      ? this.records.map((r) => r[this.keyField])
      : [];
    this.dispatchEvent(
      new CustomEvent("rowselection", {
        detail: { selectedRows }
      })
    );
  }

  handleRowCheckboxChange(event) {
    const recordId = event.target.dataset.id;
    const isChecked = event.target.checked;
    const currentSet = new Set(this.selectedRowIds || []);

    if (isChecked) {
      currentSet.add(recordId);
    } else {
      currentSet.delete(recordId);
    }

    this.dispatchEvent(
      new CustomEvent("rowselection", {
        detail: { selectedRows: Array.from(currentSet) }
      })
    );
  }

  handleHeaderClick(event) {
    const headerEl = event.currentTarget;
    const fieldName = headerEl.dataset.field;
    if (!fieldName) {
      return;
    }

    const col = (this.columns || []).find((c) => c.fieldName === fieldName);
    if (!col || col.sortable === false) {
      return;
    }

    let nextDirection = "asc";
    if (this.sortedBy === fieldName && this.sortedDirection === "asc") {
      nextDirection = "desc";
    }

    this.dispatchEvent(
      new CustomEvent("sort", {
        detail: {
          fieldName,
          sortDirection: nextDirection
        }
      })
    );
  }

  handleCellDblClick(event) {
    const cell = event.currentTarget;
    const recordId = cell.dataset.id;
    const fieldName = cell.dataset.field;

    const col = (this.columns || []).find((c) => c.fieldName === fieldName);
    if (!col || col.editable === false) {
      return;
    }

    this.activeEditingCell = { recordId, fieldName };
  }

  handleCellEditBlur(event) {
    if (!this.activeEditingCell) {
      return;
    }

    const recordId = event.target.dataset.id;
    const fieldName = event.target.dataset.field;
    const newValue = event.target.value;

    const record = (this.records || []).find(
      (r) => r[this.keyField] === recordId
    );
    const oldValue = record ? record[fieldName] : undefined;

    this.activeEditingCell = null;

    if (String(newValue) !== String(oldValue)) {
      this.dispatchEvent(
        new CustomEvent("cellchange", {
          detail: {
            recordId,
            fieldName,
            value: newValue,
            oldValue
          }
        })
      );
    }
  }

  handleCellEditKeyDown(event) {
    if (event.key === "Enter") {
      event.target.blur();
    } else if (event.key === "Escape") {
      this.activeEditingCell = null;
    }
  }

  handleCellMouseDown(event) {
    if (event.target.tagName === "INPUT") {
      return;
    }
    const cell = event.currentTarget;
    const rowIndex = parseInt(cell.dataset.rowIndex, 10);
    const colIndex = parseInt(cell.dataset.colIndex, 10);
    if (isNaN(rowIndex) || isNaN(colIndex)) {
      return;
    }

    if (event.shiftKey && this.activeRange) {
      this.activeRange = createRange(
        this.activeRange.startRow,
        this.activeRange.startCol,
        rowIndex,
        colIndex
      );
    } else {
      this.activeRange = createRange(rowIndex, colIndex, rowIndex, colIndex);
      this.isSelectingRange = true;
    }
    this.dispatchRangeChange();
  }

  handleCellMouseEnter(event) {
    if (!this.isSelectingRange || !this.activeRange) {
      return;
    }
    const cell = event.currentTarget;
    const rowIndex = parseInt(cell.dataset.rowIndex, 10);
    const colIndex = parseInt(cell.dataset.colIndex, 10);
    if (isNaN(rowIndex) || isNaN(colIndex)) {
      return;
    }

    this.activeRange = createRange(
      this.activeRange.startRow,
      this.activeRange.startCol,
      rowIndex,
      colIndex
    );
    this.dispatchRangeChange();
  }

  handleMouseUp() {
    this.isSelectingRange = false;
  }

  dispatchRangeChange() {
    this.dispatchEvent(
      new CustomEvent("rangeselect", {
        detail: { range: this.activeRange }
      })
    );
  }

  handleKeyDown(event) {
    if (this.activeEditingCell) {
      return;
    }

    const isMac =
      typeof navigator !== "undefined" &&
      navigator.platform &&
      navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const modifier = isMac ? event.metaKey : event.ctrlKey;
    const key = event.key ? event.key.toLowerCase() : "";

    if (modifier && key === "c") {
      if (this.activeRange) {
        this.copyRange();
      }
    } else if (modifier && key === "d") {
      if (this.activeRange) {
        event.preventDefault();
        this.handleFillDown();
      }
    } else if (event.key === "Delete" || event.key === "Backspace") {
      if (this.activeRange) {
        event.preventDefault();
        this.handleClearRange();
      }
    } else if (event.shiftKey && this.activeRange) {
      let direction = null;
      if (event.key === "ArrowUp") direction = "UP";
      else if (event.key === "ArrowDown") direction = "DOWN";
      else if (event.key === "ArrowLeft") direction = "LEFT";
      else if (event.key === "ArrowRight") direction = "RIGHT";

      if (direction) {
        event.preventDefault();
        const totalCols = this.columns ? this.columns.length : 0;
        this.activeRange = expandRange(
          this.activeRange,
          direction,
          this.totalRows,
          totalCols
        );
        this.dispatchRangeChange();
      }
    }
  }

  @api
  copyRange() {
    if (!this.activeRange || !this.records || !this.columns) {
      return "";
    }
    const tsv = serializeRangeToTsv(
      this.records,
      this.columns,
      this.activeRange
    );
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      navigator.clipboard.writeText(tsv).catch(() => {});
    }
    this.dispatchEvent(
      new CustomEvent("rangecopy", {
        detail: { tsv, range: this.activeRange }
      })
    );
    return tsv;
  }

  handlePaste(event) {
    if (this.activeEditingCell) {
      return;
    }
    const clipboardData =
      event.clipboardData ||
      (typeof window !== "undefined" && window.clipboardData);
    if (!clipboardData) {
      return;
    }
    const text = clipboardData.getData("text");
    if (!text) {
      return;
    }
    event.preventDefault();
    this.applyPastedText(text);
  }

  @api
  applyPastedText(text) {
    const matrix = parseTsvToMatrix(text);
    if (!matrix || matrix.length === 0) {
      return;
    }

    const anchorRow = this.activeRange ? this.activeRange.minRow : 0;
    const anchorCol = this.activeRange ? this.activeRange.minCol : 0;

    const changes = applyPastedMatrix(
      matrix,
      anchorRow,
      anchorCol,
      this.records,
      this.columns
    );
    if (changes && changes.length > 0) {
      this.dispatchEvent(
        new CustomEvent("cellschange", {
          detail: { changes }
        })
      );
    }
  }

  @api
  handleFillDown() {
    if (!this.activeRange) {
      return;
    }
    const changes = computeFillDown(
      this.records,
      this.columns,
      this.activeRange
    );
    if (changes && changes.length > 0) {
      this.dispatchEvent(
        new CustomEvent("cellschange", {
          detail: { changes }
        })
      );
    }
  }

  @api
  handleClearRange() {
    if (!this.activeRange) {
      return;
    }
    const changes = computeClearRange(
      this.records,
      this.columns,
      this.activeRange
    );
    if (changes && changes.length > 0) {
      this.dispatchEvent(
        new CustomEvent("cellschange", {
          detail: { changes }
        })
      );
    }
  }
}

/**
 * DirtyStateManager manages an undo/redo stack using a bounded circular buffer (max 50).
 * Tracks cell-level edits, fill-down operations, and paste operations.
 */
export class DirtyStateManager {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Records an operation on the undo stack and clears the redo stack.
   * Drops the oldest operation if stack exceeds maxSize.
   *
   * @param {Object} operation - { type: 'cell'|'compound', changes: [{ recordId, fieldName, oldValue, newValue }] }
   */
  push(operation) {
    if (!operation || !operation.changes || operation.changes.length === 0) {
      return;
    }

    this.undoStack.push(operation);
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift(); // Remove oldest operation
    }
    this.redoStack = []; // Clear redo stack on new operation
  }

  /**
   * Pops the latest operation from the undo stack and moves it to redo.
   * @returns {Object|null} The operation to undo
   */
  undo() {
    if (!this.canUndo) {
      return null;
    }
    const op = this.undoStack.pop();
    this.redoStack.push(op);
    return op;
  }

  /**
   * Pops the latest operation from the redo stack and moves it to undo.
   * @returns {Object|null} The operation to redo
   */
  redo() {
    if (!this.canRedo) {
      return null;
    }
    const op = this.redoStack.pop();
    this.undoStack.push(op);
    return op;
  }

  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }

  get undoCount() {
    return this.undoStack.length;
  }

  get redoCount() {
    return this.redoStack.length;
  }

  /**
   * Clears both undo and redo stacks (called on Save).
   */
  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

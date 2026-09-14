import { DirtyStateManager } from "c/dirtyStateManager";

describe("DirtyStateManager", () => {
  let manager;

  beforeEach(() => {
    manager = new DirtyStateManager(50);
  });

  test("initializes with empty stacks", () => {
    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(false);
    expect(manager.undo()).toBeNull();
    expect(manager.redo()).toBeNull();
  });

  test("pushes operations and allows undo then redo", () => {
    const op1 = {
      changes: [
        { recordId: "001", fieldName: "Name", oldValue: "A", newValue: "B" }
      ]
    };
    manager.push(op1);

    expect(manager.canUndo).toBe(true);
    expect(manager.canRedo).toBe(false);

    const undone = manager.undo();
    expect(undone).toEqual(op1);
    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(true);

    const redone = manager.redo();
    expect(redone).toEqual(op1);
    expect(manager.canUndo).toBe(true);
    expect(manager.canRedo).toBe(false);
  });

  test("caps at max 50 operations and drops oldest", () => {
    const smallManager = new DirtyStateManager(3);
    for (let i = 1; i <= 5; i++) {
      smallManager.push({
        changes: [
          { recordId: "001", fieldName: "Val", oldValue: i - 1, newValue: i }
        ]
      });
    }

    expect(smallManager.undoCount).toBe(3);
    // Oldest 2 should be dropped, remaining should be 3, 4, 5
    const op = smallManager.undo();
    expect(op.changes[0].newValue).toBe(5);
  });

  test("clears both stacks on clear()", () => {
    manager.push({
      changes: [
        { recordId: "001", fieldName: "Name", oldValue: "A", newValue: "B" }
      ]
    });
    manager.undo();
    expect(manager.canRedo).toBe(true);

    manager.clear();
    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(false);
  });
});

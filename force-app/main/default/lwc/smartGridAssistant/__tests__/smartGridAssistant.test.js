import { createElement } from "@lwc/engine-dom";
import SmartGridAssistant from "c/smartGridAssistant";
import askAssistant from "@salesforce/apex/SmartGridNLPEngine.askAssistant";

jest.mock(
  "@salesforce/apex/SmartGridNLPEngine.askAssistant",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

describe("c-smart-grid-assistant", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  it("does not render drawer when isOpen is false", () => {
    const element = createElement("c-smart-grid-assistant", {
      is: SmartGridAssistant
    });
    element.isOpen = false;
    document.body.appendChild(element);

    const drawer = element.shadowRoot.querySelector(
      '[data-testid="assistant-drawer"]'
    );
    expect(drawer).toBeNull();
  });

  it("renders welcome chips and handles input submission", async () => {
    askAssistant.mockResolvedValue({
      isSuccess: true,
      answer: "The total annual revenue across active accounts is $5,200,000.",
      computedValue: "5200000"
    });

    const element = createElement("c-smart-grid-assistant", {
      is: SmartGridAssistant
    });
    element.isOpen = true;
    element.objectApiName = "Account";
    document.body.appendChild(element);

    const input = element.shadowRoot.querySelector(
      '[data-testid="assistant-input"]'
    );
    expect(input).not.toBeNull();

    input.value = "What is the total revenue?";
    input.dispatchEvent(new CustomEvent("input"));

    await Promise.resolve();

    const sendBtn = element.shadowRoot.querySelector(
      '[data-testid="assistant-send-btn"]'
    );
    sendBtn.click();

    await Promise.resolve();
    await Promise.resolve();

    expect(askAssistant).toHaveBeenCalled();
    const bubbles = element.shadowRoot.querySelectorAll(".msg-content");
    expect(bubbles.length).toBe(2);
    expect(bubbles[0].textContent).toBe("What is the total revenue?");
    expect(bubbles[1].textContent).toContain("$5,200,000");
  });

  it("clears chat history when clicking clear button", async () => {
    askAssistant.mockResolvedValue({
      isSuccess: true,
      answer: "Sample answer"
    });

    const element = createElement("c-smart-grid-assistant", {
      is: SmartGridAssistant
    });
    element.isOpen = true;
    document.body.appendChild(element);

    const chip = element.shadowRoot.querySelector(
      '[data-testid="starter-chip"]'
    );
    chip.click();

    await Promise.resolve();
    await Promise.resolve();

    let bubbles = element.shadowRoot.querySelectorAll(".msg-content");
    expect(bubbles.length).toBeGreaterThan(0);

    const clearBtn = element.shadowRoot.querySelector(
      '[data-testid="clear-history-btn"]'
    );
    clearBtn.click();

    await Promise.resolve();
    bubbles = element.shadowRoot.querySelectorAll(".msg-content");
    expect(bubbles.length).toBe(0);
  });

  it("fires close event on close button click", () => {
    const element = createElement("c-smart-grid-assistant", {
      is: SmartGridAssistant
    });
    element.isOpen = true;
    document.body.appendChild(element);

    const closeHandler = jest.fn();
    element.addEventListener("close", closeHandler);

    const closeBtn = element.shadowRoot.querySelector(
      '[data-testid="close-assistant-btn"]'
    );
    closeBtn.click();

    expect(closeHandler).toHaveBeenCalled();
    expect(element.isOpen).toBe(false);
  });
});

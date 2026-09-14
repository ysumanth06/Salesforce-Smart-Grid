import { createElement } from "@lwc/engine-dom";
import SmartGridOnboarding from "c/smartGridOnboarding";

describe("c-smart-grid-onboarding", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("does not render when isOpen is false", () => {
    const element = createElement("c-smart-grid-onboarding", {
      is: SmartGridOnboarding
    });
    element.isOpen = false;
    document.body.appendChild(element);

    const modal = element.shadowRoot.querySelector(
      '[data-testid="onboarding-modal"]'
    );
    expect(modal).toBeNull();
  });

  it("advances through steps on Next and Back clicks", async () => {
    const element = createElement("c-smart-grid-onboarding", {
      is: SmartGridOnboarding
    });
    element.isOpen = true;
    document.body.appendChild(element);

    const title = element.shadowRoot.querySelector(".step-title");
    expect(title.textContent).toContain("Welcome to AI Smart Grid");

    const nextBtn = element.shadowRoot.querySelector(
      '[data-testid="next-step-btn"]'
    );
    nextBtn.click();

    await Promise.resolve();
    expect(title.textContent).toContain("AI Command Palette");

    const prevBtn = element.shadowRoot.querySelector(
      '[data-testid="prev-step-btn"]'
    );
    expect(prevBtn).not.toBeNull();
    prevBtn.click();

    await Promise.resolve();
    expect(title.textContent).toContain("Welcome to AI Smart Grid");
  });

  it("dispatches finish event on completion", async () => {
    const element = createElement("c-smart-grid-onboarding", {
      is: SmartGridOnboarding
    });
    element.isOpen = true;
    document.body.appendChild(element);

    const finishHandler = jest.fn();
    element.addEventListener("finish", finishHandler);

    // Advance to last step (3 steps)
    const getNextBtn = () =>
      element.shadowRoot.querySelector('[data-testid="next-step-btn"]');
    if (getNextBtn()) {
      getNextBtn().click();
    }
    await Promise.resolve();
    if (getNextBtn()) {
      getNextBtn().click();
    }
    await Promise.resolve();
    if (getNextBtn()) {
      getNextBtn().click();
    }
    await Promise.resolve();

    const finishBtn = element.shadowRoot.querySelector(
      '[data-testid="finish-tour-btn"]'
    );
    expect(finishBtn).not.toBeNull();
    finishBtn.click();

    expect(finishHandler).toHaveBeenCalled();
  });

  it("dispatches close event on skip", () => {
    const element = createElement("c-smart-grid-onboarding", {
      is: SmartGridOnboarding
    });
    element.isOpen = true;
    document.body.appendChild(element);

    const closeHandler = jest.fn();
    element.addEventListener("close", closeHandler);

    const skipBtn = element.shadowRoot.querySelector(
      '[data-testid="skip-tour-btn"]'
    );
    skipBtn.click();

    expect(closeHandler).toHaveBeenCalled();
  });
});

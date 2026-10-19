import { createElement } from "lwc";
import SmartGridAdminStudio from "c/smartGridAdminStudio";
import getObjectFields from "@salesforce/apex/SmartGridController.getObjectFields";
import deployGridConfig from "@salesforce/apex/SmartGridMetadataDeployer.deployGridConfig";

jest.mock(
  "@salesforce/apex/SmartGridController.getObjectFields",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/SmartGridMetadataDeployer.deployGridConfig",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

describe("c-smart-grid-admin-studio", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  const MOCK_FIELDS = [
    { label: "Account Name", fieldName: "Name", type: "text" },
    { label: "Industry", fieldName: "Industry", type: "text" },
    { label: "Annual Revenue", fieldName: "AnnualRevenue", type: "currency" }
  ];

  it("renders general config and loads available fields on connect", async () => {
    getObjectFields.mockResolvedValue(MOCK_FIELDS);

    const element = createElement("c-smart-grid-admin-studio", {
      is: SmartGridAdminStudio
    });
    document.body.appendChild(element);

    await Promise.resolve();
    await Promise.resolve();

    expect(getObjectFields).toHaveBeenCalledWith({ objectApiName: "Account" });
    const deployBtn = element.shadowRoot.querySelector(
      '[data-testid="deploy-grid-btn"]'
    );
    expect(deployBtn).not.toBeNull();
  });

  it("enqueues metadata deployment when Deploy Grid Metadata button is clicked", async () => {
    getObjectFields.mockResolvedValue(MOCK_FIELDS);
    deployGridConfig.mockResolvedValue({
      isSuccess: true,
      deploymentJobId: "0Af000000000001AAA"
    });

    const element = createElement("c-smart-grid-admin-studio", {
      is: SmartGridAdminStudio
    });
    document.body.appendChild(element);

    await Promise.resolve();
    await Promise.resolve();

    const deployBtn = element.shadowRoot.querySelector(
      '[data-testid="deploy-grid-btn"]'
    );
    deployBtn.click();

    await Promise.resolve();
    await Promise.resolve();

    expect(deployGridConfig).toHaveBeenCalledTimes(1);
    expect(deployGridConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          configDeveloperName: "Custom_Account_Grid",
          objectApiName: "Account"
        })
      })
    );
  });
});

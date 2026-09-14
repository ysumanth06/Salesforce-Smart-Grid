import { exportToCSV } from "c/csvHelper";

describe("csvHelper", () => {
  let clickMock;
  let createdLink;

  beforeEach(() => {
    clickMock = jest.fn();
    createdLink = {
      download: "",
      setAttribute: jest.fn(),
      click: clickMock,
      style: {}
    };

    jest.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "a") {
        return createdLink;
      }
      return document.createElement(tag);
    });

    jest.spyOn(document.body, "appendChild").mockImplementation(() => {});
    jest.spyOn(document.body, "removeChild").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("handles empty or invalid inputs gracefully", () => {
    exportToCSV([], []);
    expect(clickMock).not.toHaveBeenCalled();

    exportToCSV(null, [{ fieldName: "Name" }]);
    expect(clickMock).not.toHaveBeenCalled();
  });

  test("exports valid rows and escapes quotes properly", () => {
    const data = [{ Id: "001", Name: 'Acme "Global"', Rating: "Hot" }];
    const columns = [
      { label: "Account Name", fieldName: "Name" },
      { label: "Rating", fieldName: "Rating" },
      { label: "Action", type: "action" },
      { label: "Name Url", fieldName: "Name_Url" }
    ];

    exportToCSV(data, columns, "accounts.csv");

    expect(createdLink.setAttribute).toHaveBeenCalledWith(
      "download",
      "accounts.csv"
    );
    expect(createdLink.click).toHaveBeenCalled();

    const hrefCall = createdLink.setAttribute.mock.calls.find(
      (c) => c[0] === "href"
    );
    expect(hrefCall).toBeDefined();
    const decoded = decodeURIComponent(hrefCall[1]);
    expect(decoded).toContain('"Account Name","Rating"');
    expect(decoded).toContain('"Acme ""Global"""');
    expect(decoded).not.toContain("Action");
    expect(decoded).not.toContain("Name_Url");
  });

  test("mitigates CSV formula injection (CWE-1236)", () => {
    const data = [
      {
        Id: "001",
        Name: "=cmd|' /C calc'!A0",
        Formula2: "+123",
        Formula3: "@SUM(A1:A5)",
        Formula4: "-50"
      }
    ];
    const columns = [
      { label: "Name", fieldName: "Name" },
      { label: "F2", fieldName: "Formula2" },
      { label: "F3", fieldName: "Formula3" },
      { label: "F4", fieldName: "Formula4" }
    ];

    exportToCSV(data, columns);

    const hrefCall = createdLink.setAttribute.mock.calls.find(
      (c) => c[0] === "href"
    );
    const decoded = decodeURIComponent(hrefCall[1]);
    expect(decoded).toContain("\"'=cmd|' /C calc'!A0\"");
    expect(decoded).toContain('"\' +123"'.replace(/\s+/, ""));
    expect(decoded).toContain('"\'@SUM(A1:A5)"');
    expect(decoded).toContain('"\' -50"'.replace(/\s+/, ""));
  });
});

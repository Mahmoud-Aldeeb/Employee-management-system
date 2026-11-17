import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exportToCSV } from "@/lib/export-csv";

function readBlob(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).replace(/^\uFEFF/, ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

describe("exportToCSV", () => {
  let blobs: Blob[];

  beforeEach(() => {
    blobs = [];
    Object.assign(URL, {
      createObjectURL: vi.fn((blob: Blob) => {
        blobs.push(blob);
        return "blob:test";
      }),
      revokeObjectURL: vi.fn(),
    });
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-16T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("writes a header, rows and nested values to a dated file", async () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    const exported = exportToCSV(
      [{ first: "Ada", team: { name: "Eng" } }],
      "people",
      [
        { label: "First", key: "first" },
        { label: "Team", key: "team.name" },
      ],
    );

    expect(exported).toBe(true);
    expect(await readBlob(blobs[0])).toBe('"First","Team"\n"Ada","Eng"');
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe(
      "people_2026-11-16.csv",
    );
  });

  it("escapes quotes and neutralizes spreadsheet formulas", async () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      () => undefined,
    );

    exportToCSV(
      [
        {
          quote: 'He said "hi"',
          formula: "=SUM(A1)",
          missing: null,
          amount: -5,
        },
      ],
      "unsafe",
      [
        { label: "Quote", key: "quote" },
        { label: "Formula", key: "formula" },
        { label: "Missing", key: "missing" },
        { label: "Amount", key: "amount" },
      ],
    );

    expect(await readBlob(blobs[0])).toBe(
      '"Quote","Formula","Missing","Amount"\n"He said ""hi""","\'=SUM(A1)","","-5"',
    );
  });

  it("does nothing when there are no rows", () => {
    expect(exportToCSV([], "empty", [{ label: "A", key: "a" }])).toBe(false);
    expect(blobs).toHaveLength(0);
  });
});

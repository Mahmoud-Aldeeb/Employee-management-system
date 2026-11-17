export interface CsvColumn {
  label: string;
  key: string;
}

function getValue(row: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (value !== null && typeof value === "object") {
      return (value as Record<string, unknown>)[key];
    }
    return undefined;
  }, row);
}

function toCell(value: unknown) {
  if (value === null || value === undefined) return '""';
  let text = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function exportToCSV<T extends object>(
  rows: T[],
  filename: string,
  columns: CsvColumn[],
) {
  if (rows.length === 0) return false;

  const header = columns.map((column) => toCell(column.label)).join(",");
  const body = rows.map((row) =>
    columns.map((column) => toCell(getValue(row, column.key))).join(","),
  );

  const blob = new Blob([`\uFEFF${[header, ...body].join("\n")}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return true;
}

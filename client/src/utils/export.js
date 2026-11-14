/**
 * Helper utility to export JSON array data to a downloadable CSV file.
 *
 * @param {Array<Object>} data - Array of data objects to export.
 * @param {string} filename - Desired filename without extension.
 * @param {Array<{label: string, key: string}>} [headers] - Optional explicit header mappings.
 */
export const exportToCSV = (data, filename = "export", headers = null) => {
  if (!data || !data.length) {
    console.warn("No data available to export.");
    return;
  }

  // Determine headers
  const columns = headers
    ? headers
    : Object.keys(data[0]).map((key) => ({ label: key, key }));

  const csvRows = [];

  // Header row
  csvRows.push(columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(","));

  // Data rows
  data.forEach((row) => {
    const values = columns.map((col) => {
      const val = col.key.split(".").reduce((obj, k) => obj?.[k], row);
      if (val === null || val === undefined) return '""';
      if (typeof val === "object") return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(","));
  });

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

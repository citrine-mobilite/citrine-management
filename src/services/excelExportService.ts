/**
 * Export structured tabular data to Microsoft Excel (.xls formatted HTML table)
 */
export function exportToExcel(
  fileName: string,
  title: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
) {
  const excelFileName = fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ? fileName : `${fileName}.xls`;

  const tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${title.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 30) || 'Feuille1'}</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: Calibri, Arial, sans-serif; padding: 12px; }
        .company-header { font-size: 20px; font-weight: bold; color: #164e4b; font-style: italic; margin-bottom: 2px; }
        .title { font-size: 14px; font-weight: bold; color: #ffffff; background-color: #2A7B76; padding: 8px 12px; margin-bottom: 12px; }
        table { border-collapse: collapse; width: 100%; margin-top: 8px; }
        th { background-color: #164e4b; color: #ffffff; font-weight: bold; font-family: Calibri, Arial, sans-serif; font-size: 11px; padding: 8px 10px; border: 1px solid #113835; text-align: left; }
        td { font-family: Calibri, Arial, sans-serif; font-size: 11px; padding: 6px 10px; border: 1px solid #cbd5e1; color: #1e293b; background-color: #ffffff; }
        tr:nth-child(even) td { background-color: #f8fafc; }
      </style>
    </head>
    <body>
      <div class="company-header">CITRINE MOBILITÉ</div>
      <div class="title">${title}</div>
      <table border="1" style="border-collapse: collapse;">
        <thead>
          <tr>
            ${headers.map((h) => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr>${row
                  .map(
                    (cell) =>
                      `<td>${cell !== undefined && cell !== null ? String(cell).replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''}</td>`
                  )
                  .join('')}</tr>`
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = excelFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

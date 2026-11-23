function money(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toLocaleString('en-IN') : '0';
}

function pdfEscape(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildPdf(lines: string[]) {
  const commands = ['BT', '/F1 14 Tf', '48 800 Td', `(${pdfEscape(lines[0] || 'Salary slip')}) Tj`];
  for (const line of lines.slice(1)) {
    commands.push('/F1 11 Tf', '0 -18 Td', `(${pdfEscape(line)}) Tj`);
  }
  commands.push('ET');
  const stream = commands.join('\n');
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(body.length);
    body += object;
  }
  const xrefAt = body.length;
  body += `xref\n0 ${objects.length + 1}\n`;
  body += '0000000000 65535 f \n';
  for (let index = 1; index < offsets.length; index += 1) {
    body += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;
  return body;
}

export function downloadPayslipPdf(slip: Record<string, any>) {
  const year = Number(slip.year || 0);
  const month = Number(slip.month || 0);
  const period = slip.payrollMonth || (year && month ? `${year}-${String(month).padStart(2, '0')}` : 'period');
  const name = String(slip.userName || slip.employeeName || 'Employee');
  const lines = [
    'Salary slip',
    `Employee: ${name}`,
    `Period: ${period}`,
    `Status: ${slip.status || 'Generated'}`,
    `Basic: Rs ${money(slip.basicSalary)}`,
    `HRA: Rs ${money(slip.hra)}`,
    `Allowances: Rs ${money(slip.allowances)}`,
    `Bonus: Rs ${money(slip.bonus)}`,
    `Overtime: Rs ${money(slip.overtimePay)}`,
    `Gross: Rs ${money(slip.grossPay ?? slip.grossSalary ?? slip.monthlySalary)}`,
    `Deductions: Rs ${money(slip.deduction ?? slip.totalDeductions ?? slip.deductions)}`,
    `Net pay: Rs ${money(slip.netPay ?? slip.netSalary)}`,
  ];
  const blob = new Blob([buildPdf(lines)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `salary-slip-${name.replace(/\s+/g, '-').toLowerCase()}-${period}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

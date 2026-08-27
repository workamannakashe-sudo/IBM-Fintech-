// FinWise PDF Report Generation Service (pdfGenerator.ts)
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface PDFReportData {
  studentName: string;
  studentMajor: string;
  monthYear: string;
  healthScore: number;
  healthGrade: string;
  monthlyIncome: number;
  totalSpent: number;
  totalBudget: number;
  remainingBudget: number;
  savingsGoalProgress: Array<{ name: string; target: number; current: number }>;
  categoryBreakdown: Record<string, number>;
  transactions: Array<{ date: string; description: string; amount: number; category: string }>;
}

/**
 * Generates and downloads a professional monthly financial statement PDF
 */
export function generateMonthlyPDFReport(data: PDFReportData): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Color Palette Constants (Matches Indigo/Rose/Slate Theme)
  const tealPrimary: [number, number, number] = [79, 70, 229]; // #4F46E5 (Indigo Primary)
  const tealSecondary: [number, number, number] = [99, 102, 241]; // #6366F1 (Indigo Secondary)
  const amberAccent: [number, number, number] = [244, 63, 94]; // #F43F5E (Rose Accent)
  const slateText: [number, number, number] = [30, 41, 59]; // #1E293B

  // --- Document Header ---
  // Background Accent block
  doc.setFillColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.rect(0, 0, 210, 38, "F");

  // Logo & Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("FinWise", 14, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("AI-POWERED STUDENT FINANCIAL STATEMENT", 14, 22);

  // Health Badge (Top Right)
  doc.setFillColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.roundedRect(155, 10, 41, 18, 2, 2, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("FINANCIAL HEALTH", 158, 15);
  doc.setFontSize(11);
  doc.text(`Score: ${data.healthScore} (${data.healthGrade})`, 158, 22);

  // --- Student Metadata Info ---
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Prepared For:", 14, 46);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${data.studentName} (${data.studentMajor})`, 14, 52);
  
  doc.setFont("helvetica", "bold");
  doc.text("Statement Period:", 140, 46);
  doc.setFont("helvetica", "normal");
  doc.text(data.monthYear, 140, 52);

  // Divider Line
  doc.setDrawColor(226, 232, 240); // border-slate-200
  doc.setLineWidth(0.5);
  doc.line(14, 57, 196, 57);

  // --- Summary Metrics Table ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.text("I. Cash Flow & Budget Overview", 14, 65);

  const budgetAdherence = data.totalBudget > 0 
    ? Math.round((data.totalSpent / data.totalBudget) * 100) 
    : 0;

  const summaryHeaders = [["Metric", "Value", "Status / Trajectory"]];
  const summaryBody = [
    ["Monthly Income / Allowance", `$${data.monthlyIncome.toFixed(2)}`, "Primary cash inflow"],
    ["Total Expenses Logged", `$${data.totalSpent.toFixed(2)}`, `${data.totalSpent > data.totalBudget ? "⚠️ Exceeded Budget" : "✅ Under Budget"}`],
    ["Total Allocated Budget", `$${data.totalBudget.toFixed(2)}`, `Adherence: ${budgetAdherence}%`],
    ["Net Cash Flow (Savings)", `$${(data.monthlyIncome - data.totalSpent).toFixed(2)}`, `${data.monthlyIncome >= data.totalSpent ? "Positive Surplus" : "Deficit (Warning)"}`],
  ];

  autoTable(doc, {
    startY: 68,
    head: summaryHeaders,
    body: summaryBody,
    theme: "striped",
    headStyles: { fillColor: tealSecondary },
    styles: { fontSize: 9, textColor: slateText },
  });

  // --- Category Spend Table ---
  let nextY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.text("II. Spending Envelope Breakdown", 14, nextY);

  const categoryHeaders = [["Category", "Total Spent", "Percentage of Spend"]];
  const categoryBody = Object.entries(data.categoryBreakdown).map(([cat, amount]) => {
    const percentage = data.totalSpent > 0 ? Math.round((amount / data.totalSpent) * 100) : 0;
    return [cat, `$${amount.toFixed(2)}`, `${percentage}%`];
  });

  if (categoryBody.length === 0) {
    categoryBody.push(["No expenses logged", "$0.00", "0%"]);
  }

  autoTable(doc, {
    startY: nextY + 3,
    head: categoryHeaders,
    body: categoryBody,
    theme: "grid",
    headStyles: { fillColor: tealSecondary },
    styles: { fontSize: 9, textColor: slateText },
  });

  // --- Savings Goals Progress ---
  nextY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.text("III. Milestone Savings Goals", 14, nextY);

  const goalHeaders = [["Goal Title", "Target Amount", "Current Savings", "Progress (%)"]];
  const goalBody = data.savingsGoalProgress.map((g) => {
    const pct = g.target > 0 ? Math.round((g.current / g.target) * 100) : 0;
    return [g.name, `$${g.target.toFixed(2)}`, `$${g.current.toFixed(2)}`, `${pct}%`];
  });

  if (goalBody.length === 0) {
    goalBody.push(["No goals configured", "$0.00", "$0.00", "0%"]);
  }

  autoTable(doc, {
    startY: nextY + 3,
    head: goalHeaders,
    body: goalBody,
    theme: "striped",
    headStyles: { fillColor: tealSecondary },
    styles: { fontSize: 9, textColor: slateText },
  });

  // --- Transactions Log ---
  nextY = (doc as any).lastAutoTable.finalY + 8;
  // If we're reaching the bottom, add a new page
  if (nextY > 230) {
    doc.addPage();
    nextY = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.text("IV. Recent Transactions", 14, nextY);

  const txHeaders = [["Date", "Description", "Category", "Amount"]];
  const txBody = data.transactions.slice(0, 15).map((t) => [ // Cap at 15 items in PDF for readability
    t.date,
    t.description,
    t.category,
    `$${t.amount.toFixed(2)}`,
  ]);

  if (txBody.length === 0) {
    txBody.push(["-", "No transactions found", "-", "$0.00"]);
  }

  autoTable(doc, {
    startY: nextY + 3,
    head: txHeaders,
    body: txBody,
    theme: "striped",
    headStyles: { fillColor: tealSecondary },
    styles: { fontSize: 8, textColor: slateText },
  });

  // Footer note
  const finalY = (doc as any).lastAutoTable.finalY + 12;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    "Disclaimer: FinWise statements are intended for educational and financial guidance purposes. Validate balances with your banking institution.",
    14,
    finalY > 280 ? 285 : finalY
  );

  // Save report
  doc.save(`FinWise_Statement_${data.monthYear.replace(/\s+/g, "_")}.pdf`);
}

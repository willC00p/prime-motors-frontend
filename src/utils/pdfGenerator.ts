import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import type { DashboardData } from '../types/dashboard';

const formatCurrency = (value: number) => `₱${value.toLocaleString()}`;

export const generateDashboardPDF = async (data: DashboardData, charts: { [key: string]: HTMLElement }) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.width;
  const margin = 10;
  let yOffset = 10;

  // Add header
  pdf.setFontSize(20);
  pdf.setTextColor(33, 33, 33);
  pdf.text('Sales & Inventory Analytics Report', pageWidth / 2, yOffset, { align: 'center' });
  
  // Add date
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, yOffset + 7, { align: 'center' });
  yOffset += 20;

  // Add summary section
  pdf.setFontSize(14);
  pdf.setTextColor(33, 33, 33);
  pdf.text('Executive Summary', margin, yOffset);
  yOffset += 10;

  pdf.setFontSize(10);
  pdf.setTextColor(66, 66, 66);

  const summaryData = [
    ['Total Sales', formatCurrency(data.totalSales)],
    ['Total Inventory Units', data.totalInventoryUnits.toString()],
    ['Available Units', data.inventoryStatus.available.toString()],
    ['Top Performing Branch', `${data.branchData[0]?.branch || 'N/A'} (${formatCurrency(data.branchData[0]?.amount || 0)})`],
    ['Top Performing Agent', `${data.topAgents[0]?.agent || 'N/A'} (${formatCurrency(data.topAgents[0]?.amount || 0)})`],
    ['Best Selling Model', data.topModels[0]?.model || 'N/A']
  ];

  (pdf as any).autoTable({
    startY: yOffset,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [14, 165, 233], textColor: 255 },
    styles: { fontSize: 10 },
    margin: { left: margin }
  });

  yOffset = (pdf as any).lastAutoTable.finalY + 15;

  // Add charts
  async function addChartToPDF(chartElement: HTMLElement, title: string) {
    if (!chartElement) return yOffset;
    
    const canvas = await html2canvas(chartElement, {
      scale: 2,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth - (2 * margin);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add new page if chart won't fit
    if (yOffset + imgHeight + 20 > pdf.internal.pageSize.height) {
      pdf.addPage();
      yOffset = 20;
    }

    pdf.setFontSize(12);
    pdf.setTextColor(33, 33, 33);
    pdf.text(title, margin, yOffset);
    yOffset += 7;

    pdf.addImage(imgData, 'PNG', margin, yOffset, imgWidth, imgHeight);
    yOffset += imgHeight + 15;

    return yOffset;
  }

  // Add key charts from the dashboard
  const chartOrder = [
    { id: 'salesForecast', title: 'Sales Performance & Forecast' },
    { id: 'branchSales', title: 'Sales by Branch' },
    { id: 'topModels', title: 'Top Models Performance' },
    { id: 'ageDistribution', title: 'Sales by Age Group' },
    { id: 'salesOfficers', title: 'Sales Officers Performance' }
  ];

  for (const chart of chartOrder) {
    if (charts[chart.id]) {
      yOffset = await addChartToPDF(charts[chart.id], chart.title);
    }
  }

  // Add KPI details
  if (yOffset + 60 > pdf.internal.pageSize.height) {
    pdf.addPage();
    yOffset = 20;
  }

  pdf.setFontSize(14);
  pdf.text('Key Performance Indicators', margin, yOffset);
  yOffset += 10;

  const kpiData = [
    ['Inventory Status', `${Math.round((data.inventoryStatus.available / data.totalInventoryUnits) * 100)}% Available`],
    ['Sales Target Achievement', `${Math.round((data.forecastData[data.forecastData.length - 2]?.amount || 0) / (data.forecastData[data.forecastData.length - 2]?.target || 1) * 100)}%`],
    ['Monthly Growth', `${(((data.forecastData[data.forecastData.length - 1]?.forecast || 0) / (data.forecastData[data.forecastData.length - 2]?.amount || 1) - 1) * 100).toFixed(1)}%`]
  ];

  (pdf as any).autoTable({
    startY: yOffset,
    head: [['Metric', 'Performance']],
    body: kpiData,
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94], textColor: 255 },
    styles: { fontSize: 10 },
    margin: { left: margin }
  });

  // Save the PDF
  pdf.save('Prime-Motors-Analytics-Report.pdf');
};

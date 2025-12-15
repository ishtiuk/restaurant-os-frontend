// Print utility functions for receipts, bills, and KOT slips

interface PrintOptions {
  title?: string;
  paperSize?: 'thermal' | 'a4';
}

export const printContent = (elementId: string, options: PrintOptions = {}) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  const { title = 'Print', paperSize = 'thermal' } = options;
  
  // Create print window
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    console.error('Could not open print window');
    return;
  }

  const thermalStyles = `
    @page {
      size: 80mm auto;
      margin: 2mm;
    }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      line-height: 1.4;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 8px;
      width: 76mm;
    }
  `;

  const a4Styles = `
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 20px;
      max-width: 210mm;
    }
  `;

  const commonStyles = `
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-header {
      text-align: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px dashed #333;
    }
    .print-header h1 {
      font-size: 18px;
      font-weight: bold;
      margin: 0 0 4px 0;
    }
    .print-header h2 {
      font-size: 14px;
      font-weight: bold;
      margin: 0 0 4px 0;
    }
    .print-header p {
      font-size: 11px;
      margin: 2px 0;
      color: #555;
    }
    .print-info {
      margin-bottom: 10px;
    }
    .print-info-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
    }
    .print-info-row.highlight {
      font-weight: bold;
      font-size: 14px;
    }
    .print-divider {
      border-top: 1px dashed #333;
      margin: 8px 0;
    }
    .print-divider-double {
      border-top: 2px dashed #333;
      margin: 10px 0;
    }
    .print-items {
      margin: 10px 0;
    }
    .print-item {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      border-bottom: 1px dotted #ccc;
    }
    .print-item:last-child {
      border-bottom: none;
    }
    .print-item-name {
      flex: 1;
      margin-right: 8px;
    }
    .print-item-qty {
      font-weight: bold;
      margin-right: 8px;
      min-width: 30px;
    }
    .print-item-price {
      text-align: right;
      min-width: 60px;
    }
    .print-totals {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 2px dashed #333;
    }
    .print-total-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
    }
    .print-total-row.grand {
      font-size: 16px;
      font-weight: bold;
      padding-top: 6px;
      margin-top: 6px;
      border-top: 2px solid #000;
    }
    .print-total-row.discount {
      color: #228B22;
    }
    .print-footer {
      text-align: center;
      margin-top: 12px;
      padding-top: 8px;
      border-top: 2px dashed #333;
      font-size: 11px;
    }
    .print-footer p {
      margin: 4px 0;
    }
    /* KOT Specific Styles */
    .kot-header {
      text-align: center;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 3px double #000;
    }
    .kot-header h1 {
      font-size: 22px;
      font-weight: bold;
      margin: 0;
      letter-spacing: 2px;
    }
    .kot-header h2 {
      font-size: 16px;
      font-weight: bold;
      margin: 6px 0 0 0;
    }
    .kot-table-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      margin-bottom: 8px;
      border-bottom: 1px dashed #333;
    }
    .kot-table-no {
      font-size: 24px;
      font-weight: bold;
    }
    .kot-time {
      font-size: 11px;
      text-align: right;
    }
    .kot-items {
      margin: 10px 0;
    }
    .kot-item {
      display: flex;
      align-items: flex-start;
      padding: 6px 0;
      border-bottom: 1px dotted #999;
      font-size: 14px;
    }
    .kot-item:last-child {
      border-bottom: none;
    }
    .kot-item-qty {
      font-size: 18px;
      font-weight: bold;
      min-width: 40px;
      margin-right: 8px;
    }
    .kot-item-name {
      flex: 1;
      font-size: 14px;
    }
    .kot-footer {
      text-align: center;
      margin-top: 12px;
      padding-top: 8px;
      border-top: 2px dashed #333;
      font-size: 11px;
    }
    /* Delivery specific */
    .delivery-info {
      background: #f5f5f5;
      padding: 8px;
      margin: 8px 0;
      border: 1px solid #ddd;
    }
    .delivery-info h3 {
      font-size: 12px;
      font-weight: bold;
      margin: 0 0 4px 0;
      text-transform: uppercase;
    }
    .delivery-info p {
      margin: 2px 0;
      font-size: 12px;
    }
    .order-type-badge {
      display: inline-block;
      background: #000;
      color: #fff;
      padding: 2px 8px;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  `;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <meta charset="UTF-8">
      <style>
        ${paperSize === 'thermal' ? thermalStyles : a4Styles}
        ${commonStyles}
      </style>
    </head>
    <body>
      ${element.innerHTML}
    </body>
    </html>
  `);

  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
};

export const formatCurrencyForPrint = (amount: number): string => {
  return `৳${amount.toLocaleString('bn-BD')}`;
};

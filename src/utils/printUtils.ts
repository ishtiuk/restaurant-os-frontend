// Unified Thermal-First Printing System
// Supports 58mm and 80mm thermal paper sizes only

export type ThermalPaperSize = '58mm' | '80mm';

export interface PrintSettings {
  paperSize: ThermalPaperSize;
  invoicePrefix: string;
  footerText: string;
  restaurantName: string;
  restaurantNameBn: string;
  address: string;
  phone: string;
}

// Default settings - can be overridden from Settings page
export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  paperSize: '80mm',
  invoicePrefix: 'INV-',
  footerText: 'ধন্যবাদ, আবার আসবেন',
  restaurantName: 'RestaurantOS',
  restaurantNameBn: 'রেস্টুরেন্ট ওএস',
  address: '123 Restaurant Street, Dhaka',
  phone: '01700-000000',
};

// Paper size configurations
const PAPER_CONFIG: Record<ThermalPaperSize, {
  widthMm: number;
  contentWidthMm: number;
  fontSize: {
    title: number;
    subtitle: number;
    body: number;
    small: number;
    qty: number;
  };
  padding: number;
}> = {
  '58mm': {
    widthMm: 58,
    contentWidthMm: 54,
    fontSize: {
      title: 14,
      subtitle: 11,
      body: 10,
      small: 8,
      qty: 14,
    },
    padding: 2,
  },
  '80mm': {
    widthMm: 80,
    contentWidthMm: 76,
    fontSize: {
      title: 18,
      subtitle: 14,
      body: 12,
      small: 10,
      qty: 18,
    },
    padding: 2,
  },
};

// Get current print settings (from localStorage or defaults)
// Settings are synced to localStorage by Settings page when loaded/saved
export const getPrintSettings = (): PrintSettings => {
  try {
    const stored = localStorage.getItem('restaurant-os.print-settings');
    if (stored) {
      return { ...DEFAULT_PRINT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_PRINT_SETTINGS;
};

// Alias for consistency (same as getPrintSettings)
export const getPrintSettingsSync = getPrintSettings;

// Save print settings
export const savePrintSettings = (settings: Partial<PrintSettings>) => {
  const current = getPrintSettingsSync();
  const updated = { ...current, ...settings };
  localStorage.setItem('restaurant-os.print-settings', JSON.stringify(updated));
  return updated;
};

// Generate thermal print styles based on paper size
const generateThermalStyles = (paperSize: ThermalPaperSize): string => {
  const config = PAPER_CONFIG[paperSize];
  
  return `
    @page {
      size: ${config.widthMm}mm auto;
      margin: ${config.padding}mm;
    }
    
    @media print {
      html, body {
        width: ${config.contentWidthMm}mm !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    }
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    body {
      font-family: 'Courier New', 'Consolas', monospace;
      font-size: ${config.fontSize.body}px;
      line-height: 1.3;
      color: #000;
      background: #fff;
      margin: 0;
      padding: ${config.padding}mm;
      width: ${config.contentWidthMm}mm;
      max-width: ${config.contentWidthMm}mm;
      overflow-wrap: break-word;
      word-wrap: break-word;
    }
    
    /* Header Styles */
    .slip-header {
      text-align: center;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 2px dashed #000;
    }
    
    .slip-header .restaurant-name {
      font-size: ${config.fontSize.title}px;
      font-weight: bold;
      margin: 0;
      letter-spacing: 1px;
    }
    
    .slip-header .restaurant-name-bn {
      font-size: ${config.fontSize.subtitle}px;
      margin: 2px 0;
    }
    
    .slip-header .address,
    .slip-header .phone {
      font-size: ${config.fontSize.small}px;
      margin: 2px 0;
      color: #333;
    }
    
    /* Order Info Section */
    .slip-info {
      margin-bottom: 6px;
      padding-bottom: 6px;
      border-bottom: 1px dashed #000;
    }
    
    .slip-info-row {
      display: flex;
      justify-content: space-between;
      padding: 1px 0;
      font-size: ${config.fontSize.body}px;
    }
    
    .slip-info-row.highlight {
      font-weight: bold;
      font-size: ${config.fontSize.subtitle}px;
    }
    
    .slip-info-row .label {
      flex-shrink: 0;
    }
    
    .slip-info-row .value {
      text-align: right;
      word-break: break-all;
    }
    
    /* Items Section */
    .slip-items {
      margin: 6px 0;
    }
    
    .slip-items-header {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      font-size: ${config.fontSize.small}px;
      padding-bottom: 3px;
      border-bottom: 1px solid #000;
      margin-bottom: 4px;
    }
    
    .slip-item {
      display: flex;
      padding: 2px 0;
      border-bottom: 1px dotted #999;
      font-size: ${config.fontSize.body}px;
    }
    
    .slip-item:last-child {
      border-bottom: none;
    }
    
    .slip-item-qty {
      flex-shrink: 0;
      font-weight: bold;
      width: ${paperSize === '58mm' ? '25px' : '35px'};
      font-size: ${config.fontSize.body}px;
    }
    
    .slip-item-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-right: 4px;
    }
    
    .slip-item-price {
      flex-shrink: 0;
      text-align: right;
      min-width: ${paperSize === '58mm' ? '45px' : '55px'};
    }
    
    /* Totals Section */
    .slip-totals {
      margin-top: 6px;
      padding-top: 6px;
      border-top: 2px dashed #000;
    }
    
    .slip-total-row {
      display: flex;
      justify-content: space-between;
      padding: 1px 0;
      font-size: ${config.fontSize.body}px;
    }
    
    .slip-total-row.discount {
      color: #006400;
    }
    
    .slip-total-row.grand {
      font-size: ${config.fontSize.subtitle}px;
      font-weight: bold;
      padding-top: 4px;
      margin-top: 4px;
      border-top: 2px solid #000;
    }
    
    /* Footer Section */
    .slip-footer {
      text-align: center;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 2px dashed #000;
      font-size: ${config.fontSize.small}px;
    }
    
    .slip-footer p {
      margin: 3px 0;
    }
    
    /* KOT Specific Styles */
    .kot-header {
      text-align: center;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 3px double #000;
    }
    
    .kot-header .kot-title {
      font-size: ${config.fontSize.title}px;
      font-weight: bold;
      margin: 0;
      letter-spacing: 2px;
    }
    
    .kot-header .kot-number {
      font-size: ${config.fontSize.subtitle}px;
      font-weight: bold;
      margin: 4px 0 0 0;
    }
    
    .kot-table-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      margin-bottom: 6px;
      border-bottom: 1px dashed #000;
    }
    
    .kot-table-label {
      font-size: ${config.fontSize.small}px;
    }
    
    .kot-table-number {
      font-size: ${config.fontSize.title + 4}px;
      font-weight: bold;
    }
    
    .kot-time {
      font-size: ${config.fontSize.small}px;
      text-align: right;
    }
    
    .kot-items-label {
      font-weight: bold;
      font-size: ${config.fontSize.small}px;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding-bottom: 4px;
      border-bottom: 1px solid #000;
      margin-bottom: 4px;
    }
    
    .kot-item {
      display: flex;
      align-items: flex-start;
      padding: 4px 0;
      border-bottom: 1px dotted #999;
      font-size: ${config.fontSize.body}px;
    }
    
    .kot-item:last-child {
      border-bottom: none;
    }
    
    .kot-item-qty {
      font-size: ${config.fontSize.qty}px;
      font-weight: bold;
      min-width: ${paperSize === '58mm' ? '30px' : '40px'};
      margin-right: 6px;
    }
    
    .kot-item-name {
      flex: 1;
      font-size: ${config.fontSize.body + 1}px;
    }
    
    .kot-footer {
      text-align: center;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 2px dashed #000;
      font-size: ${config.fontSize.small}px;
    }
    
    .kot-summary {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      font-size: ${config.fontSize.body}px;
      margin-bottom: 6px;
    }
    
    /* Delivery Info */
    .delivery-info {
      background: #f0f0f0;
      padding: 4px 6px;
      margin: 6px 0;
      border: 1px solid #999;
    }
    
    .delivery-info-title {
      font-size: ${config.fontSize.small}px;
      font-weight: bold;
      text-transform: uppercase;
      margin: 0 0 2px 0;
    }
    
    .delivery-info p {
      margin: 1px 0;
      font-size: ${config.fontSize.body}px;
    }
    
    /* Order Type Badge */
    .order-type-badge {
      display: inline-block;
      background: #000;
      color: #fff;
      padding: 1px 6px;
      font-size: ${config.fontSize.small}px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  `;
};

interface PrintOptions {
  title?: string;
  paperSize?: ThermalPaperSize;
}

export const printContent = (elementId: string, options: PrintOptions = {}) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  // Use sync version for immediate access (reads from localStorage cache)
  // Settings are synced to localStorage when saved in Settings page
  const settings = getPrintSettingsSync();
  const { title = 'Print', paperSize = settings.paperSize } = options;
  
  const styles = generateThermalStyles(paperSize);
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <meta charset="UTF-8">
      <style>${styles}</style>
    </head>
    <body>
      ${element.innerHTML}
    </body>
    </html>
  `;

  // Use iframe approach for more reliable printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.visibility = 'hidden';
  
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    console.error('Could not access iframe document');
    document.body.removeChild(iframe);
    return;
  }
  
  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();
  
  // Wait for content to render then print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Print error:', e);
    }
    // Remove iframe after printing
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 250);
};

export const formatCurrencyForPrint = (amount: number): string => {
  return `৳${amount.toLocaleString('bn-BD')}`;
};

// Get paper config for UI display
export const getPaperConfig = (paperSize: ThermalPaperSize) => PAPER_CONFIG[paperSize];

// Available paper sizes for settings
export const AVAILABLE_PAPER_SIZES: { value: ThermalPaperSize; label: string; description: string }[] = [
  { value: '80mm', label: 'Thermal 80mm', description: 'Standard thermal receipt (80mm width)' },
  { value: '58mm', label: 'Thermal 58mm', description: 'Compact thermal receipt (58mm width)' },
];
import React from "react";
import { Sale } from "@/types";
import { getPrintSettingsSync } from "@/utils/printUtils";
import { formatDate, formatTime } from "@/utils/date";

interface DailySalesReportProps {
  sales: Sale[];
  date: string; // Date string in format "YYYY-MM-DD"
  timezone: string;
}

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

export const DailySalesReport: React.FC<DailySalesReportProps> = ({
  sales,
  date,
  timezone,
}) => {
  const settings = getPrintSettingsSync();
  
  // Calculate totals
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalSubtotal = sales.reduce((sum, sale) => sum + sale.subtotal, 0);
  const totalVat = sales.reduce((sum, sale) => sum + sale.vatAmount, 0);
  const totalServiceCharge = sales.reduce((sum, sale) => sum + (sale.serviceCharge || 0), 0);
  const totalDiscount = sales.reduce((sum, sale) => sum + sale.discount, 0);
  
  // Payment method breakdown
  const paymentBreakdown = sales.reduce((acc, sale) => {
    const method = sale.paymentMethod || "cash";
    acc[method] = (acc[method] || 0) + sale.total;
    return acc;
  }, {} as Record<string, number>);
  
  // Order type breakdown
  const orderTypeBreakdown = sales.reduce((acc, sale) => {
    const type = sale.orderType || "takeaway";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Format date
  const formattedDate = formatDate(date, timezone);
  
  return (
    <div id="daily-sales-report-print">
      {/* Header */}
      <div className="slip-header">
        <p className="restaurant-name">{settings.restaurantName}</p>
        <p className="restaurant-name-bn">{settings.restaurantNameBn}</p>
        <p className="address">Address: {settings.address}</p>
        <p className="phone">Phone: {settings.phone}</p>
      </div>

      {/* Report Title */}
      <div className="slip-info">
        <div className="slip-info-row highlight" style={{ justifyContent: 'center', fontSize: '16px', padding: '8px 0' }}>
          <span>DAILY SALES REPORT</span>
        </div>
        <div className="slip-info-row">
          <span className="label">Date:</span>
          <span className="value">{formattedDate}</span>
        </div>
        <div className="slip-info-row">
          <span className="label">Total Sales:</span>
          <span className="value">{totalSales}</span>
        </div>
      </div>

      {/* Summary Totals */}
      <div className="slip-totals" style={{ marginTop: '8px', marginBottom: '8px' }}>
        <div className="slip-total-row">
          <span>Subtotal:</span>
          <span>{formatCurrency(totalSubtotal)}</span>
        </div>
        {totalVat > 0 && (
          <div className="slip-total-row">
            <span>VAT:</span>
            <span>{formatCurrency(totalVat)}</span>
          </div>
        )}
        {totalServiceCharge > 0 && (
          <div className="slip-total-row">
            <span>Service Charge:</span>
            <span>{formatCurrency(totalServiceCharge)}</span>
          </div>
        )}
        {totalDiscount > 0 && (
          <div className="slip-total-row discount">
            <span>Total Discount:</span>
            <span>-{formatCurrency(totalDiscount)}</span>
          </div>
        )}
        <div className="slip-total-row grand">
          <span>TOTAL REVENUE:</span>
          <span>{formatCurrency(totalRevenue)}</span>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      {Object.keys(paymentBreakdown).length > 0 && (
        <div className="slip-items" style={{ marginTop: '8px', marginBottom: '8px' }}>
          <div className="slip-items-header">
            <span>Payment Method</span>
            <span>Amount</span>
          </div>
          {Object.entries(paymentBreakdown).map(([method, amount]) => (
            <div key={method} className="slip-item">
              <span className="slip-item-name" style={{ textTransform: 'capitalize' }}>{method}</span>
              <span className="slip-item-price">{formatCurrency(amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Order Type Breakdown */}
      {Object.keys(orderTypeBreakdown).length > 0 && (
        <div className="slip-items" style={{ marginTop: '8px', marginBottom: '8px' }}>
          <div className="slip-items-header">
            <span>Order Type</span>
            <span>Count</span>
          </div>
          {Object.entries(orderTypeBreakdown).map(([type, count]) => (
            <div key={type} className="slip-item">
              <span className="slip-item-name" style={{ textTransform: 'uppercase' }}>{type}</span>
              <span className="slip-item-price">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Sales List */}
      <div className="slip-items" style={{ marginTop: '12px' }}>
        <div className="slip-items-header">
          <span>Sale Details</span>
          <span>Amount</span>
        </div>
        {sales.map((sale, idx) => {
          const saleDate = formatDate(sale.createdAt, timezone);
          const saleTime = formatTime(sale.createdAt, timezone);
          const saleId = sale.id.slice(-8).toUpperCase();
          const customerName = sale.customerName || sale.tableNo || "Walk-in";
          
          return (
            <div key={sale.id} className="slip-item" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '4px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '2px' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold' }}>
                  #{saleId} • {saleTime}
                </span>
                <span className="slip-item-price" style={{ fontSize: '11px' }}>{formatCurrency(sale.total)}</span>
              </div>
              <div style={{ fontSize: '9px', color: '#666', marginTop: '1px' }}>
                {customerName} • {sale.paymentMethod?.toUpperCase() || 'CASH'} • {sale.orderType?.toUpperCase() || 'TAKEAWAY'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="slip-footer">
        <p><strong>{settings.footerText || 'ধন্যবাদ, আবার আসবেন'}</strong></p>
        <p style={{ marginTop: '6px' }}>--- Powered by RysTRO | Archex Tech ---</p>
      </div>
    </div>
  );
};

export default DailySalesReport;


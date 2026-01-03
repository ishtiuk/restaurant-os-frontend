import React from "react";
import { TableOrder } from "@/types";
import { getPrintSettingsSync } from "@/utils/printUtils";
import { formatDate, formatTime } from "@/utils/date";

interface TableBillReceiptProps {
  order: TableOrder;
  tableNo: string;
  serviceCharge?: number;
  extraDiscount?: number;
}

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

export const TableBillReceipt: React.FC<TableBillReceiptProps> = ({
  order,
  tableNo,
  serviceCharge = 0,
  extraDiscount = 0,
}) => {
  const settings = getPrintSettingsSync();
  // Get timezone from localStorage (required for print iframe where context is not available)
  // Ensure timezone is always available - if not in localStorage, use default and save it
  let timezone = localStorage.getItem("restaurant-os-timezone");
  if (!timezone) {
    timezone = "Asia/Dhaka";
    try {
      localStorage.setItem("restaurant-os-timezone", timezone);
    } catch {
      // localStorage may not be available in some contexts
    }
  }
  
  // Use centralized utilities for consistent date formatting
  // Backend now returns timestamps with 'Z' suffix, but append 'Z' if missing for safety
  // (formatDate/formatTime need explicit UTC parsing - 'Z' ensures new Date() treats it as UTC)
  const utcDateStr = typeof order.createdAt === "string" && !order.createdAt.endsWith('Z') 
    ? order.createdAt + 'Z' 
    : order.createdAt;
  const formattedDate = formatDate(utcDateStr, timezone);
  const formattedTime = formatTime(utcDateStr, timezone);

  // Calculate correct total: Subtotal (VAT-exclusive) + VAT (rounded) + Service Charge - Discount
  const calculatedVat = order.vatAmount > 0 
    ? order.vatAmount 
    : order.items.reduce((sum, item) => {
        const vatRate = (item as any).vatRate;
        if (!vatRate || vatRate === 0) return sum;
        const itemVat = (item.total * vatRate) / (100 + vatRate);
        return sum + itemVat;
      }, 0);
  const displayVat = Math.round(calculatedVat);
  const itemsTotal = order.items.reduce((sum, item) => sum + item.total, 0);
  const displaySubtotal = Math.round(itemsTotal - calculatedVat);
  const finalTotal = displaySubtotal + displayVat + serviceCharge - extraDiscount;

  return (
    <div id="table-bill-print">
      {/* Header */}
      <div className="slip-header">
        <p className="restaurant-name">{settings.restaurantName}</p>
        <p className="restaurant-name-bn">{settings.restaurantNameBn}</p>
        <p className="address">Address: {settings.address}</p>
        <p className="phone">Phone: {settings.phone}</p>
      </div>

      {/* Bill Info */}
      <div className="slip-info">
        <div className="slip-info-row highlight">
          <span className="label">Table:</span>
          <span className="value">{tableNo}</span>
        </div>
        <div className="slip-info-row">
          <span className="label">Bill #:</span>
          <span className="value" style={{ fontWeight: 'bold' }}>{order.id.slice(-8).toUpperCase()}</span>
        </div>
        <div className="slip-info-row">
          <span className="label">Date:</span>
          <span className="value">{formattedDate}</span>
        </div>
        <div className="slip-info-row">
          <span className="label">Time:</span>
          <span className="value">{formattedTime}</span>
        </div>
        <div className="slip-info-row">
          <span className="label">Type:</span>
          <span className="value order-type-badge">DINE-IN</span>
        </div>
      </div>

      {/* Items */}
      <div className="slip-items">
        <div className="slip-items-header">
          <span>Item</span>
          <span>Amount</span>
        </div>
        {order.items.map((item, idx) => (
          <div key={idx} className="slip-item">
            <span className="slip-item-qty">{item.quantity}x</span>
            <span className="slip-item-name">{item.itemName}</span>
            <span className="slip-item-price">{formatCurrency(item.total)}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="slip-totals">
        {(() => {
          // Calculate VAT from order items if vatAmount is 0 or missing
          const calculatedVat = order.vatAmount > 0 
            ? order.vatAmount 
            : order.items.reduce((sum, item) => {
                const vatRate = (item as any).vatRate;
                if (!vatRate || vatRate === 0) return sum;
                const itemVat = (item.total * vatRate) / (100 + vatRate);
                return sum + itemVat;
              }, 0);
          
          // Round VAT to integer (real-world requirement in Bangladesh)
          const displayVat = Math.round(calculatedVat);
          
          // Calculate VAT-exclusive subtotal from items (sum of item totals - VAT)
          const itemsTotal = order.items.reduce((sum, item) => sum + item.total, 0);
          const displaySubtotal = Math.round(itemsTotal - calculatedVat);
          
          return (
            <>
              <div className="slip-total-row">
                <span>Subtotal:</span>
                <span>{formatCurrency(displaySubtotal)}</span>
              </div>
              {displayVat > 0 && (
                <div className="slip-total-row">
                  <span>VAT:</span>
                  <span>{formatCurrency(displayVat)}</span>
                </div>
              )}
            </>
          );
        })()}
        {serviceCharge > 0 && (
          <div className="slip-total-row">
            <span>Service (5%):</span>
            <span>{formatCurrency(serviceCharge)}</span>
          </div>
        )}
        {order.discount > 0 && (
          <div className="slip-total-row discount">
            <span>Discount:</span>
            <span>-{formatCurrency(order.discount)}</span>
          </div>
        )}
        {extraDiscount > 0 && (
          <div className="slip-total-row discount">
            <span>Extra Discount:</span>
            <span>-{formatCurrency(extraDiscount)}</span>
          </div>
        )}
        <div className="slip-total-row grand">
          <span>TOTAL:</span>
          <span>{formatCurrency(finalTotal)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="slip-footer">
        <p><strong>{settings.footerText || 'ধন্যবাদ, আবার আসবেন'}</strong></p>
        <p style={{ marginTop: '6px' }}>--- Powered by Restauranflow | Archex Tech ---</p>
      </div>
    </div>
  );
};

export default TableBillReceipt;
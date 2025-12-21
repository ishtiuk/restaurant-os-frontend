import React from "react";
import { Sale } from "@/types";
import { getPrintSettingsSync } from "@/utils/printUtils";
import { formatDate, formatTime } from "@/utils/date";

interface SalesReceiptProps {
  sale: Sale;
  orderType: "takeaway" | "delivery";
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
}

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

export const SalesReceipt: React.FC<SalesReceiptProps> = ({
  sale,
  orderType,
  customerName,
  customerPhone,
  deliveryAddress,
  deliveryNotes,
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
  const utcDateStr = typeof sale.createdAt === "string" && !sale.createdAt.endsWith('Z') 
    ? sale.createdAt + 'Z' 
    : sale.createdAt;
  const formattedDate = formatDate(utcDateStr, timezone);
  const formattedTime = formatTime(utcDateStr, timezone);

  const orderTypeLabel = orderType === "delivery" ? "DELIVERY" : "TAKEAWAY";

  return (
    <div id="sales-receipt-print">
      {/* Header */}
      <div className="slip-header">
        <p className="restaurant-name">{settings.restaurantName}</p>
        <p className="restaurant-name-bn">{settings.restaurantNameBn}</p>
        <p className="address">Address: {settings.address}</p>
        <p className="phone">Phone: {settings.phone}</p>
      </div>

      {/* Order Info */}
      <div className="slip-info">
        <div className="slip-info-row highlight">
          <span className="label">Invoice:</span>
          <span className="value">{settings.invoicePrefix}{sale.id.slice(-8).toUpperCase()}</span>
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
          <span className="value order-type-badge">{orderTypeLabel}</span>
        </div>
        <div className="slip-info-row">
          <span className="label">Payment:</span>
          <span className="value" style={{ textTransform: 'uppercase' }}>{sale.paymentMethod}</span>
        </div>
      </div>

      {/* Delivery Info */}
      {orderType === "delivery" && (customerName || customerPhone || deliveryAddress) && (
        <div className="delivery-info">
          <p className="delivery-info-title">Delivery Details</p>
          {customerName && <p><strong>Name:</strong> {customerName}</p>}
          {customerPhone && <p><strong>Phone:</strong> {customerPhone}</p>}
          {deliveryAddress && <p><strong>Address:</strong> {deliveryAddress}</p>}
          {deliveryNotes && <p><strong>Notes:</strong> {deliveryNotes}</p>}
        </div>
      )}

      {/* Items */}
      <div className="slip-items">
        <div className="slip-items-header">
          <span>Item</span>
          <span>Amount</span>
        </div>
        {sale.items.map((item, idx) => (
          <div key={idx} className="slip-item">
            <span className="slip-item-qty">{item.quantity}x</span>
            <span className="slip-item-name">{item.itemName}</span>
            <span className="slip-item-price">{formatCurrency(item.total)}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="slip-totals">
        <div className="slip-total-row">
          <span>Subtotal:</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        {sale.vatAmount > 0 && (
          <div className="slip-total-row">
            <span>VAT:</span>
            <span>{formatCurrency(sale.vatAmount)}</span>
          </div>
        )}
        {sale.serviceCharge && sale.serviceCharge > 0 && (
          <div className="slip-total-row">
            <span>Service (5%):</span>
            <span>{formatCurrency(sale.serviceCharge)}</span>
          </div>
        )}
        {sale.discount > 0 && (
          <div className="slip-total-row discount">
            <span>Discount:</span>
            <span>-{formatCurrency(sale.discount)}</span>
          </div>
        )}
        <div className="slip-total-row grand">
          <span>TOTAL:</span>
          <span>{formatCurrency(sale.total)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="slip-footer">
        <p><strong>{settings.footerText || 'ধন্যবাদ, আবার আসবেন'}</strong></p>
        <p style={{ marginTop: '6px' }}>--- Powered by RestaurantOS | Archex Tech ---</p>
      </div>
    </div>
  );
};

export default SalesReceipt;

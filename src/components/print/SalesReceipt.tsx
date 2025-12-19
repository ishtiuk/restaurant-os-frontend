import React from "react";
import { Sale } from "@/types";
import { getPrintSettingsSync } from "@/utils/printUtils";
import { useTimezone } from "@/contexts/TimezoneContext";
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
  // Get timezone with fallback (critical for print iframe)
  // MUST read from localStorage directly to ensure we get the actual user setting
  let timezone = localStorage.getItem("restaurant-os-timezone") || "Asia/Dhaka";
  try {
    const ctx = useTimezone();
    timezone = ctx.timezone || timezone; // Use context if available, otherwise use localStorage value
  } catch {
    // Context not available (e.g., in print iframe), use localStorage
    timezone = localStorage.getItem("restaurant-os-timezone") || "Asia/Dhaka";
  }
  
  // Parse UTC ISO string from backend (e.g., "2025-12-19T06:23:00.000Z")
  // CRITICAL: Ensure the string is treated as UTC by checking for 'Z' suffix
  let saleDate: Date;
  if (typeof sale.createdAt === 'string') {
    // If string doesn't end with 'Z', it might be interpreted as local time
    // Force UTC interpretation by ensuring 'Z' suffix
    const dateStr = sale.createdAt.endsWith('Z') ? sale.createdAt : sale.createdAt + 'Z';
    saleDate = new Date(dateStr);
  } else if ((sale.createdAt as any) instanceof Date) {
    saleDate = sale.createdAt as Date;
  } else {
    saleDate = new Date(sale.createdAt as any);
  }
  
  // Use Intl.DateTimeFormat directly for EXPLICIT timezone conversion
  // This MUST use the same timezone as the modal to ensure consistency
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  
  // Format with explicit timezone conversion (UTC → user's timezone)
  const formattedDate = dateFormatter.format(saleDate);
  const formattedTime = timeFormatter.format(saleDate);

  const orderTypeLabel = orderType === "delivery" ? "🚚 DELIVERY" : "🛍️ TAKEAWAY";

  return (
    <div id="sales-receipt-print">
      {/* Header */}
      <div className="slip-header">
        <p className="restaurant-name">{settings.restaurantName}</p>
        <p className="restaurant-name-bn">{settings.restaurantNameBn}</p>
        <p className="address">📍 {settings.address}</p>
        <p className="phone">📞 {settings.phone}</p>
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
          <p className="delivery-info-title">📦 Delivery Details</p>
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
        <p style={{ marginTop: '6px' }}>--- Powered by RestaurantOS ---</p>
      </div>
    </div>
  );
};

export default SalesReceipt;

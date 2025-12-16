import React from "react";
import { Sale } from "@/types";
import { getPrintSettingsSync } from "@/utils/printUtils";

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
  const saleDate = new Date(sale.createdAt);
  const formattedDate = saleDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = saleDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

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
            <span>VAT (5%):</span>
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

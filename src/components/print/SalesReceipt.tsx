import React from "react";
import { Sale } from "@/types";

interface SalesReceiptProps {
  sale: Sale;
  orderType: 'takeaway' | 'delivery';
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
  const orderDate = new Date(sale.createdAt);
  const formattedDate = orderDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = orderDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div id="sales-receipt-print">
      {/* Header */}
      <div className="print-header">
        <h1>RestaurantOS</h1>
        <p>রেস্টুরেন্ট ওএস</p>
        <p style={{ marginTop: '6px' }}>📍 123 Restaurant Street, Dhaka</p>
        <p>📞 01700-000000</p>
      </div>

      {/* Order Info */}
      <div className="print-info">
        <div className="print-info-row">
          <span>Invoice #:</span>
          <span style={{ fontWeight: 'bold' }}>{sale.id.slice(-8).toUpperCase()}</span>
        </div>
        <div className="print-info-row">
          <span>Date:</span>
          <span>{formattedDate}</span>
        </div>
        <div className="print-info-row">
          <span>Time:</span>
          <span>{formattedTime}</span>
        </div>
        <div className="print-info-row">
          <span>Type:</span>
          <span className="order-type-badge">
            {orderType === 'takeaway' ? '🛍️ TAKEAWAY' : '🚚 DELIVERY'}
          </span>
        </div>
      </div>

      {/* Delivery Info */}
      {orderType === 'delivery' && customerName && (
        <div className="delivery-info">
          <h3>🚚 Delivery Details</h3>
          <p><strong>Name:</strong> {customerName}</p>
          <p><strong>Phone:</strong> {customerPhone}</p>
          <p><strong>Address:</strong> {deliveryAddress}</p>
          {deliveryNotes && <p><strong>Notes:</strong> {deliveryNotes}</p>}
        </div>
      )}

      <div className="print-divider-double"></div>

      {/* Items */}
      <div className="print-items">
        <div className="print-info-row" style={{ fontWeight: 'bold', marginBottom: '6px' }}>
          <span>Item</span>
          <span>Amount</span>
        </div>
        {sale.items.map((item, idx) => (
          <div key={idx} className="print-item">
            <span className="print-item-qty">{item.quantity}x</span>
            <span className="print-item-name">{item.itemName}</span>
            <span className="print-item-price">{formatCurrency(item.total)}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="print-totals">
        <div className="print-total-row">
          <span>Subtotal:</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        {sale.vatAmount > 0 && (
          <div className="print-total-row">
            <span>VAT (5%):</span>
            <span>{formatCurrency(sale.vatAmount)}</span>
          </div>
        )}
        {sale.serviceCharge > 0 && (
          <div className="print-total-row">
            <span>Service Charge:</span>
            <span>{formatCurrency(sale.serviceCharge)}</span>
          </div>
        )}
        {sale.discount > 0 && (
          <div className="print-total-row discount">
            <span>Discount:</span>
            <span>-{formatCurrency(sale.discount)}</span>
          </div>
        )}
        <div className="print-total-row grand">
          <span>TOTAL:</span>
          <span>{formatCurrency(sale.total)}</span>
        </div>
        <div className="print-total-row" style={{ marginTop: '6px' }}>
          <span>Payment:</span>
          <span style={{ textTransform: 'uppercase' }}>{sale.paymentMethod}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="print-footer">
        <p><strong>Thank you for your order!</strong></p>
        <p>আপনার অর্ডারের জন্য ধন্যবাদ!</p>
        <p style={{ marginTop: '8px', fontSize: '10px' }}>
          --- Powered by RestaurantOS ---
        </p>
      </div>
    </div>
  );
};

export default SalesReceipt;

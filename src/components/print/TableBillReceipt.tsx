import React from "react";
import { TableOrder } from "@/types";

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
  const orderDate = new Date(order.createdAt);
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

  const finalTotal = order.total + serviceCharge - extraDiscount;

  return (
    <div id="table-bill-print">
      {/* Header */}
      <div className="print-header">
        <h1>RestaurantOS</h1>
        <p>রেস্টুরেন্ট ওএস</p>
        <p style={{ marginTop: '6px' }}>📍 123 Restaurant Street, Dhaka</p>
        <p>📞 01700-000000</p>
      </div>

      {/* Bill Info */}
      <div className="print-info">
        <div className="print-info-row highlight">
          <span>Table:</span>
          <span>{tableNo}</span>
        </div>
        <div className="print-info-row">
          <span>Bill #:</span>
          <span style={{ fontWeight: 'bold' }}>{order.id.slice(-8).toUpperCase()}</span>
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
          <span className="order-type-badge">🍽️ DINE-IN</span>
        </div>
      </div>

      <div className="print-divider-double"></div>

      {/* Items */}
      <div className="print-items">
        <div className="print-info-row" style={{ fontWeight: 'bold', marginBottom: '6px' }}>
          <span>Item</span>
          <span>Amount</span>
        </div>
        {order.items.map((item, idx) => (
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
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        {order.vatAmount > 0 && (
          <div className="print-total-row">
            <span>VAT (5%):</span>
            <span>{formatCurrency(order.vatAmount)}</span>
          </div>
        )}
        {serviceCharge > 0 && (
          <div className="print-total-row">
            <span>Service Charge (5%):</span>
            <span>{formatCurrency(serviceCharge)}</span>
          </div>
        )}
        {order.discount > 0 && (
          <div className="print-total-row discount">
            <span>Discount:</span>
            <span>-{formatCurrency(order.discount)}</span>
          </div>
        )}
        {extraDiscount > 0 && (
          <div className="print-total-row discount">
            <span>Extra Discount:</span>
            <span>-{formatCurrency(extraDiscount)}</span>
          </div>
        )}
        <div className="print-total-row grand">
          <span>TOTAL:</span>
          <span>{formatCurrency(finalTotal)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="print-footer">
        <p><strong>Thank you for dining with us!</strong></p>
        <p>আমাদের সাথে খাওয়ার জন্য ধন্যবাদ!</p>
        <p style={{ marginTop: '8px', fontSize: '10px' }}>
          --- Powered by RestaurantOS ---
        </p>
      </div>
    </div>
  );
};

export default TableBillReceipt;

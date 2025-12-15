import React from "react";
import { CartItem } from "@/types";

interface KotSlipProps {
  kotNumber: number;
  tableNo: string;
  items: CartItem[];
  time: string;
}

export const KotSlip: React.FC<KotSlipProps> = ({
  kotNumber,
  tableNo,
  items,
  time,
}) => {
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const kotDate = new Date(time);
  const formattedDate = kotDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });
  const formattedTime = kotDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div id="kot-slip-print">
      {/* KOT Header */}
      <div className="kot-header">
        <h1>🍳 KITCHEN ORDER</h1>
        <h2>KOT #{kotNumber}</h2>
      </div>

      {/* Table & Time Info */}
      <div className="kot-table-info">
        <div>
          <span style={{ fontSize: '12px' }}>TABLE</span>
          <div className="kot-table-no">{tableNo}</div>
        </div>
        <div className="kot-time">
          <div>{formattedDate}</div>
          <div style={{ fontWeight: 'bold' }}>{formattedTime}</div>
        </div>
      </div>

      {/* Items List */}
      <div className="kot-items">
        <div style={{ 
          fontWeight: 'bold', 
          marginBottom: '8px', 
          paddingBottom: '4px',
          borderBottom: '1px solid #333',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Order Items:
        </div>
        {items.map((item, idx) => (
          <div key={idx} className="kot-item">
            <span className="kot-item-qty">{item.quantity}x</span>
            <span className="kot-item-name">{item.itemName}</span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="kot-footer">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontWeight: 'bold',
          fontSize: '13px',
          marginBottom: '8px'
        }}>
          <span>Total Items:</span>
          <span>{totalQty}</span>
        </div>
        <p>--- Please prepare immediately ---</p>
        <p>অনুগ্রহ করে অবিলম্বে প্রস্তুত করুন</p>
      </div>
    </div>
  );
};

export default KotSlip;

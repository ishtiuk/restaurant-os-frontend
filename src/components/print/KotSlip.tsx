import React from "react";
import { CartItem } from "@/types";
import { getPrintSettingsSync } from "@/utils/printUtils";

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
  const settings = getPrintSettingsSync();
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
        <p className="kot-title">🍳 KITCHEN ORDER</p>
        <p className="kot-number">KOT #{kotNumber}</p>
      </div>

      {/* Table & Time Info */}
      <div className="kot-table-info">
        <div>
          <p className="kot-table-label">TABLE</p>
          <p className="kot-table-number">{tableNo}</p>
        </div>
        <div className="kot-time">
          <p>{formattedDate}</p>
          <p style={{ fontWeight: 'bold' }}>{formattedTime}</p>
        </div>
      </div>

      {/* Items List */}
      <div className="slip-items">
        <p className="kot-items-label">Order Items:</p>
        {items.map((item, idx) => (
          <div key={idx} className="kot-item">
            <span className="kot-item-qty">{item.quantity}x</span>
            <span className="kot-item-name">{item.itemName}</span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="kot-footer">
        <div className="kot-summary">
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
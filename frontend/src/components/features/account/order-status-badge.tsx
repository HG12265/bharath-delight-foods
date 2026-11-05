import React from "react";

interface OrderStatusBadgeProps {
  type: "order" | "payment" | "fulfillment";
  value: string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ type, value }) => {
  const getStyles = () => {
    switch (type) {
      case "order":
        switch (value) {
          case "pending_payment":
            return "bg-[#FAF3E0] text-[#B85C2E] border-[#D9A441]/35";
          case "confirmed":
            return "bg-success/10 text-success border-success/30";
          case "cancelled":
            return "bg-destructive/10 text-destructive border-destructive/30";
          case "closed":
            return "bg-indianInk/5 text-indianInk/60 border-indianInk/15";
          default:
            return "bg-indianInk/5 text-indianInk/60 border-indianInk/15";
        }
      case "payment":
        switch (value) {
          case "pending":
            return "bg-[#FAF3E0] text-[#B85C2E] border-[#D9A441]/35";
          case "paid":
            return "bg-success/10 text-success border-success/30";
          case "failed":
            return "bg-destructive/10 text-destructive border-destructive/30";
          case "refunded":
            return "bg-info/10 text-info border-info/30";
          default:
            return "bg-indianInk/5 text-indianInk/60 border-indianInk/15";
        }
      case "fulfillment":
        switch (value) {
          case "pending":
            return "bg-[#FAF3E0] text-[#B85C2E] border-[#D9A441]/35";
          case "packed":
            return "bg-info/10 text-info border-info/30";
          case "shipped":
            return "bg-info/20 text-info border-info/40";
          case "delivered":
            return "bg-success/10 text-success border-success/30";
          case "cancelled":
            return "bg-destructive/10 text-destructive border-destructive/30";
          default:
            return "bg-indianInk/5 text-indianInk/60 border-indianInk/15";
        }
    }
  };

  const formatValue = (val: string) => {
    return val.replace(/_/g, " ").toUpperCase();
  };

  return (
    <span className={`inline-flex items-center text-[10px] font-sans font-bold tracking-wider px-2 py-0.5 rounded border ${getStyles()}`}>
      {formatValue(value)}
    </span>
  );
};

export default OrderStatusBadge;

"use client";

import React, { useState } from "react";
import Link from "@/platform/link";
import AccountShell from "@/components/features/account/account-shell";
import OrderStatusBadge from "@/components/features/account/order-status-badge";
import dynamic from "@/platform/dynamic";

const ShipmentTimeline = dynamic(() => import("@/components/features/account/shipment-timeline"), {
  ssr: false,
});
import { useOrders, useCancelOrder } from "@/hooks/use-orders";
import { useShipmentByOrder } from "@/hooks/use-shipments";
import { formatINR } from "@/lib/utils";
import { 
  Loader2, 
  MapPin, 
  Trash2, 
  X, 
  ChevronRight, 
  AlertCircle,
  Truck,
  AlertTriangle
} from "lucide-react";
import ReportDamageModal from "@/components/features/claims/report-damage-modal";

export default function OrdersPage() {
  const { data: ordersData, isPending: isOrdersPending, isError: isOrdersError } = useOrders();
  const cancelOrderMutation = useCancelOrder();

  const allOrders = ordersData?.data || [];
  // Only show orders that have been paid, confirmed, or proof submitted (never pending unpaid checkouts)
  const orders = allOrders.filter(
    (o) => o.payment_status === "paid" || o.order_status === "confirmed" || Boolean((o as any).proof_submitted_at)
  );

  // Track Shipment modal states
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | null>(null);
  const [damageModalOrder, setDamageModalOrder] = useState<any>(null);

  // Use the optional enabled configuration according to instructions
  const { 
    data: shipmentData, 
    isPending: isShipmentPending, 
    isError: isShipmentError 
  } = useShipmentByOrder(selectedOrderId || "", {
    enabled: Boolean(selectedOrderId)
  });

  const handleOpenTracker = (orderId: string, orderNumber: string) => {
    setSelectedOrderNumber(orderNumber);
    setSelectedOrderId(orderId);
  };

  const handleCloseTracker = () => {
    setSelectedOrderId(null);
    setSelectedOrderNumber(null);
  };

  const handleCancelOrder = (orderId: string, orderNumber: string) => {
    if (window.confirm(`Are you sure you want to cancel order #${orderNumber}? This will release the allocated inventory stock.`)) {
      cancelOrderMutation.mutate(orderId);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch {
      return isoString;
    }
  };

  return (
    <AccountShell 
      title="Order History" 
      description="View past purchases, track active shipments, or cancel pending unpaid items."
    >
      <div className="space-y-6">
        
        {isOrdersPending ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-burnishedGold animate-spin" />
            <p className="text-xs text-indianInk/60 tracking-wider uppercase font-semibold">
              Retrieving your order log...
            </p>
          </div>
        ) : isOrdersError ? (
          <div className="p-4 bg-destructive-foreground border border-destructive/20 text-destructive text-sm font-sans rounded-[4px] flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>We encountered an error loading your order history. Please refresh to try again.</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-sm text-indianInk/60 font-sans">
              You haven't placed any orders with Bharath Delight Foods yet.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-deodharForest text-richCream font-sans text-xs font-bold tracking-widest uppercase rounded-[4px] border border-transparent hover:border-gheeGold shadow-sm hover:shadow transition-all duration-200"
            >
              Shop Ghee <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-up">
            {[...orders]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((order) => {
                // Cancellation rules: must not be cancelled, closed, or paid
                const canCancel = 
                  order.order_status !== "cancelled" && 
                  order.order_status !== "closed" && 
                  order.payment_status !== "paid";

                // Shipment tracking eligibility
                const hasShipment = 
                  order.fulfillment_status !== "pending" && 
                  order.fulfillment_status !== "cancelled";

                return (
                  <div 
                    key={order.id} 
                    className="border border-burnishedGold/15 rounded-lg bg-white overflow-hidden shadow-sm hover:border-burnishedGold/25 transition-colors duration-200"
                  >
                    {/* Header bar */}
                    <div className="bg-[#FAF9F6] border-b border-burnishedGold/10 px-5 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs font-sans">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <div>
                          <span className="text-indianInk/50 block text-[9px] uppercase tracking-wider">
                            Order Date
                          </span>
                          <span className="font-bold text-indianInk">
                            {formatDate(order.created_at)}
                          </span>
                        </div>
                        <div>
                          <span className="text-indianInk/50 block text-[9px] uppercase tracking-wider">
                            Order Number
                          </span>
                          <span className="font-bold text-deodharForest">
                            #{order.order_number}
                          </span>
                        </div>
                        <div>
                          <span className="text-indianInk/50 block text-[9px] uppercase tracking-wider">
                            Total Value
                          </span>
                          <span className="font-bold text-indianInk">
                            {formatINR(order.pricing.grand_total)}
                          </span>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <OrderStatusBadge type="order" value={order.order_status} />
                        <OrderStatusBadge type="payment" value={order.payment_status} />
                        <OrderStatusBadge type="fulfillment" value={order.fulfillment_status} />
                      </div>
                    </div>

                    {/* Order Body Details */}
                    <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                      
                      {/* Products preview */}
                      <div className="space-y-1.5 flex-grow min-w-0">
                        <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-indianInk/55 block">
                          Purchased Items
                        </span>
                        <div className="text-sm font-serif font-bold text-deodharForest truncate max-w-md">
                          {order.items.map(item => `${item.product_name} (${item.variant_title})`).join(", ")}
                        </div>
                        <p className="text-[10px] text-indianInk/50 font-sans">
                          Quantity: {order.items.reduce((acc, curr) => acc + curr.quantity, 0)} units total
                        </p>
                      </div>

                      {/* CTA Buttons */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                        
                        {/* Cancel Button */}
                        {canCancel && (
                          <button
                            onClick={() => handleCancelOrder(order.id, order.order_number)}
                            disabled={cancelOrderMutation.isPending}
                            className="flex items-center justify-center gap-1.5 px-3.5 py-2 border border-warmSaffron/20 hover:border-warmSaffron text-warmSaffron text-xs font-semibold uppercase tracking-wider rounded-[4px] hover:bg-warmSaffron/5 transition-all duration-200 disabled:opacity-40 outline-none w-full sm:w-auto text-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        )}

                        {/* Track Shipment */}
                        {hasShipment && (
                          <button
                            onClick={() => handleOpenTracker(order.id, order.order_number)}
                            className="flex items-center justify-center gap-1.5 px-3.5 py-2 border border-burnishedGold/25 hover:border-burnishedGold text-deodharForest text-xs font-semibold uppercase tracking-wider rounded-[4px] hover:bg-richCream/25 transition-all duration-200 w-full sm:w-auto text-center"
                          >
                            <Truck className="w-3.5 h-3.5 text-gheeGold" />
                            <span>Track</span>
                          </button>
                        )}

                        {/* View Details */}
                        <Link
                          href={`/order/${order.id}`}
                          className="px-4 py-2 bg-deodharForest hover:bg-deodharForest/95 text-richCream text-xs font-semibold uppercase tracking-widest rounded-[4px] hover:shadow transition-all duration-200 text-center w-full sm:w-auto"
                        >
                          Invoice / Pay
                        </Link>

                        {/* Report Damaged Product */}
                        <button
                          type="button"
                          onClick={() => setDamageModalOrder(order)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 border border-amber-600/30 hover:border-amber-600 text-amber-800 hover:bg-amber-50 text-xs font-semibold uppercase tracking-wider rounded-[4px] transition-all duration-200 w-full sm:w-auto text-center"
                          title="Report broken jar, leakage, or defective item"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Report Damage</span>
                        </button>

                      </div>

                    </div>
                  </div>
                );
              })}
          </div>
        )}

      </div>

      {/* TRACKING MODAL */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 bg-indianInk/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-burnishedGold/15 rounded-lg w-full max-w-xl p-6 shadow-xl relative animate-fade-up">
            
            {/* Close Button */}
            <button 
              onClick={handleCloseTracker}
              className="absolute top-4 right-4 text-indianInk/40 hover:text-indianInk transition-colors"
              aria-label="Close tracking details"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title */}
            <div className="border-b border-burnishedGold/10 pb-3 mb-5">
              <h3 className="font-serif text-lg font-bold text-deodharForest">
                Shipment Tracking
              </h3>
              <p className="text-[10px] font-sans uppercase tracking-wider text-indianInk/55">
                Order #{selectedOrderNumber}
              </p>
            </div>

            {/* Loading/Error states */}
            {isShipmentPending ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="w-6 h-6 text-burnishedGold animate-spin" />
                <p className="text-[10px] text-indianInk/50 uppercase tracking-widest font-semibold">
                  Connecting to carrier API...
                </p>
              </div>
            ) : isShipmentError || !shipmentData?.data ? (
              <div className="p-4 bg-deodharForest/5 border border-burnishedGold/15 rounded text-xs font-sans text-indianInk/85 leading-relaxed flex gap-3 items-start">
                <MapPin className="w-5 h-5 text-burnishedGold shrink-0" />
                <div>
                  <p className="font-bold text-deodharForest">Shipment Details Preparing</p>
                  <p className="text-[11px] text-indianInk/60 mt-0.5">
                    Our warehouse team is packaging your items. Tracking updates will populate here as soon as the logistics carrier scans the manifest barcode.
                  </p>
                </div>
              </div>
            ) : (
              <ShipmentTimeline shipment={shipmentData.data} />
            )}

            {/* Back Button */}
            <div className="mt-6 pt-4 border-t border-burnishedGold/10 text-right">
              <button
                onClick={handleCloseTracker}
                className="px-4 py-2 border border-burnishedGold/25 hover:border-deodharForest rounded text-xs font-sans font-bold tracking-widest uppercase text-deodharForest transition-colors"
              >
                Close Panel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* REPORT DAMAGE MODAL */}
      {damageModalOrder && (
        <ReportDamageModal
          isOpen={Boolean(damageModalOrder)}
          onClose={() => setDamageModalOrder(null)}
          order={damageModalOrder}
        />
      )}
    </AccountShell>
  );
}

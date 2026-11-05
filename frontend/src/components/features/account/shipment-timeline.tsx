import React from "react";
import { Shipment } from "@/types";
import { Truck, MapPin, CheckCircle, Package } from "lucide-react";

interface ShipmentTimelineProps {
  shipment: Shipment;
}

export const ShipmentTimeline: React.FC<ShipmentTimelineProps> = ({ shipment }) => {
  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  const sortedTimeline = [...shipment.timeline].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Carrier Info */}
      <div className="bg-[#FAF9F6] border border-burnishedGold/15 rounded p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm font-sans">
        <div>
          <span className="text-xs text-indianInk/50 block">Carrier Name</span>
          <span className="font-bold text-deodharForest uppercase tracking-wide">{shipment.carrier_name}</span>
        </div>
        <div>
          <span className="text-xs text-indianInk/50 block">Tracking Number</span>
          <code className="font-mono font-bold text-indianInk select-all bg-white border border-burnishedGold/10 px-2 py-0.5 rounded text-xs">
            {shipment.tracking_number}
          </code>
        </div>
        <div>
          <span className="text-xs text-indianInk/50 block">Current Status</span>
          <span className="font-bold text-deodharForest uppercase tracking-wider">{shipment.status.replace(/_/g, " ")}</span>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="relative border-l border-burnishedGold/25 ml-4 pl-6 space-y-6 py-2">
        {sortedTimeline.length === 0 ? (
          <div className="text-xs text-indianInk/55 font-sans">
            No status updates logged yet. Your package will update as soon as the carrier registers receipt.
          </div>
        ) : (
          sortedTimeline.map((event, index) => {
            const isLatest = index === 0;
            return (
              <div key={index} className="relative">
                {/* Timeline Node Point */}
                <span className={`absolute -left-[30px] top-1.5 flex items-center justify-center w-4 h-4 rounded-full border bg-white ${
                  isLatest ? "border-gheeGold text-gheeGold shadow-sm" : "border-burnishedGold/20 text-indianInk/30"
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isLatest ? "bg-gheeGold" : "bg-burnishedGold/40"}`} />
                </span>

                {/* Event text details */}
                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h5 className={`font-serif text-sm font-bold leading-none ${isLatest ? "text-deodharForest" : "text-indianInk/70"}`}>
                      {event.event_name}
                    </h5>
                    <span className="text-[10px] font-sans text-indianInk/50 whitespace-nowrap">
                      {formatDate(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs font-sans text-indianInk/60 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ShipmentTimeline;

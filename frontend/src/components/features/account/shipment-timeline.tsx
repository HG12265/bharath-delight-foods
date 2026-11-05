import React, { useState } from "react";
import { Shipment } from "@/types";
import { Truck, Copy, Check, ExternalLink, PackageCheck, AlertCircle } from "lucide-react";
import { getCourierTrackingUrl } from "@/lib/constants";

interface ShipmentTimelineProps {
  shipment: Shipment;
}

export const ShipmentTimeline: React.FC<ShipmentTimelineProps> = ({ shipment }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!shipment.tracking_number) return;
    navigator.clipboard.writeText(shipment.tracking_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const trackingUrl = getCourierTrackingUrl(shipment.carrier_name);
  const isDelivered = shipment.status === "delivered";
  const isReturned = shipment.status === "returned";

  const getStatusBadge = () => {
    if (isDelivered) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-sans text-xs font-bold uppercase tracking-wider">
          <PackageCheck className="w-3.5 h-3.5" /> Delivered
        </span>
      );
    }
    if (isReturned) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-800 border border-red-200 rounded-full font-sans text-xs font-bold uppercase tracking-wider">
          <AlertCircle className="w-3.5 h-3.5" /> Returned
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full font-sans text-xs font-bold uppercase tracking-wider">
        <Truck className="w-3.5 h-3.5 text-[#C49A45]" /> Dispatched
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Main Courier & Tracking Card */}
      <div className="bg-[#FAF9F6] border border-[#C49A45]/25 rounded-lg p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-burnishedGold/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0F3D2E] text-[#C89B3C] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-indianInk/50 block">
                Courier Service
              </span>
              <h4 className="font-serif text-lg font-bold text-[#0F3D2E] uppercase tracking-wide">
                {shipment.carrier_name}
              </h4>
            </div>
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {/* Tracking ID & Action Buttons */}
        <div className="bg-white border border-[#C49A45]/20 rounded-md p-4 space-y-3">
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-indianInk/60 block">
            Consignment / Tracking Number
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <code className="font-mono text-base font-bold text-[#0F3D2E] bg-[#FAF9F6] border border-[#C49A45]/30 px-3 py-2 rounded tracking-wider select-all">
              {shipment.tracking_number}
            </code>

            <div className="flex flex-wrap items-center gap-2">
              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-[#C49A45]/40 hover:border-[#C49A45] bg-[#FAF9F6] hover:bg-white text-[#0F3D2E] font-sans text-xs font-bold uppercase tracking-wider rounded transition"
                title="Copy Tracking ID"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#C49A45]" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>

              {/* Track on Website Button */}
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0F3D2E] hover:bg-[#15543F] text-richCream font-sans text-xs font-bold uppercase tracking-wider rounded transition shadow-sm"
              >
                <span>Track Shipment</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#C89B3C]" />
              </a>
            </div>
          </div>
        </div>

        {/* Helpful instructions */}
        <div className="text-xs font-sans text-indianInk/70 bg-[#FAF9F6] border-l-2 border-[#C89B3C] p-3 rounded-r leading-relaxed">
          💡 Click <strong className="text-[#0F3D2E]">Copy ID</strong> to copy your consignment tracking number, then click <strong className="text-[#0F3D2E]">Track Shipment</strong> to open the official <strong className="text-[#0F3D2E]">{shipment.carrier_name}</strong> portal and track your package.
        </div>
      </div>
    </div>
  );
};

export default ShipmentTimeline;

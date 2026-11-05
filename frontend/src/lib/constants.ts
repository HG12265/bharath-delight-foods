// Static constants declarations

export interface CourierServiceOption {
  id: string;
  name: string;
  trackingUrl: string;
}

export const COURIER_SERVICES: CourierServiceOption[] = [
  {
    id: "st_courier",
    name: "ST Courier",
    trackingUrl: "https://stcourier.com/track/shipment",
  },
  {
    id: "the_professional_couriers",
    name: "The Professional Couriers",
    trackingUrl: "https://www.tpcindia.com",
  },
];

export function getCourierTrackingUrl(carrierName?: string): string {
  const norm = (carrierName || "").toLowerCase().trim();
  if (norm.includes("st courier") || norm.includes("stcourier") || norm === "st_courier") {
    return "https://stcourier.com/track/shipment";
  }
  if (norm.includes("professional") || norm.includes("tpc") || norm === "the_professional_couriers") {
    return "https://www.tpcindia.com";
  }
  return "https://stcourier.com/track/shipment";
}

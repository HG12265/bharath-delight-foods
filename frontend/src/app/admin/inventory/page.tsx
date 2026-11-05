"use client";

import React, { useState, useMemo } from "react";
import { useMe } from "@/hooks/use-auth";
import { useInventories, useInventoryHistory, useAdjustStock } from "@/hooks/use-inventory";
import inventoryService from "@/services/inventory-service";
import {
  Loader2,
  Search,
  Edit3,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Package,
  BarChart3,
  Download,
  History,
  X,
  TrendingDown,
  TrendingUp,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  Filter,
} from "lucide-react";
import { InventoryDetails, InventoryMovement } from "@/types";

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

// ─────────────────────────────────────────────
// Status Badge Component
// ─────────────────────────────────────────────
function StatusBadge({ status }: { status: "healthy" | "low_stock" | "out_of_stock" }) {
  if (status === "out_of_stock") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-800 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-pulse" />
        Out of Stock
      </span>
    );
  }
  if (status === "low_stock") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
        <AlertTriangle className="w-3 h-3" />
        Low Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
      <CheckCircle className="w-3 h-3" />
      Healthy
    </span>
  );
}

// ─────────────────────────────────────────────
// KPI Card Component
// ─────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  sublabel,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
  sublabel?: string;
}) {
  return (
    <div className="bg-white border border-burnishedGold/15 rounded-xl p-4 shadow-sm flex gap-3 items-start hover:shadow-md transition-shadow">
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="font-serif text-2xl font-bold text-deodharForest leading-tight">{value}</div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-indianInk/50 mt-0.5">{label}</div>
        {sublabel && <div className="text-[10px] text-indianInk/40 mt-0.5">{sublabel}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Movement History Drawer
// ─────────────────────────────────────────────
function HistoryDrawer({
  sku,
  productName,
  onClose,
}: {
  sku: string;
  productName: string;
  onClose: () => void;
}) {
  const { data: histRes, isPending } = useInventoryHistory(sku, { enabled: !!sku });
  const movements = histRes?.data || [];

  function getMovementIcon(movementType: string) {
    if (movementType.includes("added") || movementType.includes("created") || movementType.includes("released")) {
      return <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />;
    }
    if (movementType.includes("removed") || movementType.includes("reserved") || movementType.includes("dispatched")) {
      return <ArrowDown className="w-3.5 h-3.5 text-red-500" />;
    }
    return <RefreshCw className="w-3.5 h-3.5 text-burnishedGold" />;
  }

  function getMovementLabel(m: InventoryMovement) {
    const labels: Record<string, string> = {
      stock_created: "Initial Stock",
      stock_added: "Stock Added",
      stock_removed: "Stock Removed",
      stock_reserved: "Reserved",
      stock_released: "Released",
      shipment_dispatched: "Dispatched",
      shipment_cancelled: "Shipment Cancelled",
      order_cancelled: "Order Cancelled",
    };
    return labels[m.movement_type] || m.action;
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/50" onClick={onClose} />
      {/* Drawer */}
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-burnishedGold/15 bg-[#FAF9F6]">
          <div>
            <div className="font-serif text-lg font-bold text-deodharForest">Movement History</div>
            <div className="text-xs text-indianInk/60 mt-0.5">
              {productName} — <span className="font-bold text-deodharForest">{sku}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-burnishedGold/10 text-indianInk/60 hover:text-indianInk transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {isPending ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-burnishedGold" />
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-10 text-indianInk/40 text-xs italic">
              No movement history recorded for this SKU yet.
            </div>
          ) : (
            <ol className="relative border-l-2 border-burnishedGold/15 ml-2 space-y-0">
              {movements.map((m, i) => (
                <li key={m.id} className="ml-4 pb-5">
                  {/* Timeline dot */}
                  <span className="absolute -left-[9px] flex items-center justify-center w-4 h-4 bg-white border-2 border-burnishedGold/40 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-burnishedGold/80 inline-block" />
                  </span>

                  <div className="bg-[#FAF9F6] border border-burnishedGold/10 rounded-lg p-3 ml-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-indianInk">
                        {getMovementIcon(m.movement_type)}
                        <span>{getMovementLabel(m)}</span>
                      </div>
                      <div
                        className={`text-xs font-bold ${
                          m.movement_type.includes("added") ||
                          m.movement_type.includes("created") ||
                          m.movement_type.includes("released")
                            ? "text-emerald-700"
                            : "text-red-600"
                        }`}
                      >
                        {m.movement_type.includes("added") ||
                        m.movement_type.includes("created") ||
                        m.movement_type.includes("released")
                          ? `+${m.quantity}`
                          : `-${m.quantity}`}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] text-indianInk/60 mb-2">
                      <div>
                        <div className="font-bold uppercase text-[9px] tracking-wider">Before</div>
                        <div className="font-semibold text-indianInk">{m.before}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold uppercase text-[9px] tracking-wider">Delta</div>
                        <div className="font-semibold text-indianInk">{m.quantity}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold uppercase text-[9px] tracking-wider">After</div>
                        <div className="font-semibold text-indianInk">{m.after}</div>
                      </div>
                    </div>

                    {m.reason && (
                      <div className="text-[10px] text-indianInk/60 italic border-t border-burnishedGold/10 pt-1.5">
                        {m.reason}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-burnishedGold/10">
                      <div className="text-[9px] text-indianInk/40 uppercase tracking-wider font-bold">
                        {m.performed_by}
                      </div>
                      <div className="text-[9px] text-indianInk/40">
                        {m.timestamp
                          ? formatDate(m.timestamp)
                          : "—"}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Adjust Stock Modal
// ─────────────────────────────────────────────
interface AdjustModalProps {
  sku: string;
  productName: string;
  onClose: () => void;
}

function AdjustModal({ sku, productName, onClose }: AdjustModalProps) {
  const [warehouseId, setWarehouseId] = useState("WH-MAIN");
  const [quantityDelta, setQuantityDelta] = useState<number>(0);
  const [locationCode, setLocationCode] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const adjustStockMutation = useAdjustStock();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (quantityDelta === 0) {
      setError("Please specify a non-zero adjustment quantity.");
      return;
    }

    try {
      await adjustStockMutation.mutateAsync({
        sku,
        payload: {
          warehouse_id: warehouseId,
          quantity: quantityDelta,
          location_code: locationCode || undefined,
          reason: reason || undefined,
        },
      });
      setSuccess("Stock adjusted successfully!");
      setTimeout(onClose, 1200);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to adjust stock. Check if removal exceeds available units."
      );
    }
  };

  const isRemoval = quantityDelta < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-burnishedGold/20 rounded-xl shadow-2xl p-6 max-w-md w-full space-y-4 font-sans text-xs"
      >
        <div className="flex items-start justify-between">
          <h3 className="font-serif text-lg font-bold text-deodharForest">Adjust Stock Level</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-burnishedGold/10 text-indianInk/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product context */}
        <div className="bg-[#FAF9F6] p-3 rounded-lg border border-burnishedGold/15">
          <div className="font-bold text-deodharForest text-sm">{productName}</div>
          <div className="text-[10px] text-indianInk/50 font-mono font-semibold uppercase mt-0.5">
            SKU: {sku}
          </div>
        </div>

        {/* Warehouse */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">
            Warehouse Node
          </label>
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="w-full text-xs border border-burnishedGold/30 focus:border-burnishedGold bg-white rounded-lg p-2 focus:outline-none"
          >
            <option value="WH-MAIN">WH-MAIN — Main Warehouse</option>
            <option value="WH-NORTH">WH-NORTH — North Facility</option>
            <option value="WH-SOUTH">WH-SOUTH — South Facility</option>
            <option value="WH-DEFAULT">WH-DEFAULT — Standard Depot</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Quantity Delta */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">
              Adjustment (+/-)
            </label>
            <input
              type="number"
              value={quantityDelta}
              onChange={(e) => setQuantityDelta(parseInt(e.target.value) || 0)}
              placeholder="e.g. 50 or -20"
              className={`w-full text-xs border focus:outline-none rounded-lg p-2 transition-colors ${
                isRemoval
                  ? "border-red-300 focus:border-red-400 bg-red-50/30"
                  : "border-burnishedGold/30 focus:border-burnishedGold"
              }`}
            />
          </div>

          {/* Location Code */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">
              Layout Code
            </label>
            <input
              type="text"
              value={locationCode}
              onChange={(e) => setLocationCode(e.target.value)}
              placeholder="e.g. A-3-R5"
              className="w-full text-xs border border-burnishedGold/30 focus:border-burnishedGold rounded-lg p-2 focus:outline-none"
            />
          </div>
        </div>

        {/* Reason */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">
            Reason (Optional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Purchase Received, Damage Write-off, Correction"
            className="w-full text-xs border border-burnishedGold/30 focus:border-burnishedGold rounded-lg p-2 focus:outline-none"
          />
        </div>

        {/* Enterprise warning for removals */}
        {isRemoval && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-[10px] text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              Removal cannot exceed available units (on-hand minus reserved). Reserved stock
              protecting active orders cannot be removed.
            </span>
          </div>
        )}

        {error && (
          <p className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </p>
        )}
        {success && (
          <p className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2">
            ✓ {success}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 font-bold uppercase tracking-wider border border-burnishedGold/30 hover:bg-richCream/5 text-indianInk rounded-lg transition text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={adjustStockMutation.isPending}
            className={`flex-1 py-2.5 font-bold uppercase tracking-wider rounded-lg transition shadow-sm disabled:opacity-50 text-xs ${
              isRemoval
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-deodharForest text-richCream hover:bg-deodharForest/90"
            }`}
          >
            {adjustStockMutation.isPending ? (
              <span className="flex items-center justify-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Posting...
              </span>
            ) : isRemoval ? (
              "Remove Stock"
            ) : (
              "Add Stock"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function AdminInventoryPage() {
  const { data: meData } = useMe();
  const { data: inventoriesRes, isPending, error, refetch } = useInventories();

  const user = meData?.data;
  const isAdmin = user?.role === "admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "healthy" | "low_stock" | "out_of_stock">("all");

  // Drawer/modal state
  const [adjustingSku, setAdjustingSku] = useState<string | null>(null);
  const [adjustingProductName, setAdjustingProductName] = useState("");
  const [historySkuTarget, setHistorySkuTarget] = useState<{ sku: string; productName: string } | null>(null);

  const inventories: InventoryDetails[] = inventoriesRes?.data || [];

  // ─── KPI calculations from real data ───
  const kpis = useMemo(() => {
    const totalSkus = inventories.length;
    const totalOnHand = inventories.reduce((s, i) => s + i.on_hand_total, 0);
    const totalReserved = inventories.reduce((s, i) => s + i.reserved_total, 0);
    const totalAvailable = inventories.reduce((s, i) => s + i.available_total, 0);
    const lowStockSkus = inventories.filter((i) => i.inventory_status === "low_stock").length;
    const outOfStockSkus = inventories.filter((i) => i.inventory_status === "out_of_stock").length;
    return { totalSkus, totalOnHand, totalReserved, totalAvailable, lowStockSkus, outOfStockSkus };
  }, [inventories]);

  // ─── Filter ───
  const filtered = useMemo(() => {
    return inventories.filter((inv) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        inv.sku.toLowerCase().includes(q) ||
        inv.product_name.toLowerCase().includes(q) ||
        inv.variant_name.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || inv.inventory_status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [inventories, searchQuery, statusFilter]);

  const [isExporting, setIsExporting] = useState(false);

  // ─── CSV Export ───
  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const blob = await inventoryService.exportCsv();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "inventory_export.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export CSV:", err);
      alert("Failed to export inventory. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-burnishedGold" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <ShieldAlert className="w-10 h-10 text-red-400" />
        <p className="text-sm text-indianInk/60">Failed to load inventory data.</p>
        <button
          onClick={() => refetch()}
          className="text-xs font-bold uppercase tracking-wider border border-burnishedGold/30 px-4 py-2 rounded hover:bg-richCream/5 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ─── Header ─── */}
      <div className="border-b border-burnishedGold/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-deodharForest">
            Inventory Registry
          </h1>
          <p className="text-xs sm:text-sm text-indianInk/60 mt-1">
            Real-time inventory across all warehouse nodes. All values are live from the database.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => refetch()}
            title="Refresh"
            className="p-2 border border-burnishedGold/25 rounded-lg hover:bg-richCream/10 text-indianInk/60 hover:text-indianInk transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider border border-burnishedGold/30 rounded-lg hover:bg-richCream/10 text-deodharForest transition disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {isExporting ? "Exporting..." : "Export CSV"}
            </button>
          )}
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          label="Total SKUs"
          value={kpis.totalSkus}
          icon={Package}
          accent="bg-deodharForest/10 text-deodharForest"
        />
        <KpiCard
          label="On-Hand Units"
          value={kpis.totalOnHand.toLocaleString()}
          icon={BarChart3}
          accent="bg-burnishedGold/15 text-burnishedGold"
        />
        <KpiCard
          label="Reserved Units"
          value={kpis.totalReserved.toLocaleString()}
          icon={TrendingDown}
          accent="bg-blue-50 text-blue-600"
          sublabel="Locked for orders"
        />
        <KpiCard
          label="Available Units"
          value={kpis.totalAvailable.toLocaleString()}
          icon={TrendingUp}
          accent="bg-emerald-50 text-emerald-600"
          sublabel="Ready to sell"
        />
        <KpiCard
          label="Low Stock SKUs"
          value={kpis.lowStockSkus}
          icon={AlertTriangle}
          accent="bg-amber-50 text-amber-600"
        />
        <KpiCard
          label="Out of Stock"
          value={kpis.outOfStockSkus}
          icon={ShieldAlert}
          accent="bg-red-50 text-red-600"
        />
      </div>

      {/* ─── Filters ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indianInk/40">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search SKU or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 font-sans text-xs border border-burnishedGold/30 focus:border-burnishedGold bg-white rounded-lg focus:outline-none placeholder-indianInk/40"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-indianInk/40" />
          {(["all", "healthy", "low_stock", "out_of_stock"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border transition ${
                statusFilter === s
                  ? s === "all"
                    ? "bg-deodharForest text-richCream border-deodharForest"
                    : s === "healthy"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : s === "low_stock"
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-red-600 text-white border-red-600"
                  : "bg-white text-indianInk/60 border-burnishedGold/20 hover:bg-richCream/10"
              }`}
            >
              {s === "all" ? "All" : s === "low_stock" ? "Low Stock" : s === "out_of_stock" ? "Out of Stock" : "Healthy"}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Inventory Table ─── */}
      <div className="bg-white border border-burnishedGold/15 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left font-sans text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#FAF9F6] border-b border-burnishedGold/10 text-indianInk/60">
                <th className="px-4 py-3 font-bold uppercase tracking-wider w-[220px]">Product / Variant</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider w-[130px]">SKU</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider w-[80px] text-right">On Hand</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider w-[80px] text-right">Reserved</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider w-[80px] text-right">Available</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider w-[80px] text-right">Safety Lvl</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider w-[120px]">Status</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider text-right w-[130px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-burnishedGold/8">
              {filtered.length > 0 ? (
                filtered.map((inv) => (
                  <tr
                    key={inv.sku}
                    className={`hover:bg-richCream/5 transition-colors ${
                      inv.inventory_status === "out_of_stock"
                        ? "bg-red-50/30"
                        : inv.inventory_status === "low_stock"
                        ? "bg-amber-50/20"
                        : ""
                    }`}
                  >
                    {/* Product + Variant */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-indianInk truncate max-w-[200px]">
                        {inv.product_name}
                      </div>
                      <div className="text-[10px] text-indianInk/55 mt-0.5 font-normal">
                        {inv.variant_name}
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-4 py-3.5 font-mono font-bold text-deodharForest text-[10px] uppercase tracking-wide">
                      {inv.sku}
                    </td>

                    {/* On Hand */}
                    <td className="px-4 py-3.5 font-semibold text-indianInk text-right">
                      {inv.on_hand_total}
                    </td>

                    {/* Reserved */}
                    <td className="px-4 py-3.5 text-blue-600 font-semibold text-right">
                      {inv.reserved_total}
                    </td>

                    {/* Available */}
                    <td className="px-4 py-3.5 font-bold text-right">
                      <span
                        className={
                          inv.available_total <= 0
                            ? "text-red-600"
                            : inv.is_low_stock
                            ? "text-amber-600"
                            : "text-emerald-700"
                        }
                      >
                        {inv.available_total}
                      </span>
                    </td>

                    {/* Safety Stock */}
                    <td className="px-4 py-3.5 text-indianInk/50 text-right">
                      {inv.safety_stock_level}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <StatusBadge status={inv.inventory_status} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* History Button */}
                        <button
                          onClick={() => setHistorySkuTarget({ sku: inv.sku, productName: inv.product_name })}
                          title="View Movement History"
                          className="p-1.5 border border-burnishedGold/20 hover:border-burnishedGold bg-white hover:bg-richCream/10 rounded-lg inline-flex items-center gap-1 text-indianInk/60 hover:text-indianInk transition"
                        >
                          <History className="w-3 h-3" />
                        </button>
                        {/* Adjust Button — ADMIN only */}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setAdjustingSku(inv.sku);
                              setAdjustingProductName(inv.product_name);
                            }}
                            title="Adjust Stock"
                            className="p-1.5 border border-burnishedGold/25 hover:border-burnishedGold bg-white hover:bg-richCream/10 rounded-lg inline-flex items-center gap-1 font-bold uppercase tracking-widest text-[9px] text-burnishedGold transition"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Adjust</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-indianInk/40 italic text-xs">
                    {inventories.length === 0
                      ? "No inventory records found. Stock records are created automatically when products are received."
                      : "No records match the current search/filter criteria."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer row count */}
        {inventories.length > 0 && (
          <div className="px-4 py-2.5 bg-[#FAF9F6] border-t border-burnishedGold/10 text-[10px] text-indianInk/50 font-sans flex items-center justify-between">
            <span>
              Showing <strong>{filtered.length}</strong> of <strong>{inventories.length}</strong> SKUs
            </span>
            <span className="text-[9px] uppercase tracking-wider font-bold text-indianInk/30">
              Live data · Refreshed on load
            </span>
          </div>
        )}
      </div>

      {/* ─── Movement History Drawer ─── */}
      {historySkuTarget && (
        <HistoryDrawer
          sku={historySkuTarget.sku}
          productName={historySkuTarget.productName}
          onClose={() => setHistorySkuTarget(null)}
        />
      )}

      {/* ─── Adjust Stock Modal ─── */}
      {adjustingSku && isAdmin && (
        <AdjustModal
          sku={adjustingSku}
          productName={adjustingProductName}
          onClose={() => {
            setAdjustingSku(null);
            setAdjustingProductName("");
          }}
        />
      )}
    </div>
  );
}

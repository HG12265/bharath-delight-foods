"use client";

import React, { useState, useEffect } from "react";
import { useAdminSettings, useUpdateAdminSettings } from "@/hooks/use-settings";
import { useMe } from "@/hooks/use-auth";
import {
  Loader2,
  Save,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
  Building2,
  CreditCard,
  Receipt,
  Headphones,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight
} from "lucide-react";

export default function AdminSettingsPage() {
  const { data: meRes, isPending: isMePending } = useMe();
  const { data: settingsRes, isPending, refetch, isRefetching } = useAdminSettings();
  const updateSettingsMutation = useUpdateAdminSettings();

  // Access control check
  const user = meRes?.data;
  const role = user?.role;
  const isAdmin = role === "admin";

  // Form states
  const [form, setForm] = useState({
    upi_id: "",
    tax_percentage: 0,
    shipping_fee: 0,
    free_shipping_threshold: 0,
    support_contact: "",
    fssai_number: "",
    gst_number: "",
    brand_name: "",
    support_email: "",
    support_phone: "",
    business_address: "",
    payment_display_name: "",
    upi_instructions: "",
    public_support_email: "",
    public_support_phone: "",
    working_hours: ""
  });

  const [savedForm, setSavedForm] = useState({ ...form });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");

  // Sync loaded settings data with form state
  useEffect(() => {
    if (settingsRes?.success && settingsRes.data) {
      const s = settingsRes.data;
      const loaded = {
        upi_id: s.upi_id || "",
        tax_percentage: Number(s.tax_percentage) || 0,
        shipping_fee: Number(s.shipping_fee) || 0,
        free_shipping_threshold: Number(s.free_shipping_threshold) || 0,
        support_contact: s.support_contact || "",
        fssai_number: s.fssai_number || "",
        gst_number: s.gst_number || "",
        brand_name: s.brand_name || "",
        support_email: s.support_email || "",
        support_phone: s.support_phone || "",
        business_address: s.business_address || "",
        payment_display_name: s.payment_display_name || "",
        upi_instructions: s.upi_instructions || "",
        public_support_email: s.public_support_email || "",
        public_support_phone: s.public_support_phone || "",
        working_hours: s.working_hours || ""
      };
      setForm(loaded);
      setSavedForm(loaded);
    }
  }, [settingsRes]);

  // Handle Toast Auto Dismiss
  useEffect(() => {
    if (formSuccess) {
      const timer = setTimeout(() => setFormSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [formSuccess]);

  const validateField = (name: string, value: any): string => {
    let error = "";
    if (name === "upi_id") {
      if (!value || !value.trim()) {
        error = "UPI ID is required.";
      } else if (!value.includes("@")) {
        error = "Invalid UPI ID format. Must contain '@'.";
      }
    } else if (name === "fssai_number") {
      if (value && !/^\d{14}$/.test(value.trim())) {
        error = "FSSAI License Number must be exactly 14 digits.";
      }
    } else if (name === "gst_number") {
      if (value && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(value.trim())) {
        error = "Invalid GSTIN format (e.g. 33AABCM1234D1Z5).";
      }
    } else if (name === "tax_percentage") {
      const num = Number(value);
      if (isNaN(num) || num < 0 || num > 100) {
        error = "Tax percentage must be between 0.00 and 100.00.";
      }
    } else if (name === "shipping_fee") {
      const num = Number(value);
      if (isNaN(num) || num < 0) {
        error = "Shipping fee cannot be negative.";
      }
    } else if (name === "free_shipping_threshold") {
      const num = Number(value);
      if (isNaN(num) || num < 0) {
        error = "Free shipping threshold cannot be negative.";
      }
    } else if (name === "support_phone" || name === "public_support_phone") {
      if (value && value.trim()) {
        const cleaned = value.replace(/\s+/g, "").replace(/-/g, "");
        if (!/^(?:\+91)?\d{10}$/.test(cleaned)) {
          error = "Must be a 10-digit Indian number optionally prefixed with +91.";
        }
      }
    }
    return error;
  };

  const handleChange = (name: string, value: any) => {
    setForm(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setValidationErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleReset = () => {
    setForm(savedForm);
    setValidationErrors({});
    setFormError("");
    setFormSuccess("");
  };

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);
  const hasErrors = Object.values(validationErrors).some(err => !!err);
  const isSaveDisabled = !isDirty || hasErrors || updateSettingsMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess("");
    setFormError("");

    // Validate all fields
    const errors: Record<string, string> = {};
    Object.keys(form).forEach(key => {
      const error = validateField(key, (form as any)[key]);
      if (error) {
        errors[key] = error;
      }
    });
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormError("Please resolve all validation errors before saving.");
      return;
    }

    try {
      await updateSettingsMutation.mutateAsync({
        upi_id: form.upi_id.trim(),
        tax_percentage: Number(form.tax_percentage),
        shipping_fee: Number(form.shipping_fee),
        free_shipping_threshold: 0,
        support_contact: form.support_email.trim() || form.support_contact.trim() || "support@bharathdelightfoods.in",
        fssai_number: form.fssai_number.trim() || null,
        gst_number: form.gst_number.trim().toUpperCase() || null,
        brand_name: form.brand_name.trim() || null,
        support_email: form.support_email.trim() || null,
        support_phone: form.support_phone.trim() || null,
        business_address: form.business_address.trim() || null,
        payment_display_name: form.payment_display_name.trim() || null,
        upi_instructions: form.upi_instructions.trim() || null,
        public_support_email: form.public_support_email.trim() || null,
        public_support_phone: form.public_support_phone.trim() || null,
        working_hours: form.working_hours.trim() || null
      });

      setFormSuccess("Global settings updated successfully!");
      refetch();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || "Failed to update configurations.");
    }
  };

  if (isMePending || isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-burnishedGold" />
        <p className="text-sm font-medium text-indianInk/60">Loading Workspace Settings...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white border border-red-200 rounded-lg p-8 shadow-sm flex flex-col items-center text-center space-y-4">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
          <XCircle className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-deodharForest">
          Access Restricted
        </h2>
        <p className="text-sm text-indianInk/70 max-w-md">
          Only Administrators are permitted to view or manage global application settings. 
          If you are logged in as a Warehouse or Customer agent, this panel is forbidden.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-24">
      {/* Success Toast */}
      {formSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-900 text-richCream border border-green-700 px-4 py-3.5 rounded shadow-lg flex items-center gap-3 animate-fade-in transition-all">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="text-xs font-semibold">{formSuccess}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-burnishedGold/10 pb-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-deodharForest">
            Global Application Settings
          </h1>
          <p className="text-xs sm:text-sm text-indianInk/60 mt-1">
            Reconfigure brand identity details, legal identifiers, payment gateways, and shipping matrices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-2 px-3.5 py-2 border border-burnishedGold/30 hover:border-burnishedGold bg-white text-deodharForest text-xs font-bold uppercase tracking-wider rounded transition-all shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            Sync Config
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-xs">Validation / Submission Failed</h4>
            <p className="text-xs text-red-700/90 mt-1">{formError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 text-xs">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SECTION 1: BUSINESS IDENTITY */}
          <div className="bg-white border border-burnishedGold/15 rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="bg-deodharForest/5 border-b border-burnishedGold/10 px-5 py-4 flex items-center gap-3">
              <div className="p-2 bg-deodharForest/10 text-deodharForest rounded-md">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-base font-bold text-deodharForest">
                  Business Identity
                </h2>
                <p className="text-[10px] text-indianInk/60 mt-0.5">
                  Configure corporate credentials, FSSAI licenses, and GST identifiers.
                </p>
              </div>
            </div>
            <div className="p-6 space-y-4 flex-grow">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/70">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={form.brand_name}
                    onChange={(e) => handleChange("brand_name", e.target.value)}
                    placeholder="e.g. Bharath Delight Foods"
                    className="w-full text-xs border border-burnishedGold/30 focus:border-burnishedGold rounded-md p-2.5 focus:outline-none transition-colors bg-white text-indianInk"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/70">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={form.support_email}
                    onChange={(e) => handleChange("support_email", e.target.value)}
                    placeholder="e.g. support@bharathdelightfoods.in"
                    className="w-full text-xs border border-burnishedGold/30 focus:border-burnishedGold rounded-md p-2.5 focus:outline-none transition-colors bg-white text-indianInk"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/70">
                    Support Phone Number
                  </label>
                  <input
                    type="text"
                    value={form.support_phone}
                    onChange={(e) => handleChange("support_phone", e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className={`w-full text-xs border rounded-md p-2.5 focus:outline-none transition-colors bg-white text-indianInk ${
                      validationErrors.support_phone ? "border-red-500 focus:border-red-600" : "border-burnishedGold/30 focus:border-burnishedGold"
                    }`}
                  />
                  {validationErrors.support_phone && (
                    <p className="text-[9px] font-medium text-red-600 mt-1">{validationErrors.support_phone}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/70 flex items-center gap-1">
                    FSSAI License Number
                    <span title="Must be exactly 14 numeric digits.">
                      <HelpCircle className="w-3 h-3 text-indianInk/40 cursor-help" />
                    </span>
                  </label>
                  <input
                    type="text"
                    value={form.fssai_number}
                    onChange={(e) => handleChange("fssai_number", e.target.value)}
                    placeholder="e.g. 12345678901234"
                    className={`w-full text-xs border rounded-md p-2.5 focus:outline-none transition-colors bg-white text-indianInk ${
                      validationErrors.fssai_number ? "border-red-500 focus:border-red-600" : "border-burnishedGold/30 focus:border-burnishedGold"
                    }`}
                  />
                  {validationErrors.fssai_number && (
                    <p className="text-[9px] font-medium text-red-600 mt-1">{validationErrors.fssai_number}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/70 flex items-center gap-1">
                  GSTIN Number
                  <span title="Valid Indian state tax registration ID format.">
                    <HelpCircle className="w-3 h-3 text-indianInk/40 cursor-help" />
                  </span>
                </label>
                <input
                  type="text"
                  value={form.gst_number}
                  onChange={(e) => handleChange("gst_number", e.target.value)}
                  placeholder="e.g. 33AABCM1234D1Z5"
                  className={`w-full text-xs border rounded-md p-2.5 focus:outline-none transition-colors bg-white text-indianInk uppercase ${
                    validationErrors.gst_number ? "border-red-500 focus:border-red-600" : "border-burnishedGold/30 focus:border-burnishedGold"
                  }`}
                />
                {validationErrors.gst_number && (
                  <p className="text-[9px] font-medium text-red-600 mt-1">{validationErrors.gst_number}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/70">
                  Business Office Address
                </label>
                <textarea
                  value={form.business_address}
                  onChange={(e) => handleChange("business_address", e.target.value)}
                  placeholder="Complete registered physical address of office/factory."
                  rows={2}
                  className="w-full text-xs border border-burnishedGold/30 focus:border-burnishedGold rounded-md p-2.5 focus:outline-none transition-colors bg-white text-indianInk resize-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: PAYMENT SETTINGS */}
          <div className="bg-white border border-burnishedGold/15 rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="bg-deodharForest/5 border-b border-burnishedGold/10 px-5 py-4 flex items-center gap-3">
              <div className="p-2 bg-deodharForest/10 text-deodharForest rounded-md">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-base font-bold text-deodharForest">
                  Payment Gateway Configurations
                </h2>
                <p className="text-[10px] text-indianInk/60 mt-0.5">
                  Update bank deep-linking, QR routing, and offline collection guides.
                </p>
              </div>
            </div>
            <div className="p-6 space-y-4 flex-grow">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/70 flex items-center gap-1">
                    Merchant UPI ID *
                    <span title="Critical routing address. Must contain '@'.">
                      <HelpCircle className="w-3 h-3 text-indianInk/40 cursor-help" />
                    </span>
                  </label>
                  <input
                    type="text"
                    value={form.upi_id}
                    onChange={(e) => handleChange("upi_id", e.target.value)}
                    placeholder="e.g. bharathdelightfoods@upi"
                    className={`w-full text-xs border rounded-md p-2.5 focus:outline-none transition-colors bg-white text-indianInk ${
                      validationErrors.upi_id ? "border-red-500 focus:border-red-600" : "border-burnishedGold/30 focus:border-burnishedGold"
                    }`}
                    required
                  />
                  {validationErrors.upi_id && (
                    <p className="text-[9px] font-medium text-red-600 mt-1">{validationErrors.upi_id}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/70">
                    Payment Display Name
                  </label>
                  <input
                    type="text"
                    value={form.payment_display_name}
                    onChange={(e) => handleChange("payment_display_name", e.target.value)}
                    placeholder="e.g. Bharath Delight Foods"
                    className="w-full text-xs border border-burnishedGold/30 focus:border-burnishedGold rounded-md p-2.5 focus:outline-none transition-colors bg-white text-indianInk"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/70">
                  Manual UPI Instructions
                </label>
                <textarea
                  value={form.upi_instructions}
                  onChange={(e) => handleChange("upi_instructions", e.target.value)}
                  placeholder="Detailed guidelines shown to users on checkout when processing manual UPI transfers."
                  rows={4}
                  className="w-full text-xs border border-burnishedGold/30 focus:border-burnishedGold rounded-md p-2.5 focus:outline-none transition-colors bg-white text-indianInk resize-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: CHECKOUT PRICING */}
          <div className="bg-white border border-burnishedGold/15 rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="bg-deodharForest/5 border-b border-burnishedGold/10 px-5 py-4 flex items-center gap-3">
              <div className="p-2 bg-deodharForest/10 text-deodharForest rounded-md">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-base font-bold text-deodharForest">
                  Checkout & Pricing Parameters
                </h2>
                <p className="text-[10px] text-indianInk/60 mt-0.5">
                  Configure default tax calculations, delivery rates, and free delivery thresholds.
                </p>
              </div>
            </div>
            <div className="p-6 space-y-4 flex-grow">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/70">
                    GST Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={form.tax_percentage}
                    onChange={(e) => handleChange("tax_percentage", e.target.value)}
                    placeholder="e.g. 0.00"
                    className={`w-full text-xs border rounded-md p-2.5 focus:outline-none transition-colors bg-white text-indianInk ${
                      validationErrors.tax_percentage ? "border-red-500 focus:border-red-600" : "border-burnishedGold/30 focus:border-burnishedGold"
                    }`}
                    required
                  />
                  {validationErrors.tax_percentage && (
                    <p className="text-[9px] font-medium text-red-600 mt-1">{validationErrors.tax_percentage}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/70">
                    Standard Shipping Fee (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.shipping_fee}
                    onChange={(e) => handleChange("shipping_fee", e.target.value)}
                    placeholder="e.g. 0.00"
                    className={`w-full text-xs border rounded-md p-2.5 focus:outline-none transition-colors bg-white text-indianInk ${
                      validationErrors.shipping_fee ? "border-red-500 focus:border-red-600" : "border-burnishedGold/30 focus:border-burnishedGold"
                    }`}
                    required
                  />
                  {validationErrors.shipping_fee && (
                    <p className="text-[9px] font-medium text-red-600 mt-1">{validationErrors.shipping_fee}</p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-amber-50/70 border border-amber-200/55 rounded-md text-amber-900 leading-relaxed space-y-1">
                <h4 className="font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 text-amber-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Storefront Pricing Rule Info
                </h4>
                <p className="text-[10px] text-amber-800/90">
                  {Number(form.shipping_fee) === 0
                    ? "Free shipping is enabled on all orders."
                    : `Customers are charged ₹${Number(form.shipping_fee).toFixed(2)} flat shipping fee per order.`}
                  {Number(form.tax_percentage) > 0
                    ? ` GST Tax of ${Number(form.tax_percentage).toFixed(2)}% applies to item prices.`
                    : " Tax rate is set to 0% (Tax-free / GST inclusive)."}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 4: STOREFRONT CONTACT */}
          <div className="bg-white border border-burnishedGold/15 rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="bg-deodharForest/5 border-b border-burnishedGold/10 px-5 py-4 flex items-center gap-3">
              <div className="p-2 bg-deodharForest/10 text-deodharForest rounded-md">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-base font-bold text-deodharForest">
                  Storefront Public Support
                </h2>
                <p className="text-[10px] text-indianInk/60 mt-0.5">
                  Expose support channels, business working hours, and hotlines directly to customers.
                </p>
              </div>
            </div>
            <div className="p-6 space-y-4 flex-grow">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/70">
                    Public Support Email
                  </label>
                  <input
                    type="email"
                    value={form.public_support_email}
                    onChange={(e) => handleChange("public_support_email", e.target.value)}
                    placeholder="e.g. info@bharathdelightfoods.in"
                    className="w-full text-xs border border-burnishedGold/30 focus:border-burnishedGold rounded-md p-2.5 focus:outline-none transition-colors bg-white text-indianInk"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/70">
                    Public Support Phone
                  </label>
                  <input
                    type="text"
                    value={form.public_support_phone}
                    onChange={(e) => handleChange("public_support_phone", e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className={`w-full text-xs border rounded-md p-2.5 focus:outline-none transition-colors bg-white text-indianInk ${
                      validationErrors.public_support_phone ? "border-red-500 focus:border-red-600" : "border-burnishedGold/30 focus:border-burnishedGold"
                    }`}
                  />
                  {validationErrors.public_support_phone && (
                    <p className="text-[9px] font-medium text-red-600 mt-1">{validationErrors.public_support_phone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/70">
                  Working Hours Disclosure
                </label>
                <input
                  type="text"
                  value={form.working_hours}
                  onChange={(e) => handleChange("working_hours", e.target.value)}
                  placeholder="e.g. Mon - Sat, 9:00 AM - 6:00 PM"
                  className="w-full text-xs border border-burnishedGold/30 focus:border-burnishedGold rounded-md p-2.5 focus:outline-none transition-colors bg-white text-indianInk"
                />
              </div>
            </div>
          </div>
        </div>

        {/* STICKY BOTTOM BAR FOR ACTIONS */}
        <div className="fixed bottom-0 left-0 right-0 sm:left-64 bg-white/95 backdrop-blur-md border-t border-burnishedGold/15 px-6 py-4 flex items-center justify-between shadow-lg z-40 transition-all">
          <div className="flex items-center gap-3">
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Unsaved Changes
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-800 border border-green-200 rounded text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Settings Synced
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={!isDirty || updateSettingsMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 border border-burnishedGold/25 hover:border-burnishedGold bg-white text-deodharForest text-xs font-bold uppercase tracking-wider rounded-md transition-all shadow-2xs disabled:opacity-45 disabled:pointer-events-none"
            >
              Reset Changes
            </button>
            <button
              type="submit"
              disabled={isSaveDisabled}
              className="bg-deodharForest hover:bg-deodharForest/95 text-richCream font-bold uppercase tracking-wider text-xs px-6 py-2.5 rounded-md transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-gheeGold" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-gheeGold" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}


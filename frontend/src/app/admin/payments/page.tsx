"use client";

import React, { useState } from "react";
import { useDashboard } from "@/hooks/use-dashboard";
import { useAdminVerifyPayment } from "@/hooks/use-payments";
import { useMediaAsset } from "@/hooks/use-media";
import { Loader2, Check, X, Eye, Clock, FileText } from "lucide-react";
import { optimizeCloudinaryUrl } from "@/lib/utils";

export default function AdminPaymentsPage() {
  const { data: dashboardRes, isPending, refetch } = useDashboard();
  const verifyPaymentMutation = useAdminVerifyPayment();

  const [activeScreenshotId, setActiveScreenshotId] = useState<string | null>(null);
  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");

  const pendingProofs = dashboardRes?.data?.pending_payment_proofs || [];

  const handleApprove = async (paymentId: string) => {
    if (confirm("Are you sure you want to APPROVE this payment proof? This will mark the order as PAID.")) {
      await verifyPaymentMutation.mutateAsync({
        paymentId,
        payload: { action: "approve" }
      });
      refetch();
    }
  };

  const handleStartReject = (paymentId: string) => {
    setRejectingPaymentId(paymentId);
    setRejectionReason("");
    setRejectionError("");
  };

  const handleSaveReject = async () => {
    if (!rejectionReason.trim()) {
      setRejectionError("Please enter a valid rejection reason.");
      return;
    }

    if (rejectingPaymentId) {
      await verifyPaymentMutation.mutateAsync({
        paymentId: rejectingPaymentId,
        payload: { 
          action: "reject",
          rejection_reason: rejectionReason
        }
      });
      setRejectingPaymentId(null);
      setRejectionReason("");
      refetch();
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR"
    }).format(val);
  };

  if (isPending) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-burnishedGold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="border-b border-burnishedGold/10 pb-4">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-deodharForest">
          Pending Payment Proofs
        </h1>
        <p className="text-xs sm:text-sm text-indianInk/60 mt-1">
          Review manual UPI transfer screenshots. Verify transfer receipt before marking orders paid.
        </p>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Table of proofs */}
        <div className="xl:col-span-8 bg-white border border-burnishedGold/15 rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-sans text-xs border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-burnishedGold/10 text-indianInk/60">
                  <th className="px-4 py-3 font-bold uppercase tracking-wider">Order No</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider">Submitted At</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider">Screenshot</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-burnishedGold/10">
                {pendingProofs.length > 0 ? (
                  pendingProofs.map((proof) => (
                    <tr key={proof.id} className="hover:bg-richCream/5 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-deodharForest">
                        #{proof.order_number}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-indianInk text-sm">
                        {formatCurrency(Number(proof.amount))}
                      </td>
                      <td className="px-4 py-3.5 text-indianInk/60">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-burnishedGold" />
                          <span>{new Date(proof.created_at).toLocaleString("en-IN")}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {proof.screenshot_media_id ? (
                          <button
                            onClick={() => setActiveScreenshotId(proof.screenshot_media_id || null)}
                            className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors ${
                              activeScreenshotId === proof.screenshot_media_id
                                ? "bg-burnishedGold text-white border-transparent"
                                : "bg-white text-burnishedGold border-burnishedGold/30 hover:border-burnishedGold"
                            }`}
                          >
                            <Eye className="w-3 h-3" />
                            {activeScreenshotId === proof.screenshot_media_id ? "Viewing" : "View"}
                          </button>
                        ) : (
                          <span className="text-indianInk/40 italic flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" /> No screenshot
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(proof.id)}
                            disabled={verifyPaymentMutation.isPending}
                            className="bg-green-700 hover:bg-green-800 text-white font-bold uppercase tracking-wider text-[10px] px-3 py-1.5 rounded transition-colors inline-flex items-center gap-1 shadow-sm disabled:opacity-50"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => handleStartReject(proof.id)}
                            disabled={verifyPaymentMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider text-[10px] px-3 py-1.5 rounded transition-colors inline-flex items-center gap-1 shadow-sm disabled:opacity-50"
                          >
                            <X className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-indianInk/40 italic">
                      No pending payment proofs to review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Screenshot Viewer Panel */}
        <div className="xl:col-span-4 bg-white border border-burnishedGold/15 rounded shadow-sm p-4 space-y-4">
          <h2 className="font-serif text-base font-bold text-deodharForest pb-2 border-b border-burnishedGold/10">
            Screenshot Viewer
          </h2>
          {activeScreenshotId ? (
            <ScreenshotViewer mediaId={activeScreenshotId} />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-burnishedGold/10 rounded">
              <Eye className="w-8 h-8 text-indianInk/20 mb-2" />
              <p className="text-xs text-indianInk/40 italic">
                Select a payment proof screenshot from the table list to preview.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Reject Modal dialog box */}
      {rejectingPaymentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white border border-burnishedGold/20 rounded shadow-lg p-6 max-w-md w-full space-y-4 animate-fade-up font-sans">
            <h3 className="font-serif text-lg font-bold text-red-700 flex items-center gap-2">
              <X className="w-5 h-5" /> Reject Payment Proof
            </h3>
            
            <p className="text-xs text-indianInk/70 leading-relaxed">
              Please provide the reason for rejecting this manual payment proof. This note will be visible to the customer on their order details screen.
            </p>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">
                Rejection Reason
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Transaction reference number mismatch / Screenshot blur..."
                rows={3}
                className="w-full text-xs border border-burnishedGold/30 focus:border-burnishedGold rounded p-2 focus:outline-none placeholder-indianInk/40"
              />
              {rejectionError && (
                <p className="text-[10px] font-semibold text-red-600">
                  {rejectionError}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setRejectingPaymentId(null)}
                className="flex-1 py-2 text-center font-sans text-xs font-bold uppercase tracking-wider border border-burnishedGold/30 hover:bg-richCream/5 text-indianInk rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReject}
                disabled={verifyPaymentMutation.isPending}
                className="flex-1 py-2 text-center font-sans text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white rounded transition shadow-sm"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

interface ScreenshotViewerProps {
  mediaId: string;
}

function ScreenshotViewer({ mediaId }: ScreenshotViewerProps) {
  const { data: mediaRes, isPending, error } = useMediaAsset(mediaId);

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-burnishedGold" />
        <p className="text-[10px] text-indianInk/50">Loading file URL...</p>
      </div>
    );
  }

  if (error || !mediaRes?.success || !mediaRes.data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-xs">
        Failed to fetch screenshot metadata. The asset record might have been deleted or token expired.
      </div>
    );
  }

  const asset = mediaRes.data;

  return (
    <div className="space-y-3 font-sans">
      <div className="border border-burnishedGold/10 rounded overflow-hidden bg-richCream/5 flex justify-center max-h-[400px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={optimizeCloudinaryUrl(asset.public_url, 1200)}
          alt={asset.original_filename || "Proof Screenshot"}
          className="object-contain w-full max-h-[400px]"
        />
      </div>
      <div className="text-[10px] text-indianInk/60 space-y-1 bg-[#FAF9F6] p-3 border border-burnishedGold/10 rounded">
        <div><strong className="text-indianInk/80">File Name:</strong> {asset.original_filename}</div>
        <div><strong className="text-indianInk/80">File Type:</strong> {asset.content_type}</div>
        <div><strong className="text-indianInk/80">File Size:</strong> {(asset.size / 1024).toFixed(1)} KB</div>
        <div>
          <a
            href={asset.public_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-burnishedGold hover:text-deodharForest underline font-bold uppercase tracking-widest text-[9px] mt-1.5 block"
          >
            Open Original File ↗
          </a>
        </div>
      </div>
    </div>
  );
}

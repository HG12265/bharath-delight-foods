"use client";

import React from "react";
import Link from "@/platform/link";
import AccountShell from "@/components/features/account/account-shell";
import { 
  useNotifications, 
  useMarkNotificationRead, 
  useMarkAllNotificationsRead 
} from "@/hooks/use-notifications";
import { 
  Loader2, 
  CheckCheck, 
  Bell, 
  BellRing, 
  Clock, 
  MailOpen, 
  AlertCircle
} from "lucide-react";

export default function NotificationsPage() {
  const { data: notificationsData, isPending, isError } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = (id: string) => {
    markReadMutation.mutate(id);
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      markAllReadMutation.mutate();
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  return (
    <AccountShell 
      title="Notifications" 
      description="View updates regarding your payments, order completions, and general accounts."
    >
      <div className="space-y-6">
        
        {/* Header bar controls */}
        {notifications.length > 0 && (
          <div className="flex justify-between items-center bg-[#FAF9F6] border border-burnishedGold/10 p-3.5 rounded-lg text-xs font-sans">
            <span className="font-semibold text-indianInk/60">
              {unreadCount > 0 ? `${unreadCount} unread message(s) pending` : "No new messages"}
            </span>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending}
                className="flex items-center gap-1 text-deodharForest hover:text-burnishedGold font-bold uppercase tracking-wider outline-none disabled:opacity-40 transition-colors"
              >
                {markAllReadMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5 text-gheeGold" />
                )}
                <span>Mark all read</span>
              </button>
            )}
          </div>
        )}

        {isPending ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-burnishedGold animate-spin" />
            <p className="text-xs text-indianInk/60 tracking-wider uppercase font-semibold">
              Loading your inbox...
            </p>
          </div>
        ) : isError ? (
          <div className="p-4 bg-destructive-foreground border border-destructive/20 text-destructive text-sm font-sans rounded-[4px] flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Failed to retrieve notifications. Please reload the page.</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-12 h-12 bg-deodharForest/5 border border-burnishedGold/15 rounded-full flex items-center justify-center mx-auto text-indianInk/30">
              <Bell className="w-5 h-5" />
            </div>
            <p className="text-sm text-indianInk/60 font-sans">
              Your notifications inbox is completely empty.
            </p>
            <Link
              href="/shop"
              className="inline-block px-4 py-2 border border-deodharForest/20 hover:border-deodharForest text-deodharForest font-sans text-xs font-bold tracking-widest uppercase rounded-[4px] transition-colors"
            >
              Shop Ghee
            </Link>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-up">
            {[...notifications]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((notif) => {
                const isUnread = !notif.is_read;
                return (
                  <div 
                    key={notif.id}
                    className={`border rounded-lg p-4 transition-all duration-200 flex items-start gap-4 shadow-xs hover:shadow-sm ${
                      isUnread 
                        ? "bg-white border-burnishedGold/25 shadow-[0_2px_8px_rgba(217,164,65,0.03)]" 
                        : "bg-[#FAF9F6]/50 border-burnishedGold/10"
                    }`}
                  >
                    {/* Unread Indicator icon */}
                    <div className="shrink-0 mt-0.5">
                      {isUnread ? (
                        <div className="w-8 h-8 bg-gheeGold/10 border border-gheeGold/30 text-gheeGold rounded-full flex items-center justify-center">
                          <BellRing className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-indianInk/5 border border-indianInk/10 text-indianInk/40 rounded-full flex items-center justify-center">
                          <Bell className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Message Details */}
                    <div className="flex-grow min-w-0 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className={`text-sm font-serif font-bold ${isUnread ? "text-deodharForest" : "text-indianInk/70"}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] font-sans text-indianInk/45 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-burnishedGold/70" /> {formatDate(notif.created_at)}
                        </span>
                      </div>
                      
                      <p className="text-xs font-sans text-indianInk/65 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>

                    {/* Quick Mark Read button */}
                    {isUnread && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        disabled={markReadMutation.isPending}
                        className="shrink-0 p-1.5 border border-burnishedGold/15 rounded hover:bg-richCream hover:border-burnishedGold text-burnishedGold hover:text-deodharForest transition-colors"
                        title="Mark as read"
                      >
                        {markReadMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <MailOpen className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                  </div>
                );
              })}
          </div>
        )}

      </div>
    </AccountShell>
  );
}

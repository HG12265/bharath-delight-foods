import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { env } from "./env";
import { siteConfig } from "@/config/site";

/**
 * Standard utility function to merge Tailwind classes safely with clsx and tailwind-merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a given number into Indian Rupee currency standard formatting.
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Direct high-speed local media delivery helper.
 */
export function optimizeCloudinaryUrl(url: string, _width?: number): string {
  return url || "";
}

/**
 * Resolves the appropriate fallback image based on product name/slug.
 */
export function getProductFallbackImage(nameOrSlug?: string): string {
  const normalized = (nameOrSlug || "").toLowerCase();
  if (normalized.includes("rasipuram")) {
    return "/images/rasipuram-ghee.jpg";
  }
  if (normalized.includes("uthukuli")) {
    return "/images/uthukuli-ghee.jpg";
  }
  return "/images/product-placeholder.jpg";
}
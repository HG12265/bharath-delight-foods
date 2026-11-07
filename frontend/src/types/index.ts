export type UserRole = "admin" | "warehouse" | "customer";

export interface PersonalDetails {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export interface User {
  id: string;
  email?: string;
  phone: string;
  role: UserRole;
  personal_details: PersonalDetails;
}

export interface Token {
  access_token: string;
  token_type: string;
  role: UserRole;
  user?: User;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_id?: string;
  parent_id?: string;
  level: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  variant_id: string;
  sku: string;
  title: string;
  volume_weight: string;
  price: number;
  stock_status: "in_stock" | "out_of_stock";
  is_active: boolean;
  original_price?: number;
  offer_price?: number | null;
  effective_price?: number;
  discount_amount?: number;
  discount_percentage?: number;
  has_offer?: boolean;
  offer_title?: string | null;
  offer_badge?: string | null;
}

export interface SourcingDetails {
  region: string;
  story: string;
  manufacturer_id?: string;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface SEOMetadata {
  meta_title?: string;
  meta_description?: string;
  meta_keywords: string[];
}

export interface ProductRatings {
  average_rating: number;
  review_count: number;
  total_reviews: number;
  star_1_count: number;
  star_2_count: number;
  star_3_count: number;
  star_4_count: number;
  star_5_count: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  category_id: string;
  media_ids: string[];
  media_urls?: string[];
  sourcing: SourcingDetails;
  attributes: ProductAttribute[];
  variants: ProductVariant[];
  seo: SEOMetadata;
  ratings: ProductRatings;
  tags: string[];
  search_keywords: string[];
  is_featured: boolean;
  status: "draft" | "active" | "archived";
  min_price?: number;
  display_price?: number;
  original_min_price?: number;
  has_active_offer?: boolean;
  offer_badge?: string | null;
  max_discount_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface CartProductSummary {
  name: string;
  slug: string;
  media_ids: string[];
  media_urls?: string[];
  image_url?: string;
  price: number;
  original_price?: number;
  has_offer?: boolean;
  offer_badge?: string | null;
  discount_amount?: number | string;
  discount_percentage?: number;
  offer_title?: string | null;
  sku: string;
  stock_status: string;
  volume_weight?: string;
  variant_title?: string;
  title?: string;
}

export interface CartItem {
  product_id: string;
  variant_id: string;
  sku: string;
  quantity: number;
  unit_price_snapshot: number;
  original_price?: number;
  has_offer?: boolean;
  offer_badge?: string | null;
  discount_amount?: number | string;
  added_at: string;
  updated_at: string;
  product_summary?: CartProductSummary;
}

export interface CartSummary {
  subtotal: number;
  total_discount?: number | string;
  item_count: number;
  quantity_total: number;
}

export interface Cart {
  id: string;
  customer_id?: string;
  guest_token?: string;
  items: CartItem[];
  summary: CartSummary;
  status: "active" | "converted" | "abandoned";
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface CheckoutItem {
  product_id: string;
  variant_id: string;
  sku: string;
  quantity: number;
  price: number;
  reserved_warehouse_id: string;
}

export interface CheckoutPricing {
  subtotal: number;
  tax_estimate: number;
  shipping_fee: number;
  coupon_code?: string;
  discount: number;
  grand_total: number;
}

export interface CheckoutSession {
  id: string;
  cart_id: string;
  customer_id?: string;
  guest_token?: string;
  email: string;
  items: CheckoutItem[];
  shipping_address: ShippingAddress;
  pricing: CheckoutPricing;
  status: string;
  idempotency_key: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type FulfillmentStatus = "pending" | "packed" | "shipped" | "delivered" | "cancelled";
export type OrderStatus = "pending_payment" | "confirmed" | "cancelled" | "closed";

export interface OrderCustomerSnapshot {
  customer_id?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
}

export interface OrderAddressSnapshot {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface OrderItem {
  product_id: string;
  variant_id: string;
  sku: string;
  product_name: string;
  product_slug?: string;
  media_urls?: string[];
  image_url?: string;
  variant_title: string;
  volume_weight?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  reserved_warehouse_id: string;
}

export interface OrderPricing {
  subtotal: number;
  discount: number;
  tax_total: number;
  shipping_fee: number;
  grand_total: number;
}

export interface Order {
  id: string;
  order_number: string;
  checkout_id: string;
  customer_id?: string;
  guest_token?: string;
  customer_snapshot: OrderCustomerSnapshot;
  shipping_address_snapshot: OrderAddressSnapshot;
  items: OrderItem[];
  pricing: OrderPricing;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  order_status: OrderStatus;
  proof_submitted_at?: string | null;
  invoice_number?: string;
  invoice_generated_at?: string;
  created_at: string;
  updated_at: string;
}

export type UpiPaymentStatus = "pending" | "approved" | "rejected";

export interface Payment {
  id: string;
  order_id: string;
  customer_id: string;
  upi_id: string;
  amount: number;
  upi_link: string;
  payment_proof_id?: string;
  status: UpiPaymentStatus;
  rejection_reason?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface TimelineEvent {
  event_name?: string;
  status?: string;
  message?: string;
  location?: string | null;
  timestamp: string;
  description?: string;
  updated_by?: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  order_number: string;
  customer_id?: string;
  carrier_name: string;
  tracking_number: string;
  awb_number?: string;
  status: "pending" | "packed" | "shipped" | "reached_hub" | "out_for_delivery" | "delivered" | "failed" | "returned" | "cancelled";
  timeline: TimelineEvent[];
  estimated_delivery_date?: string;
  created_at: string;
}

export type ReviewModerationStatus = "pending" | "approved" | "rejected";

export interface Review {
  id: string;
  product_id: string;
  customer_id: string;
  order_id: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  moderation_status: ReviewModerationStatus;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewModerationDetail extends Review {
  product_name: string;
  customer_name: string;
  customer_email: string;
}

export interface ReviewsSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  target_user_id?: string;
  role_target?: string;
  is_read: boolean;
  read_at?: string;
  metadata?: Record<string, string>;
  created_at: string;
}

export interface SettingsPublic {
  tax_percentage: number;
  shipping_fee: number;
  free_shipping_threshold: number;
  support_contact: string;
  fssai_number?: string;
  gst_number?: string;
  brand_name?: string;
  public_support_email?: string;
  public_support_phone?: string;
  working_hours?: string;
}

export interface SettingsAdmin extends SettingsPublic {
  id: string;
  upi_id: string;
  support_email?: string;
  support_phone?: string;
  business_address?: string;
  payment_display_name?: string;
  upi_instructions?: string;
}

export interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface APIError {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}

export interface WarehouseStock {
  warehouse_id: string;
  on_hand: number;
  reserved: number;
  location_code?: string;
}

export interface Inventory {
  id: string;
  sku: string;
  variant_id: string;
  product_id: string;
  warehouse_stock: WarehouseStock[];
  safety_stock_level: number;
  on_hand_total: number;
  reserved_total: number;
  available_total: number;
  is_low_stock: boolean;
  /** Centralized status from backend: healthy | low_stock | out_of_stock */
  inventory_status: "healthy" | "low_stock" | "out_of_stock";
  created_at: string;
  updated_at: string;
}

/** Inventory enriched with product/variant metadata — from GET /api/v1/inventories */
export interface InventoryDetails extends Inventory {
  product_name: string;
  variant_name: string;
  product_image?: string;
}

/** A single inventory movement history entry — from GET /api/v1/inventories/{sku}/history */
export interface InventoryMovement {
  id: string;
  timestamp: string;
  action: string;
  movement_type: string;
  quantity: number;
  before: number;
  after: number;
  performed_by: string;
  reason?: string;
}

/** Payload for PATCH /api/v1/inventories/{sku}/adjust */
export interface StockAdjustmentPayload {
  warehouse_id: string;
  quantity: number;
  location_code?: string;
  reason?: string;
}

export interface DashboardPaymentProof {
  id: string;
  order_id: string;
  order_number: string;
  amount: number;
  status: string;
  screenshot_media_id?: string;
  created_at: string;
}

export interface DashboardData {
  total_orders?: number;
  total_revenue?: number;
  pending_payments?: number;
  confirmed_orders?: number;
  shipped_orders?: number;
  delivered_orders?: number;
  low_stock_count?: number;
  pending_review_count?: number;
  total_customers?: number;
  total_products?: number;
  recent_orders?: Order[];
  low_stock_alerts?: Inventory[];
  pending_payment_proofs?: DashboardPaymentProof[];
  pending_reviews?: Review[];
}

export interface WishlistProductSummary {
  name: string;
  slug: string;
  media_ids: string[];
  media_urls?: string[];
  price: number;
  sku: string;
  stock_status: "in_stock" | "out_of_stock";
  volume_weight: string;
}

export interface WishlistItem {
  product_id: string;
  variant_id: string;
  sku: string;
  added_at: string;
  product_summary: WishlistProductSummary;
}

export interface Wishlist {
  id: string;
  customer_id: string;
  items: WishlistItem[];
  created_at: string;
  updated_at: string;
}

export interface Session {
  authenticated: boolean;
  user: User | null;
}

export interface OfferItem {
  product_id: string;
  product_name: string;
  product_slug?: string;
  variant_id: string;
  variant_sku: string;
  variant_title: string;
  original_price: number;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  offer_price: number;
}

export interface Offer {
  id: string;
  title: string;
  badge_text: string;
  description?: string;
  status: "active" | "draft" | "disabled" | "cancelled";
  items: OfferItem[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_deleted?: boolean;
}

export interface OfferStats {
  total: number;
  active: number;
  disabled: number;
  draft: number;
  cancelled: number;
}

export interface CreateOfferPayload {
  title: string;
  badge_text: string;
  description?: string;
  status?: "active" | "draft";
  items: Array<{
    product_id: string;
    product_name?: string;
    product_slug?: string;
    variant_id: string;
    variant_sku?: string;
    variant_title?: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
  }>;
}

export interface UpdateOfferPayload {
  title?: string;
  badge_text?: string;
  description?: string;
  status?: "active" | "disabled" | "draft" | "cancelled";
  items?: Array<{
    product_id: string;
    product_name?: string;
    product_slug?: string;
    variant_id: string;
    variant_sku?: string;
    variant_title?: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
  }>;
}

export interface Coupon {
  _id: string;
  id?: string;
  code: string;
  name: string;
  description?: string;
  discount_type: "flat" | "percentage";
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number | null;
  usage_limit?: number | null;
  used_count: number;
  status: "active" | "inactive";
  valid_from?: string;
  valid_until?: string | null;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponStats {
  total: number;
  active: number;
  inactive: number;
  total_used: number;
}

export interface CreateCouponPayload {
  code: string;
  name: string;
  description?: string;
  discount_type: "flat" | "percentage";
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  usage_limit?: number | null;
  status?: "active" | "inactive";
  valid_until?: string | null;
}

export interface UpdateCouponPayload {
  name?: string;
  description?: string;
  discount_type?: "flat" | "percentage";
  discount_value?: number;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  usage_limit?: number | null;
  status?: "active" | "inactive";
  valid_until?: string | null;
}

export interface ValidateCouponResult {
  valid: boolean;
  code: string;
  name: string;
  discount_type: "flat" | "percentage";
  discount_value: number;
  discount_amount: number;
  min_order_amount?: number;
}

export type ClaimIssueType =
  | "broken_jar"
  | "leaked"
  | "seal_tampered"
  | "package_damaged"
  | "wrong_item"
  | "quality_issue"
  | "other";

export type ClaimStatus = "pending" | "approved" | "rejected" | "resolved";
export type ClaimResolution = "replacement" | "refund";

export interface DamageClaim {
  _id: string;
  claim_id: string;
  order_id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  product_id?: string | null;
  product_name: string;
  variant_title: string;
  quantity: number;
  issue_type: ClaimIssueType;
  description: string;
  images: string[];
  preferred_resolution: ClaimResolution;
  status: ClaimStatus;
  admin_notes?: string | null;
  resolution_details?: any;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateClaimPayload {
  order_id: string;
  product_id?: string | null;
  product_name: string;
  variant_title?: string;
  quantity?: number;
  issue_type: ClaimIssueType;
  description: string;
  images?: string[];
  preferred_resolution?: ClaimResolution;
  contact_phone?: string;
}




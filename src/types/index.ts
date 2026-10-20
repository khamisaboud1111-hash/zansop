// ─── Database Types ────────────────────────────────────────────────────────────

export type UserRole = 'buyer' | 'seller' | 'admin' | 'rider'

export type SellerStatus = 'pending' | 'approved' | 'suspended'

export type ProductStatus = 'draft' | 'active' | 'out_of_stock' | 'rejected'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'packed'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type DeliveryZone =
  | 'stone_town'
  | 'north_zanzibar'
  | 'south_zanzibar'
  | 'east_zanzibar'
  | 'west_zanzibar'
  | 'pemba_island'

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  role: UserRole
  preferred_language: 'en' | 'sw'
  delivery_zone: DeliveryZone | null
  delivery_address: string | null
  created_at: string
  updated_at: string
}

// ─── Seller ───────────────────────────────────────────────────────────────────

export interface Seller {
  id: string
  user_id: string
  store_name: string
  store_slug: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  whatsapp_number: string
  status: SellerStatus
  commission_rate: number
  total_sales: number
  total_revenue: number
  average_rating: number
  review_count: number
  is_featured: boolean
  verified_at: string | null
  location_area: string | null
  latitude: number | null
  longitude: number | null
  location_label: string | null
  national_id_verified: boolean
  business_license_verified: boolean
  created_at: string
  updated_at: string
  // joins
  profile?: Profile
}

// ─── Seller verification ──────────────────────────────────────────────────────

export type VerificationDocType = 'national_id' | 'business_license' | 'tax_id' | 'other'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'

export interface SellerVerificationDocument {
  id: string
  seller_id: string
  doc_type: VerificationDocType
  file_url: string
  status: VerificationStatus
  reviewer_note: string | null
  created_at: string
}

// ─── Payments ──────────────────────────────────────────────────────────────────

export type PaymentProvider = 'mpesa' | 'airtel_money' | 'tigo_pesa' | 'cash_on_delivery' | 'manual'
export type PaymentStatus = 'initiated' | 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'

export interface PaymentTransaction {
  id: string
  order_id: string
  provider: PaymentProvider
  status: PaymentStatus
  amount: number
  currency: string
  phone_number: string | null
  provider_reference: string | null
  initiated_at: string
  completed_at: string | null
  failure_reason: string | null
}

// ─── Delivery tracking events ─────────────────────────────────────────────────

export interface DeliveryTrackingEvent {
  id: string
  order_id: string
  status: OrderStatus
  note: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
  created_by: string | null
}

// ─── Recently viewed ───────────────────────────────────────────────────────────

export interface RecentlyViewedItem {
  id: string
  user_id: string
  product_id: string
  viewed_at: string
  product?: Product
}

// ─── Testimonials ──────────────────────────────────────────────────────────────

export interface Testimonial {
  id: string
  author_name: string
  author_role: string | null
  avatar_url: string | null
  quote_en: string
  quote_sw: string
  rating: number | null
  is_published: boolean
  sort_order: number
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string
  name_en: string
  name_sw: string
  slug: string
  icon: string
  parent_id: string | null
  sort_order: number
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface ProductImage {
  id: string
  product_id: string
  url: string
  sort_order: number
  is_primary: boolean
}

export interface ProductVideo {
  id: string
  product_id: string
  url: string
  thumbnail_url: string | null
  sort_order: number
}

export interface Product {
  id: string
  seller_id: string
  category_id: string
  name: string
  slug: string
  description: string
  price: number
  compare_at_price: number | null
  stock_quantity: number
  sku: string | null
  weight_grams: number | null
  status: ProductStatus
  is_made_in_zanzibar: boolean
  location_area: string | null
  pickup_available: boolean
  delivery_available: boolean
  tags: string[]
  average_rating: number
  review_count: number
  total_sold: number
  created_at: string
  updated_at: string
  // joins
  seller?: Seller
  category?: Category
  images?: ProductImage[]
  videos?: ProductVideo[]
  reviews?: Review[]
}

// ─── Order ────────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  seller_id: string
  quantity: number
  unit_price: number
  total_price: number
  product?: Product
}

export interface OrderTracking {
  id: string
  order_id: string
  status: OrderStatus
  note: string | null
  created_at: string
  created_by: string
}

export interface Order {
  id: string
  buyer_id: string
  status: OrderStatus
  subtotal: number
  delivery_fee: number
  commission_amount: number
  total_amount: number
  delivery_zone: DeliveryZone
  delivery_address: string
  delivery_name: string
  delivery_phone: string
  payment_method: string
  payment_reference: string | null
  payment_confirmed: boolean
  notes: string | null
  created_at: string
  updated_at: string
  // joins
  buyer?: Profile
  items?: OrderItem[]
  tracking?: OrderTracking[]
}

// ─── Review ───────────────────────────────────────────────────────────────────

export interface Review {
  id: string
  product_id: string
  buyer_id: string
  order_id: string
  rating: number
  comment: string | null
  seller_reply: string | null
  created_at: string
  buyer?: Profile
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export interface WishlistItem {
  id: string
  user_id: string
  product_id: string
  created_at: string
  product?: Product
}

// ─── Notification ─────────────────────────────────────────────────────────────

export type NotificationType =
  | 'order_placed'
  | 'order_confirmed'
  | 'order_packed'
  | 'order_out_for_delivery'
  | 'order_delivered'
  | 'order_cancelled'
  | 'new_review'
  | 'seller_approved'
  | 'seller_suspended'
  | 'product_approved'
  | 'product_rejected'
  | 'low_stock'
  | 'payment_received'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title_en: string
  title_sw: string
  body_en: string
  body_sw: string
  is_read: boolean
  link: string | null
  created_at: string
}

// ─── Delivery ─────────────────────────────────────────────────────────────────

export interface DeliveryZoneConfig {
  zone: DeliveryZone
  name_en: string
  name_sw: string
  fee: number
  estimated_days: number
}

// ─── Commission ───────────────────────────────────────────────────────────────

export interface CommissionRecord {
  id: string
  order_id: string
  seller_id: string
  order_amount: number
  commission_rate: number
  commission_amount: number
  is_paid: boolean
  paid_at: string | null
  created_at: string
  order?: Order
  seller?: Seller
}

// ─── Cart (client-side only) ──────────────────────────────────────────────────

export interface CartItem {
  product: Product
  quantity: number
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}


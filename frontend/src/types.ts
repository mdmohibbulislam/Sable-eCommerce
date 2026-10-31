export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

export interface Category {
  id: number
  name: string
  slug: string
  tagline: string
  description: string
  icon: string
  accent: string
  product_count: number
}

export interface CategoryBrief {
  id: number
  name: string
  slug: string
  icon: string
  accent: string
}

export interface GalleryImage {
  id: number
  url: string
  alt: string
  sort_order: number
}

export interface Product {
  id: number
  name: string
  slug: string
  sku?: string
  summary: string
  description?: string
  highlights?: string[]
  price: number
  compare_at_price: number | null
  discount_percent: number
  is_on_sale: boolean
  in_stock: boolean
  stock: number
  stock_status: StockStatus
  is_featured: boolean
  image_url: string
  gallery?: GalleryImage[]
  rating: number
  review_count: number
  category: CategoryBrief
}

export interface Paginated<T> {
  count: number
  num_pages: number
  page: number
  page_size: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface User {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  full_name: string
  phone: string
  marketing_opt_in: boolean
  is_staff: boolean
  date_joined: string
}

export interface TokenResponse {
  access: string
  refresh: string
  user: User
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface OrderItem {
  id: number
  product: number | null
  product_name: string
  product_slug: string
  image_url: string
  unit_price: number
  quantity: number
  line_total: number
}

export interface ShippingAddress {
  full_name: string
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  postal_code: string
  country: string
}

export interface Order {
  number: string
  status: OrderStatus
  status_label: string
  email: string
  items: OrderItem[]
  item_count: number
  subtotal: number
  shipping_cost: number
  tax: number
  total: number
  shipping_address: ShippingAddress
  payment_method: 'card' | 'cod'
  payment_reference: string
  notes: string
  created_at: string
  updated_at: string
  customer_name?: string
}

export interface QuoteLine {
  product_id: number
  name: string
  slug: string
  unit_price: number
  quantity: number
  line_total: number
  available: number
  in_stock: boolean
  image_url: string
}

export interface Quote {
  subtotal: number
  shipping_cost: number
  tax: number
  total: number
  free_shipping_threshold: number
  amount_to_free_shipping: number
  items: QuoteLine[]
  item_count: number
}

export interface AdminProduct {
  id: number
  name: string
  slug: string
  sku: string
  summary: string
  description: string
  highlights: string[]
  price: string
  compare_at_price: string | null
  stock: number
  is_active: boolean
  is_featured: boolean
  image_url: string
  category: CategoryBrief
  created_at: string
  updated_at: string
}

export interface SalesPoint {
  date: string
  revenue: number
  orders: number
}

export interface Stats {
  revenue_total: number
  revenue_30d: number
  average_order_value: number
  orders_total: number
  orders_open: number
  customers_total: number
  products_total: number
  products_active: number
  low_stock_count: number
  status_breakdown: { status: OrderStatus; label: string; count: number }[]
  sales_series: SalesPoint[]
  top_products: { name: string; slug: string; units: number; revenue: number }[]
  low_stock: { id: number; name: string; slug: string; stock: number }[]
  recent_orders: Order[]
}

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
]

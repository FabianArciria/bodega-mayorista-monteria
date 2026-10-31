export type UserRole = 'admin' | 'worker' | 'client';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  company_name?: string | null;
  nit_rut?: string | null;
  city: string;
  department: string;
  role: UserRole;
  assigned_zone_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Zone {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon: string;
  color_gradient?: string | null;
  banner_url?: string | null;
  logo_url?: string | null;         // Logo propio de la zona
  contact_phone?: string | null;     // Celular de WhatsApp específico del encargado
  manager_name?: string | null;      // Nombre del trabajador encargado de la zona
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

export interface Category {
  id: string;
  zone_id: string;
  name: string;
  slug: string;
  description?: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  zone_id: string;
  category_id?: string | null;
  sku?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  wholesale_price: number;
  suggested_retail_price?: number | null;
  min_order_quantity: number;
  stock_quantity: number;
  is_available: boolean;
  featured: boolean;
  images: string[];
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Joined relation fields
  zone?: Zone;
  category?: Category;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  product_name: string;
  product_sku?: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
  image?: string;
}

export interface Order {
  id: string;
  order_number: number;
  client_id?: string | null;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  total: number;
  items_count: number;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_department: string;
  notes?: string | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  client?: Profile;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

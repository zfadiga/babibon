export type CandyCategory =
  | 'all'
  | 'sour'
  | 'gummy'
  | 'chocolate'
  | 'lollipop'
  | 'marshmallow'
  | 'fruity'
  | string;

export interface CandyProduct {
  id: string | number;
  name: string;
  description: string;
  price: number; // Stored in FCFA as base currency (or standard price)
  category: CandyCategory;
  flavorBadge?: string;
  badgeColor?: string; // Tailwind color classes for the pill/badge
  imageUrl?: string;
  image_url?: string; // Database & admin compatibility
  gradientBg?: string; // Resilient fallback background
  emojiIcon?: string;
  isPopular?: boolean;
  isNew?: boolean;
  stock?: number;
  weightGrams?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  candy: CandyProduct;
  quantity: number;
}

export interface ChildUser {
  id: string;
  username: string;
  password?: string;
  firstName: string;
  avatar: string;
  avatarBg: string;
  favoriteFlavor?: string;
  joinedAt: string;
  phone?: string;
  deliveryAddress?: string;
}

export type ManagerRole = 'primary' | 'backup';

export interface ManagerAccount {
  id: string; // 'primary' | 'backup'
  username: string; // e.g. 'admin' or 'secours'
  name: string; // e.g. 'Gérant Principal' or 'Gérant de Secours'
  role: ManagerRole;
  password: string;
  createdAt: string;
  lastLogin?: string;
}

export interface StoreSettings {
  storeName: string;
  whatsappNumber: string; // e.g. '2250779323716'
  currency: 'FCFA' | 'EUR';
  eurToFcfaRate: number; // Default: 655.957
  adminPassword: string;
  managers: ManagerAccount[];
  freeDeliveryThreshold: number; // e.g. 4000 FCFA
  deliveryFee: number; // e.g. 500 FCFA
  storeNotice?: string;
}

export interface OrderItemRecord {
  id?: string | number;
  candy_id?: string | number;
  candy_name?: string;
  name?: string;
  quantity: number;
  price: number;
}

export interface OrderRecord {
  id: string | number;
  createdAt?: string;
  created_at?: string;
  childName?: string;
  childUsername?: string;
  customer_name?: string;
  customer_email?: string;
  childId?: string;
  items: OrderItemRecord[];
  totalAmount?: number;
  total_amount?: number;
  currency?: 'FCFA' | 'EUR' | string;
  customerPhone?: string;
  deliveryAddress?: string;
  notes?: string;
  status?: 'pending' | 'preparing' | 'processing' | 'delivering' | 'completed' | 'cancelled' | string;
}

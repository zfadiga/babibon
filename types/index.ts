export * from './candy';

// Admin-specific aliases & types
export type Candy = {
  id: string | number;
  name: string;
  price: number;
  description: string;
  image_url: string;
  imageUrl?: string;
  stock: number;
  category: string;
  flavorBadge?: string;
  badgeColor?: string;
  gradientBg?: string;
  emojiIcon?: string;
  created_at?: string;
  updated_at?: string;
};

export type OrderItem = {
  id?: string | number;
  candy_id?: string | number;
  candy_name?: string;
  name?: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: string | number;
  customer_name?: string;
  customer_email?: string;
  childName?: string;
  total_amount: number;
  totalAmount?: number;
  status: 'pending' | 'processing' | 'preparing' | 'delivering' | 'completed' | 'cancelled' | string;
  items?: OrderItem[];
  created_at: string;
  createdAt?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  notes?: string;
};

export interface UserProfile {
  id: string;
  username?: string;
  email?: string;
  role: 'admin' | 'customer' | string;
  created_at?: string;
}

export interface NewCandyPayload {
  name: string;
  price: number;
  description: string;
  image_url: string;
  stock: number;
  category: string;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'customer';
}

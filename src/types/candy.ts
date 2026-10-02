export type CandyCategory = 
  | 'all'
  | 'sour'
  | 'gummy'
  | 'chocolate'
  | 'lollipop'
  | 'marshmallow'
  | 'fruity';

export interface CandyProduct {
  id: string;
  name: string;
  description: string;
  price: number; // Stored in FCFA as base currency
  category: 'sour' | 'gummy' | 'chocolate' | 'lollipop' | 'marshmallow' | 'fruity';
  flavorBadge: string;
  badgeColor: string; // Tailwind color classes for the pill/badge
  imageUrl: string;
  gradientBg: string; // Resilient fallback background
  emojiIcon: string;
  isPopular?: boolean;
  isNew?: boolean;
  stock?: number;
  weightGrams?: number;
}

export interface CartItem {
  candy: CandyProduct;
  quantity: number;
}

export interface ChildUser {
  id: string;
  username: string;
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
  role: ManagerRole; // 'primary' (full rights) | 'backup' (backup rights)
  password: string;
  createdAt: string;
  lastLogin?: string;
}

export interface StoreSettings {
  storeName: string;
  whatsappNumber: string; // E.g. '2250701020304' or international digits without '+'
  currency: 'FCFA' | 'EUR';
  eurToFcfaRate: number; // Default: 655.957
  adminPassword: string; // Legacy fallback
  managers: ManagerAccount[]; // Strictly max 2 accounts: 1 primary + 1 backup
  freeDeliveryThreshold: number; // e.g. 5000 FCFA
  deliveryFee: number; // e.g. 1000 FCFA
  storeNotice?: string;
}

export interface OrderRecord {
  id: string;
  createdAt: string;
  childName: string;
  childId?: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  currency: 'FCFA' | 'EUR';
  customerPhone?: string;
  deliveryAddress: string;
  notes?: string;
  status?: 'pending' | 'preparing' | 'delivering' | 'completed';
}

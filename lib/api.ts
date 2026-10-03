import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Candy, NewCandyPayload, Order, CreateUserPayload } from '@/types';
import { DEFAULT_CANDIES, INITIAL_MOCK_ORDERS, DEFAULT_STORE_SETTINGS } from '@/data/defaultCandies';
import { CandyProduct, OrderRecord, StoreSettings } from '@/types/candy';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

/**
 * Image helper: Uploads to Supabase storage if connected, or converts to Base64 data URL
 */
export async function uploadCandyImage(file: File): Promise<string> {
  if (isSupabaseConfigured) {
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('candies')
        .upload(cleanFileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from('candies')
          .getPublicUrl(cleanFileName);
        if (publicData?.publicUrl) {
          return publicData.publicUrl;
        }
      }
    } catch (storageErr) {
      console.warn('Supabase storage fallback to data URL:', storageErr);
    }
  }

  // Base64 fallback
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Memory & LocalStorage Cache Helpers
function getStoredCandies(): Candy[] {
  if (typeof window === 'undefined') return DEFAULT_CANDIES as unknown as Candy[];
  try {
    const saved = localStorage.getItem('bonbon_catalog');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c: any) => ({
          ...c,
          image_url: c.image_url || c.imageUrl || '',
          imageUrl: c.imageUrl || c.image_url || '',
        }));
      }
    }
  } catch {}
  return DEFAULT_CANDIES as unknown as Candy[];
}

function saveStoredCandies(candies: Candy[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('bonbon_catalog', JSON.stringify(candies));
  } catch {}
}

function getStoredOrders(): Order[] {
  if (typeof window === 'undefined') return INITIAL_MOCK_ORDERS as unknown as Order[];
  try {
    const saved = localStorage.getItem('bonbon_orders');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_MOCK_ORDERS as unknown as Order[];
}

function saveStoredOrders(orders: Order[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('bonbon_orders', JSON.stringify(orders));
  } catch {}
}

async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
}

/**
 * Fetch candies (attempts Supabase/backend, falls back smoothly to localStorage/mock)
 */
export async function fetchCandies(): Promise<Candy[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('candies')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((c: any) => ({
          ...c,
          image_url: c.image_url || c.imageUrl || '',
          imageUrl: c.imageUrl || c.image_url || '',
        }));
      }
    } catch (e) {
      console.warn('Supabase candies fetch error:', e);
    }
  }

  // Fallback to local storage or defaults
  return getStoredCandies();
}

/**
 * Create a new candy product
 */
export async function createCandy(payload: NewCandyPayload): Promise<Candy> {
  const newCandy: Candy = {
    id: `candy-${Date.now()}`,
    name: payload.name,
    price: payload.price,
    description: payload.description,
    image_url: payload.image_url,
    imageUrl: payload.image_url,
    stock: payload.stock,
    category: payload.category,
    flavorBadge: `${payload.category.split(' ')[0]} ✨`,
    badgeColor: 'bg-pink-100 text-pink-800 border-pink-200',
    emojiIcon: '🍬',
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('candies')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        return {
          ...data,
          imageUrl: data.image_url,
        };
      }
    } catch (e) {
      console.warn('Supabase createCandy error:', e);
    }
  }

  // Fallback / local sync
  const current = getStoredCandies();
  const updated = [newCandy, ...current];
  saveStoredCandies(updated);
  return newCandy;
}

/**
 * Delete a candy by ID
 */
export async function deleteCandy(id: string | number): Promise<{ success: boolean; message?: string }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('candies').delete().eq('id', id);
      if (!error) return { success: true };
    } catch (e) {
      console.warn('Supabase deleteCandy error:', e);
    }
  }

  const current = getStoredCandies();
  const updated = current.filter((c) => String(c.id) !== String(id));
  saveStoredCandies(updated);
  return { success: true };
}

/**
 * Fetch customer orders
 */
export async function fetchOrders(): Promise<Order[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('Supabase fetchOrders error:', e);
    }
  }

  return getStoredOrders();
}

/**
 * Save new order record (from client store or admin)
 */
export async function submitOrder(order: OrderRecord): Promise<{ success: boolean; order: OrderRecord }> {
  const normalizedOrder: OrderRecord = {
    ...order,
    id: order.id || `CMD-${Date.now().toString().slice(-6)}`,
    createdAt: order.createdAt || new Date().toISOString(),
    created_at: order.created_at || order.createdAt || new Date().toISOString(),
    totalAmount: order.totalAmount ?? order.total_amount ?? 0,
    total_amount: order.total_amount ?? order.totalAmount ?? 0,
    customer_name: order.customer_name || order.childName,
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('orders').insert([{
        customer_name: normalizedOrder.customer_name,
        customer_phone: normalizedOrder.customerPhone,
        delivery_address: normalizedOrder.deliveryAddress,
        total_amount: normalizedOrder.total_amount,
        status: normalizedOrder.status || 'pending',
        notes: normalizedOrder.notes,
      }]).select().single();

      if (!error && data) {
        return { success: true, order: { ...normalizedOrder, id: data.id } };
      }
    } catch (e) {
      console.warn('Supabase submitOrder error:', e);
    }
  }

  // Local storage persistence
  const current = getStoredOrders() as unknown as OrderRecord[];
  const updated = [normalizedOrder, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem('bonbon_orders', JSON.stringify(updated));
  }

  return { success: true, order: normalizedOrder };
}

/**
 * Admin action: create new user
 */
export async function createNewUser(payload: CreateUserPayload): Promise<{ success: boolean; message?: string; user?: any }> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: { role: payload.role },
        },
      });

      if (error) throw error;
      return { success: true, user: data.user };
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create user in Supabase');
    }
  }

  // Mock mode user simulation
  return {
    success: true,
    message: `(Mock Mode) Compte utilisateur simulé créé avec succès pour ${payload.email} (${payload.role}).`,
    user: { email: payload.email, role: payload.role, id: `mock-${Date.now()}` },
  };
}

/**
 * Supabase Auth: Sign In with Email & Password
 */
export async function supabaseSignIn(email: string, password: string) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Supabase Auth: Sign Up with Email, Password & Profile Metadata
 */
export async function supabaseSignUp(email: string, password: string, metadata?: Record<string, any>) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata || {},
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Supabase Auth: Sign Out
 */
export async function supabaseSignOut() {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
}


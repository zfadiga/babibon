import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Candy, NewCandyPayload, Order, CreateUserPayload, UserProfile } from '@/types';
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
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('bonbon_orders');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter(
          (o: any) => !['CMD-9042', 'CMD-9043', 'CMD-9044'].includes(String(o?.id))
        );
        if (filtered.length !== parsed.length) {
          localStorage.setItem('bonbon_orders', JSON.stringify(filtered));
        }
        return filtered;
      }
    }
  } catch {}
  return [];
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

      if (!error && data) {
        return data.map((o: any) => ({
          ...o,
          customer_name: o.customer_name || o.childName || 'Client',
          childName: o.customer_name || o.childName || 'Client',
          customerPhone: o.customer_phone || o.customerPhone,
          customer_phone: o.customer_phone || o.customerPhone,
          deliveryAddress: o.delivery_address || o.deliveryAddress,
          delivery_address: o.delivery_address || o.deliveryAddress,
          totalAmount: Number(o.total_amount ?? o.totalAmount ?? 0),
          total_amount: Number(o.total_amount ?? o.totalAmount ?? 0),
          image_url: o.image_url || o.imageUrl || o.media_url || o.mediaUrl || null,
          imageUrl: o.image_url || o.imageUrl || o.media_url || o.mediaUrl || null,
          media_url: o.media_url || o.mediaUrl || o.image_url || o.imageUrl || null,
          mediaUrl: o.media_url || o.mediaUrl || o.image_url || o.imageUrl || null,
        }));
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
  const generatedId = order.id ? String(order.id) : `CMD-${Math.floor(100000 + Math.random() * 900000)}`;
  const normalizedOrder: OrderRecord = {
    ...order,
    id: generatedId,
    createdAt: order.createdAt || new Date().toISOString(),
    created_at: order.created_at || order.createdAt || new Date().toISOString(),
    totalAmount: order.totalAmount ?? order.total_amount ?? 0,
    total_amount: order.total_amount ?? order.totalAmount ?? 0,
    customer_name: order.customer_name || order.childName,
  };

  if (isSupabaseConfigured) {
    try {
      const isUuid =
        typeof order.childId === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.childId);

      const orderPayload: any = {
        id: generatedId,
        customer_name: normalizedOrder.customer_name || 'Client',
        customer_phone: normalizedOrder.customerPhone || null,
        delivery_address: normalizedOrder.deliveryAddress || null,
        total_amount: normalizedOrder.total_amount,
        currency: normalizedOrder.currency || 'FCFA',
        status: normalizedOrder.status || 'pending',
        notes: normalizedOrder.notes || null,
        image_url: normalizedOrder.imageUrl || normalizedOrder.image_url || null,
        media_url: normalizedOrder.mediaUrl || normalizedOrder.media_url || null,
      };

      if (isUuid) {
        orderPayload.user_id = order.childId;
      }

      const { data, error } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (!error && data) {
        // Also persist order items to order_items table in Supabase
        if (order.items && order.items.length > 0) {
          const itemsPayload = order.items.map((it) => ({
            order_id: data.id,
            candy_name: it.name || it.candy_name || 'Friandise',
            candy_id: it.candy_id ? String(it.candy_id) : null,
            quantity: it.quantity || 1,
            price: it.price || 0,
            price_at_purchase: it.price || 0,
          }));
          await supabase.from('order_items').insert(itemsPayload);
        }

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
 * Update order status (Supabase + localStorage fallback)
 */
export async function updateOrderStatus(
  orderId: string | number,
  status: string
): Promise<{ success: boolean; message?: string }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) {
        console.warn('Supabase updateOrderStatus error:', error);
        return { success: false, message: error.message };
      }
    } catch (e: any) {
      console.warn('Supabase updateOrderStatus exception:', e);
      return { success: false, message: e.message || 'Erreur réseau Supabase' };
    }
  }

  // Update in localStorage
  if (typeof window !== 'undefined') {
    try {
      const current = getStoredOrders();
      const updated = current.map((order) =>
        String(order.id) === String(orderId) ? { ...order, status } : order
      );
      saveStoredOrders(updated);
    } catch (e) {
      console.warn('localStorage updateOrderStatus error:', e);
    }
  }

  return { success: true };
}

/**
 * Cancel an order (client user action)
 */
export async function cancelUserOrder(
  orderId: string | number
): Promise<{ success: boolean; message?: string }> {
  return updateOrderStatus(orderId, 'cancelled');
}

/**
 * Delete an order by ID (Supabase + localStorage fallback)
 */
export async function deleteOrder(
  orderId: string | number
): Promise<{ success: boolean; message?: string }> {
  if (isSupabaseConfigured) {
    try {
      // Delete child order_items if foreign key relationship exists
      try {
        await supabase.from('order_items').delete().eq('order_id', orderId);
      } catch (itemErr) {
        console.warn('order_items cascade delete notice:', itemErr);
      }

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        console.warn('Supabase deleteOrder error:', error);
      }
    } catch (e) {
      console.warn('Supabase deleteOrder exception:', e);
    }
  }

  // Remove from localStorage
  if (typeof window !== 'undefined') {
    try {
      const current = getStoredOrders();
      const updated = current.filter(
        (order) => String(order.id) !== String(orderId)
      );
      saveStoredOrders(updated);
    } catch (e) {
      console.warn('localStorage deleteOrder error:', e);
    }
  }

  return { success: true };
}

/**
 * Admin action: create new user
 */
/**
 * Image helper: Uploads order photo (delivery landmark, receipt, gift note) to Supabase storage
 */
export async function uploadOrderImage(file: File): Promise<string> {
  if (isSupabaseConfigured) {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const cleanFileName = `order-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('order-media')
        .upload(cleanFileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from('order-media')
          .getPublicUrl(cleanFileName);
        if (publicData?.publicUrl) {
          return publicData.publicUrl;
        }
      }
    } catch (storageErr) {
      console.warn('Supabase order-media storage fallback:', storageErr);
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

/**
 * Fetch all registered users and admins from Supabase profiles table
 */
export async function fetchProfiles(): Promise<UserProfile[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as UserProfile[];
      }
    } catch (e) {
      console.warn('Supabase fetchProfiles error:', e);
    }
  }

  // Fallback to local storage registered users
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('bonbon_registered_users');
      if (stored) {
        const users = JSON.parse(stored);
        return users.map((u: any) => ({
          id: u.id,
          username: u.username,
          full_name: u.firstName || u.username,
          email: u.email || `${u.username}@babibon.local`,
          role: 'client',
          created_at: u.joinedAt || new Date().toISOString(),
        }));
      }
    } catch {}
  }
  return [];
}

/**
 * Delete a profile from Supabase
 */
export async function deleteUserProfile(id: string): Promise<{ success: boolean; message?: string }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) {
        return { success: false, message: error.message };
      }
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // Also remove from localStorage if present
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('bonbon_registered_users');
      if (stored) {
        const users = JSON.parse(stored);
        const filtered = users.filter((u: any) => u.id !== id);
        localStorage.setItem('bonbon_registered_users', JSON.stringify(filtered));
      }
    } catch {}
  }

  return { success: true };
}

/**
 * Admin action: create new user (Client or Admin) in Supabase
 */
export async function createNewUser(payload: CreateUserPayload): Promise<{ success: boolean; message?: string; user?: any }> {
  if (isSupabaseConfigured) {
    try {
      const role = payload.role === 'admin' ? 'admin' : 'client';
      const { data, error } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: {
            username: payload.username,
            role,
            full_name: payload.username,
          },
        },
      });

      if (error) throw error;

      // Upsert profile in Supabase profiles table
      if (data.user?.id) {
        try {
          await supabase.from('profiles').upsert([
            {
              id: data.user.id,
              username: payload.username,
              email: payload.email,
              full_name: payload.username,
              role,
            },
          ]);
        } catch (pErr) {
          console.warn('Profile table insert notice:', pErr);
        }
      }

      return { success: true, user: data.user };
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create user in Supabase');
    }
  }

  // Mock mode user simulation
  return {
    success: true,
    message: `(Mode Démo) Compte créé avec succès pour @${payload.username} (${payload.email} - ${payload.role}).`,
    user: { username: payload.username, email: payload.email, role: payload.role, id: `mock-${Date.now()}` },
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


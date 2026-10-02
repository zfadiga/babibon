import { CandyProduct, OrderRecord, StoreSettings, ManagerAccount } from '../types/candy';
import { DEFAULT_CANDIES, DEFAULT_STORE_SETTINGS, DEFAULT_MANAGERS } from '../data/defaultCandies';
import { getSupabaseFrontendClient, isFrontendSupabaseConfigured } from '../lib/supabase';

// Base API URL from environment or default to local proxy
const API_URL = ((import.meta as any).env?.VITE_API_URL || '/api').replace(/\/$/, '');

export interface BackendStatus {
  isBackendReachable: boolean;
  isSupabaseConnected: boolean;
  backendUrl: string;
}

// Check Backend and Supabase connectivity
export async function checkBackendStatus(): Promise<BackendStatus> {
  let isBackendReachable = false;
  let isSupabaseConnected = isFrontendSupabaseConfigured();

  try {
    const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      isBackendReachable = true;
      if (data.supabaseConnected !== undefined) {
        isSupabaseConnected = data.supabaseConnected || isSupabaseConnected;
      }
    }
  } catch {
    // Backend offline or running purely static
    isBackendReachable = false;
  }

  return {
    isBackendReachable,
    isSupabaseConnected,
    backendUrl: API_URL,
  };
}

// ==========================================
// 1. Manager Authentication
// ==========================================
export async function authenticateManager(
  username: string,
  pass: string,
  localSettings: StoreSettings
): Promise<{ success: boolean; manager?: ManagerAccount; error?: string }> {
  // 1. Try Express Backend
  try {
    const res = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: pass }),
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, manager: data.manager };
    }
  } catch {
    // Backend unreachable, fallback to local settings
  }

  // 2. Fallback to Local Settings / Default Managers
  const managers = localSettings.managers || DEFAULT_MANAGERS;
  const match = managers.find(
    (m) =>
      m.username.toLowerCase() === username.trim().toLowerCase() &&
      m.password === pass.trim()
  );

  if (match) {
    return { success: true, manager: match };
  }

  // Legacy fallback if single password matched
  if (localSettings.adminPassword && pass.trim() === localSettings.adminPassword.trim()) {
    return {
      success: true,
      manager: {
        id: 'primary',
        username: username || 'admin',
        name: 'Gérant Principal',
        role: 'primary',
        password: pass,
        createdAt: new Date().toISOString(),
      },
    };
  }

  return { success: false, error: 'Identifiant ou mot de passe incorrect' };
}

// ==========================================
// 2. Candies (Catalogue)
// ==========================================
export async function apiFetchCandies(): Promise<CandyProduct[]> {
  // 1. Try Express Backend
  try {
    const res = await fetch(`${API_URL}/candies`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Continue to Supabase / Local
  }

  // 2. Try direct Supabase
  const supabase = getSupabaseFrontendClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('candies').select('*').order('name');
      if (!error && data && data.length > 0) {
        return data.map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description || '',
          price: Number(row.price),
          category: row.category,
          flavorBadge: row.flavor_badge || '',
          badgeColor: row.badge_color || 'bg-pink-100 text-pink-800 border-pink-200',
          imageUrl: row.image_url || '',
          gradientBg: row.gradient_bg || 'from-pink-200 via-rose-100 to-amber-100',
          emojiIcon: row.emoji_icon || '🍬',
          isPopular: Boolean(row.is_popular),
          isNew: Boolean(row.is_new),
          stock: Number(row.stock || 50),
          weightGrams: Number(row.weight_grams || 100),
        }));
      }
    } catch (e) {
      console.warn('Supabase fetch candies failed:', e);
    }
  }

  // 3. Fallback to localStorage or defaults
  try {
    const saved = localStorage.getItem('bonbon_catalog');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  return DEFAULT_CANDIES;
}

export async function apiSaveCandy(candy: CandyProduct, isEdit: boolean): Promise<CandyProduct> {
  // 1. Try Express Backend
  try {
    const url = isEdit ? `${API_URL}/candies/${candy.id}` : `${API_URL}/candies`;
    const method = isEdit ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candy),
      signal: AbortSignal.timeout(4000),
    });
  } catch {}

  // 2. Try Supabase direct
  const supabase = getSupabaseFrontendClient();
  if (supabase) {
    try {
      const row = {
        id: candy.id,
        name: candy.name,
        description: candy.description,
        price: candy.price,
        category: candy.category,
        flavor_badge: candy.flavorBadge,
        badge_color: candy.badgeColor,
        image_url: candy.imageUrl,
        gradient_bg: candy.gradientBg,
        emoji_icon: candy.emojiIcon,
        is_popular: candy.isPopular,
        is_new: candy.isNew,
        stock: candy.stock,
        weight_grams: candy.weightGrams,
        updated_at: new Date().toISOString(),
      };
      await supabase.from('candies').upsert(row, { onConflict: 'id' });
    } catch (e) {
      console.warn('Supabase save candy failed:', e);
    }
  }

  return candy;
}

export async function apiDeleteCandy(candyId: string): Promise<boolean> {
  // 1. Backend
  try {
    await fetch(`${API_URL}/candies/${candyId}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(4000),
    });
  } catch {}

  // 2. Supabase
  const supabase = getSupabaseFrontendClient();
  if (supabase) {
    try {
      await supabase.from('candies').delete().eq('id', candyId);
    } catch {}
  }

  return true;
}

// ==========================================
// 3. Orders (Commandes)
// ==========================================
export async function apiFetchOrders(): Promise<OrderRecord[]> {
  // 1. Backend
  try {
    const res = await fetch(`${API_URL}/orders`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}

  // 2. Supabase
  const supabase = getSupabaseFrontendClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data.map((r) => ({
          id: r.id,
          createdAt: r.created_at,
          childName: r.child_name,
          childId: r.child_id,
          items: r.items || [],
          totalAmount: Number(r.total_amount),
          currency: r.currency || 'FCFA',
          customerPhone: r.customer_phone,
          deliveryAddress: r.delivery_address,
          notes: r.notes,
          status: r.status || 'pending',
        }));
      }
    } catch {}
  }

  // 3. localStorage fallback
  try {
    const saved = localStorage.getItem('bonbon_orders');
    if (saved) return JSON.parse(saved);
  } catch {}

  return [];
}

export async function apiCreateOrder(order: OrderRecord): Promise<OrderRecord> {
  // 1. Backend
  try {
    await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
      signal: AbortSignal.timeout(4000),
    });
  } catch {}

  // 2. Supabase
  const supabase = getSupabaseFrontendClient();
  if (supabase) {
    try {
      const row = {
        id: order.id,
        created_at: order.createdAt,
        child_name: order.childName,
        child_id: order.childId,
        items: order.items,
        total_amount: order.totalAmount,
        currency: order.currency,
        customer_phone: order.customerPhone,
        delivery_address: order.deliveryAddress,
        notes: order.notes,
        status: order.status,
      };
      await supabase.from('orders').insert([row]);
    } catch {}
  }

  return order;
}

export async function apiUpdateOrderStatus(orderId: string, status: OrderRecord['status']): Promise<boolean> {
  // 1. Backend
  try {
    await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {}

  // 2. Supabase
  const supabase = getSupabaseFrontendClient();
  if (supabase) {
    try {
      await supabase.from('orders').update({ status }).eq('id', orderId);
    } catch {}
  }

  return true;
}

export async function apiDeleteOrder(orderId: string): Promise<boolean> {
  // 1. Backend
  try {
    await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(4000),
    });
  } catch {}

  // 2. Supabase
  const supabase = getSupabaseFrontendClient();
  if (supabase) {
    try {
      await supabase.from('orders').delete().eq('id', orderId);
    } catch {}
  }

  return true;
}

// ==========================================
// 4. Store Settings
// ==========================================
export async function apiFetchSettings(): Promise<StoreSettings> {
  // 1. Backend
  try {
    const res = await fetch(`${API_URL}/settings`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.storeName) return data;
    }
  } catch {}

  // 2. Supabase
  const supabase = getSupabaseFrontendClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (!error && data) {
        return {
          storeName: data.store_name,
          whatsappNumber: data.whatsapp_number,
          currency: data.currency,
          eurToFcfaRate: Number(data.eur_to_fcfa_rate),
          adminPassword: data.admin_password,
          managers: data.managers || DEFAULT_MANAGERS,
          freeDeliveryThreshold: Number(data.free_delivery_threshold),
          deliveryFee: Number(data.delivery_fee),
          storeNotice: data.store_notice,
        };
      }
    } catch {}
  }

  // 3. localStorage fallback
  try {
    const saved = localStorage.getItem('bonbon_settings');
    if (saved) return JSON.parse(saved);
  } catch {}

  return DEFAULT_STORE_SETTINGS;
}

export async function apiSaveSettings(settings: StoreSettings): Promise<StoreSettings> {
  // 1. Backend
  try {
    await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
      signal: AbortSignal.timeout(4000),
    });
  } catch {}

  // 2. Supabase
  const supabase = getSupabaseFrontendClient();
  if (supabase) {
    try {
      const row = {
        id: 'default',
        store_name: settings.storeName,
        whatsapp_number: settings.whatsappNumber,
        currency: settings.currency,
        eur_to_fcfa_rate: settings.eurToFcfaRate,
        admin_password: settings.adminPassword,
        managers: settings.managers,
        free_delivery_threshold: settings.freeDeliveryThreshold,
        delivery_fee: settings.deliveryFee,
        store_notice: settings.storeNotice,
        updated_at: new Date().toISOString(),
      };
      await supabase.from('store_settings').upsert(row, { onConflict: 'id' });
    } catch {}
  }

  return settings;
}

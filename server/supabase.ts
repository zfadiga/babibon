import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    console.log('✅ Supabase client initialisé avec succès :', supabaseUrl);
  } catch (err) {
    console.warn('⚠️ Impossible d’initialiser le client Supabase :', err);
    supabase = null;
  }
} else {
  console.log('ℹ️ Supabase non configuré dans .env. Le backend utilisera le stockage en mémoire.');
}

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

export function getSupabase(): SupabaseClient | null {
  return supabase;
}

// Convert DB row (snake_case) to Frontend Candy (camelCase)
export function mapCandyRowToModel(row: any) {
  return {
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
    stock: row.stock !== undefined ? Number(row.stock) : 50,
    weightGrams: row.weight_grams !== undefined ? Number(row.weight_grams) : 100,
  };
}

// Convert Frontend Candy (camelCase) to DB row (snake_case)
export function mapModelToCandyRow(c: any) {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    price: c.price,
    category: c.category,
    flavor_badge: c.flavorBadge,
    badge_color: c.badgeColor,
    image_url: c.imageUrl,
    gradient_bg: c.gradientBg,
    emoji_icon: c.emojiIcon,
    is_popular: c.isPopular,
    is_new: c.isNew,
    stock: c.stock,
    weight_grams: c.weightGrams,
    updated_at: new Date().toISOString(),
  };
}

// Map Order DB row to Model
export function mapOrderRowToModel(row: any) {
  return {
    id: row.id,
    createdAt: row.created_at,
    childName: row.child_name,
    childId: row.child_id,
    items: row.items || [],
    totalAmount: Number(row.total_amount),
    currency: row.currency || 'FCFA',
    customerPhone: row.customer_phone,
    deliveryAddress: row.delivery_address,
    notes: row.notes,
    status: row.status || 'pending',
  };
}

// Map Order Model to DB row
export function mapModelToOrderRow(o: any) {
  return {
    id: o.id,
    created_at: o.createdAt || new Date().toISOString(),
    child_name: o.childName,
    child_id: o.childId,
    items: o.items || [],
    total_amount: o.totalAmount,
    currency: o.currency || 'FCFA',
    customer_phone: o.customerPhone,
    delivery_address: o.deliveryAddress,
    notes: o.notes,
    status: o.status || 'pending',
  };
}

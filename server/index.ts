import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import {
  getSupabase,
  isSupabaseConfigured,
  mapCandyRowToModel,
  mapModelToCandyRow,
  mapOrderRowToModel,
  mapModelToOrderRow,
} from './supabase';
import {
  DEFAULT_CANDIES,
  DEFAULT_STORE_SETTINGS,
  DEFAULT_MANAGERS,
} from '../src/data/defaultCandies';
import { CandyProduct, OrderRecord, StoreSettings } from '../src/types/candy';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// In-Memory Fallback State (if Supabase is not yet connected or configured)
let memoryCandies: CandyProduct[] = [...DEFAULT_CANDIES];
let memoryOrders: OrderRecord[] = [];
let memorySettings: StoreSettings = { ...DEFAULT_STORE_SETTINGS };

// ==========================================
// 1. Health & Status
// ==========================================
app.get('/api/health', (req: Request, res: Response) => {
  const supabase = getSupabase();
  res.json({
    status: 'ok',
    message: 'Express backend pour Babibonbon est en ligne 🍭',
    supabaseConnected: isSupabaseConfigured(),
    supabaseUrl: process.env.SUPABASE_URL || null,
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// 2. Authentication (Gérants)
// ==========================================
app.post('/api/admin/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Identifiant et mot de passe requis' });
  }

  try {
    let managers = memorySettings.managers || DEFAULT_MANAGERS;
    const supabase = getSupabase();

    if (supabase) {
      const { data, error } = await supabase
        .from('store_settings')
        .select('managers, admin_password')
        .eq('id', 'default')
        .maybeSingle();

      if (!error && data) {
        if (data.managers && Array.isArray(data.managers)) {
          managers = data.managers;
        }
      }
    }

    const foundManager = managers.find(
      (m) =>
        m.username.toLowerCase() === username.trim().toLowerCase() &&
        m.password === password.trim()
    );

    if (foundManager) {
      return res.json({
        success: true,
        manager: {
          id: foundManager.id,
          username: foundManager.username,
          name: foundManager.name,
          role: foundManager.role,
        },
        token: `session_${foundManager.id}_${Date.now()}`,
      });
    }

    return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' });
  } catch (error: any) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// ==========================================
// 3. Candies CRUD (Catalogue Bonbons)
// ==========================================
app.get(['/api/candies', '/api/admin/candies'], async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('candies')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped = data.map(mapCandyRowToModel);
        return res.json(mapped);
      }
    }
    // Fallback to memory
    res.json(memoryCandies);
  } catch (error: any) {
    console.error('Erreur get candies:', error);
    res.json(memoryCandies);
  }
});

app.post(['/api/candies', '/api/admin/candies'], async (req: Request, res: Response) => {
  try {
    const newCandy: CandyProduct = {
      id: req.body.id || `candy-${Date.now()}`,
      name: req.body.name,
      description: req.body.description || '',
      price: Number(req.body.price) || 500,
      stock: req.body.stock !== undefined ? Number(req.body.stock) : 50,
      category: req.body.category || 'gummy',
      imageUrl: req.body.image_url || req.body.imageUrl || 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=600&q=80',
      weightGrams: req.body.weight_grams !== undefined ? Number(req.body.weight_grams) : (req.body.weightGrams || 100),
      flavorBadge: req.body.flavor_badge || req.body.flavorBadge || 'Gourmandise 🍬',
      badgeColor: req.body.badge_color || req.body.badgeColor || 'bg-pink-100 text-pink-800 border-pink-200',
      gradientBg: req.body.gradient_bg || req.body.gradientBg || 'from-pink-200 via-rose-100 to-amber-100',
      emojiIcon: req.body.emoji_icon || req.body.emojiIcon || '🍬',
      isPopular: Boolean(req.body.is_popular !== undefined ? req.body.is_popular : req.body.isPopular),
      isNew: Boolean(req.body.is_new !== undefined ? req.body.is_new : req.body.isNew),
    };

    const supabase = getSupabase();
    if (supabase) {
      const row = mapModelToCandyRow(newCandy);
      const { error } = await supabase.from('candies').insert([row]);
      if (error) {
        console.error('Erreur insert Supabase:', error);
      }
    }

    // Always keep memory updated
    memoryCandies = [newCandy, ...memoryCandies.filter((c) => c.id !== newCandy.id)];
    res.status(201).json(newCandy);
  } catch (error: any) {
    console.error('Erreur create candy:', error);
    res.status(500).json({ error: 'Impossible de créer le bonbon' });
  }
});

app.put(['/api/candies/:id', '/api/admin/candies/:id'], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedData: Partial<CandyProduct> = {
      ...req.body,
      imageUrl: req.body.image_url || req.body.imageUrl,
    };

    const supabase = getSupabase();
    if (supabase) {
      const row = mapModelToCandyRow({ id, ...updatedData });
      const { error } = await supabase.from('candies').update(row).eq('id', id);
      if (error) {
        console.error('Erreur update Supabase:', error);
      }
    }

    memoryCandies = memoryCandies.map((c) => (c.id === id ? { ...c, ...updatedData } : c));
    const updated = memoryCandies.find((c) => c.id === id);
    res.json(updated);
  } catch (error: any) {
    console.error('Erreur update candy:', error);
    res.status(500).json({ error: 'Impossible de mettre à jour le bonbon' });
  }
});

app.delete(['/api/candies/:id', '/api/admin/candies/:id'], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('candies').delete().eq('id', id);
      if (error) console.error('Erreur delete Supabase:', error);
    }

    memoryCandies = memoryCandies.filter((c) => c.id !== id);
    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Erreur delete candy:', error);
    res.status(500).json({ error: 'Impossible de supprimer le bonbon' });
  }
});

// ==========================================
// 4. Orders CRUD (Commandes)
// ==========================================
app.get(['/api/orders', '/api/admin/orders'], async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return res.json(data.map(mapOrderRowToModel));
      }
    }
    res.json(memoryOrders);
  } catch (error: any) {
    console.error('Erreur get orders:', error);
    res.json(memoryOrders);
  }
});

app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const newOrder: OrderRecord = {
      ...req.body,
      id: req.body.id || `cmd-${Date.now()}`,
      createdAt: req.body.createdAt || new Date().toISOString(),
      status: req.body.status || 'pending',
    };

    const supabase = getSupabase();
    if (supabase) {
      const row = mapModelToOrderRow(newOrder);
      const { error } = await supabase.from('orders').insert([row]);
      if (error) console.error('Erreur insert order Supabase:', error);
    }

    memoryOrders = [newOrder, ...memoryOrders];
    res.status(201).json(newOrder);
  } catch (error: any) {
    console.error('Erreur create order:', error);
    res.status(500).json({ error: 'Impossible d’enregistrer la commande' });
  }
});

app.patch('/api/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) console.error('Erreur update status Supabase:', error);
    }

    memoryOrders = memoryOrders.map((o) => (o.id === id ? { ...o, status } : o));
    res.json({ success: true, id, status });
  } catch (error: any) {
    console.error('Erreur update order status:', error);
    res.status(500).json({ error: 'Impossible de changer le statut' });
  }
});

app.delete('/api/orders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) console.error('Erreur delete order Supabase:', error);
    }

    memoryOrders = memoryOrders.filter((o) => o.id !== id);
    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Erreur delete order:', error);
    res.status(500).json({ error: 'Impossible de supprimer la commande' });
  }
});

// ==========================================
// 5. Store Settings (Réglages Magasin & WhatsApp)
// ==========================================
app.get('/api/settings', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (!error && data) {
        return res.json({
          storeName: data.store_name,
          whatsappNumber: data.whatsapp_number,
          currency: data.currency,
          eurToFcfaRate: Number(data.eur_to_fcfa_rate),
          adminPassword: data.admin_password,
          managers: data.managers || DEFAULT_MANAGERS,
          freeDeliveryThreshold: Number(data.free_delivery_threshold),
          deliveryFee: Number(data.delivery_fee),
          storeNotice: data.store_notice,
        });
      }
    }
    res.json(memorySettings);
  } catch (error: any) {
    console.error('Erreur get settings:', error);
    res.json(memorySettings);
  }
});

app.put('/api/settings', async (req: Request, res: Response) => {
  try {
    const updated: StoreSettings = { ...memorySettings, ...req.body };
    const supabase = getSupabase();

    if (supabase) {
      const row = {
        id: 'default',
        store_name: updated.storeName,
        whatsapp_number: updated.whatsappNumber,
        currency: updated.currency,
        eur_to_fcfa_rate: updated.eurToFcfaRate,
        admin_password: updated.adminPassword,
        managers: updated.managers,
        free_delivery_threshold: updated.freeDeliveryThreshold,
        delivery_fee: updated.deliveryFee,
        store_notice: updated.storeNotice,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('store_settings')
        .upsert(row, { onConflict: 'id' });
      if (error) console.error('Erreur upsert settings Supabase:', error);
    }

    memorySettings = updated;
    res.json(memorySettings);
  } catch (error: any) {
    console.error('Erreur update settings:', error);
    res.status(500).json({ error: 'Impossible de sauvegarder les paramètres' });
  }
});

// ==========================================
// 6. Admin Analytics / Stats
// ==========================================
app.get('/api/admin/stats', async (req: Request, res: Response) => {
  try {
    let ordersList = memoryOrders;
    let candiesList = memoryCandies;
    const supabase = getSupabase();

    if (supabase) {
      const [candiesRes, ordersRes] = await Promise.all([
        supabase.from('candies').select('id, stock, price, category'),
        supabase.from('orders').select('*'),
      ]);
      if (candiesRes.data) candiesList = candiesRes.data as any;
      if (ordersRes.data) ordersList = ordersRes.data.map(mapOrderRowToModel);
    }

    const totalRevenue = ordersList.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalOrders = ordersList.length;
    const pendingOrders = ordersList.filter((o) => o.status === 'pending').length;
    const preparingOrders = ordersList.filter((o) => o.status === 'preparing').length;
    const lowStockCandies = candiesList.filter((c) => (c.stock || 0) < 15).length;
    const totalCandies = candiesList.length;

    res.json({
      totalRevenue,
      totalOrders,
      pendingOrders,
      preparingOrders,
      lowStockCandies,
      totalCandies,
      supabaseConnected: isSupabaseConfigured(),
    });
  } catch (error: any) {
    console.error('Erreur admin stats:', error);
    res.status(500).json({ error: 'Erreur calcul statistiques' });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 Serveur Express Babibonbon actif sur http://localhost:${PORT}`);
  console.log(`🔌 Statut Supabase: ${isSupabaseConfigured() ? 'Connecté ✅' : 'En attente des clés dans .env ⏳'}`);
});

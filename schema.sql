-- ==============================================================================
-- 🍭 BABIBON UNIFIED — COMPLETE SUPABASE DATABASE SCHEMA
-- Includes all 5 tables for User Storefront & Admin Dashboard:
-- 1. profiles (users & roles)
-- 2. candies (product inventory)
-- 3. cart_items (persistent user carts)
-- 4. orders (customer purchases & status tracking)
-- 5. order_items (line items per order)
-- + store_settings (admin store configurations)
-- ==============================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. TABLE: PROFILES (Extends Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'manager')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 2. TABLE: CANDIES (Products Catalog for Store & Admin)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.candies (
    id TEXT PRIMARY KEY DEFAULT ('candy-' || floor(extract(epoch from now()) * 1000)::text),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    category TEXT NOT NULL DEFAULT 'gummy',
    flavor_badge TEXT DEFAULT 'Bonbon ✨',
    badge_color TEXT DEFAULT 'bg-pink-100 text-pink-800 border-pink-200',
    image_url TEXT,
    gradient_bg TEXT DEFAULT 'from-pink-200 via-rose-100 to-amber-100',
    emoji_icon TEXT DEFAULT '🍬',
    stock INTEGER NOT NULL DEFAULT 50 CHECK (stock >= 0),
    weight_grams INTEGER DEFAULT 100,
    is_popular BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3. TABLE: CART_ITEMS (User Shopping Cart)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    candy_id TEXT NOT NULL REFERENCES public.candies(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_candy UNIQUE (user_id, candy_id)
);

-- ------------------------------------------------------------------------------
-- 4. TABLE: ORDERS (Customer Purchases for Store Tracking & Admin Dashboard)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT ('CMD-' || lpad(floor(random() * 100000)::text, 5, '0')),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    delivery_address TEXT,
    shipping_address TEXT,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    currency TEXT DEFAULT 'FCFA',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'preparing', 'delivering', 'completed', 'paid', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 5. TABLE: ORDER_ITEMS (Items Inside an Order)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    candy_id TEXT REFERENCES public.candies(id) ON DELETE SET NULL,
    candy_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    price_at_purchase NUMERIC(10, 2) DEFAULT 0 CHECK (price_at_purchase >= 0)
);

-- ------------------------------------------------------------------------------
-- 6. TABLE: STORE_SETTINGS (Store Configuration for Admin)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    store_name TEXT DEFAULT 'BonbonMagique 🍭',
    whatsapp_number TEXT DEFAULT '2250779323716',
    currency TEXT DEFAULT 'FCFA',
    eur_to_fcfa_rate NUMERIC(10, 3) DEFAULT 655.957,
    free_delivery_threshold NUMERIC(10, 2) DEFAULT 4000,
    delivery_fee NUMERIC(10, 2) DEFAULT 500,
    store_notice TEXT DEFAULT 'Livraison rapide chez toi ou à l''école ! Bonbons 100% magiques et certifiés gourmands ✨',
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ⚡ AUTOMATIC USER PROFILE TRIGGER
-- Automatically creates a public.profiles record when a user signs up via Supabase Auth
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        role = COALESCE(EXCLUDED.role, public.profiles.role);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 🔒 ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Public can view profiles"
    ON public.profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
    ON public.profiles FOR ALL
    USING (
        auth.uid() = id OR EXISTS (
            SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- CANDIES
DROP POLICY IF EXISTS "Public can view candies" ON public.candies;
CREATE POLICY "Public can view candies"
    ON public.candies FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public/Admins can manage candies" ON public.candies;
CREATE POLICY "Public/Admins can manage candies"
    ON public.candies FOR ALL
    USING (true)
    WITH CHECK (true);

-- CART_ITEMS
DROP POLICY IF EXISTS "Users manage own cart" ON public.cart_items;
CREATE POLICY "Users manage own cart"
    ON public.cart_items FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ORDERS
DROP POLICY IF EXISTS "Public can view and insert orders" ON public.orders;
CREATE POLICY "Public can view and insert orders"
    ON public.orders FOR ALL
    USING (true)
    WITH CHECK (true);

-- ORDER_ITEMS
DROP POLICY IF EXISTS "Public can view and insert order items" ON public.order_items;
CREATE POLICY "Public can view and insert order items"
    ON public.order_items FOR ALL
    USING (true)
    WITH CHECK (true);

-- STORE_SETTINGS
DROP POLICY IF EXISTS "Public can view store settings" ON public.store_settings;
CREATE POLICY "Public can view store settings"
    ON public.store_settings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public/Admins can update store settings" ON public.store_settings;
CREATE POLICY "Public/Admins can update store settings"
    ON public.store_settings FOR ALL
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 📦 STORAGE BUCKET FOR CANDY IMAGES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('candies', 'candies', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Candies Bucket Access" ON storage.objects;
CREATE POLICY "Public Candies Bucket Access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'candies');

DROP POLICY IF EXISTS "Allow Upload Candies Images" ON storage.objects;
CREATE POLICY "Allow Upload Candies Images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'candies');

-- ==============================================================================
-- 🍭 SEED DATA (Default Candies & Settings)
-- ==============================================================================
INSERT INTO public.store_settings (id, store_name, whatsapp_number, currency, eur_to_fcfa_rate, free_delivery_threshold, delivery_fee)
VALUES ('default', 'BonbonMagique 🍭', '2250779323716', 'FCFA', 655.957, 4000, 500)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.candies (id, name, description, price, category, flavor_badge, badge_color, image_url, emoji_icon, is_popular, is_new, stock, weight_grams)
VALUES
(
    'candy-1',
    'Oursons Gélifiés Câlins',
    'Petits oursons multicolores translucides aux vrais jus de fruits (fraise, pomme, orange, citron). Moelleux et irrésistibles !',
    500,
    'gummy',
    'Gélatine 🐻',
    'bg-amber-100 text-amber-800 border-amber-200',
    'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=600&q=80',
    '🐻',
    true,
    false,
    45,
    100
),
(
    'candy-2',
    'Rubans Rainbow Ultra-Acides',
    'Longues ceintures multicolores saupoudrées de cristaux pétillants. Attention, ça réveille les papilles dès la première bouchée !',
    400,
    'sour',
    'Acide ⚡',
    'bg-lime-100 text-lime-800 border-lime-200',
    'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80',
    '⚡',
    true,
    true,
    30,
    90
),
(
    'candy-3',
    'Grande Sucette Tourbillon',
    'La reine des fêtes foraines ! Une immense sucette spirale aux parfums fruités qui dure toute une récréation.',
    600,
    'lollipop',
    'Sucette 🍭',
    'bg-rose-100 text-rose-800 border-rose-200',
    'https://images.unsplash.com/photo-1575224300306-1b8da36134ec?auto=format&fit=crop&w=600&q=80',
    '🍭',
    true,
    false,
    25,
    80
),
(
    'candy-4',
    'Bouteilles Cola Pétillantes',
    'Les classiques bouteilles bicolores au goût cola authentique qui pétillent en bouche.',
    350,
    'sour',
    'Pétillant 🥤',
    'bg-amber-100 text-amber-800 border-amber-200',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
    '🥤',
    false,
    false,
    50,
    100
),
(
    'candy-5',
    'Fraises Tendres Poudrées',
    'Délicieuses demi-sphères moelleuses au bon goût de fraise des bois, enrobées de sucre rose croustillant.',
    500,
    'fruity',
    'Fruité 🍓',
    'bg-red-100 text-red-800 border-red-200',
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
    '🍓',
    false,
    false,
    40,
    100
),
(
    'candy-6',
    'Nuages Chamallow Pastel',
    'Guimauves ultra moelleuses en torsades pastel. Idéales à grignoter ou à faire fondre dans un chocolat chaud !',
    450,
    'marshmallow',
    'Moelleux ☁️',
    'bg-pink-100 text-pink-800 border-pink-200',
    'https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&w=600&q=80',
    '☁️',
    false,
    false,
    35,
    80
),
(
    'candy-7',
    'Perles Chocolat Cœur Caramel',
    'Billes croquantes de chocolat au lait fourrées d un caramel coulant et d une pointe de sel.',
    800,
    'chocolate',
    'Chocolat 🍫',
    'bg-yellow-100 text-yellow-800 border-yellow-200',
    'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80',
    '🍫',
    true,
    false,
    20,
    120
)
ON CONFLICT (id) DO NOTHING;

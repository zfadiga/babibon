-- ==========================================================
-- 🍭 BABIBON UNIFIED — SUPABASE DATABASE SCHEMA & SEED
-- ==========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE: CANDIES
CREATE TABLE IF NOT EXISTS public.candies (
    id TEXT PRIMARY KEY DEFAULT ('candy-' || floor(extract(epoch from now()) * 1000)::text),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'gummy',
    flavor_badge TEXT DEFAULT 'Bonbon ✨',
    badge_color TEXT DEFAULT 'bg-pink-100 text-pink-800 border-pink-200',
    image_url TEXT,
    gradient_bg TEXT DEFAULT 'from-pink-200 via-rose-100 to-amber-100',
    emoji_icon TEXT DEFAULT '🍬',
    stock INTEGER NOT NULL DEFAULT 50,
    weight_grams INTEGER DEFAULT 100,
    is_popular BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TABLE: ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT ('CMD-' || lpad(floor(random() * 100000)::text, 5, '0')),
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    delivery_address TEXT,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'FCFA',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'preparing', 'delivering', 'completed', 'cancelled'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TABLE: ORDER_ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    candy_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0
);

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.candies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES FOR CANDIES
-- Allow everyone to read candies
DROP POLICY IF EXISTS "Public can view candies" ON public.candies;
CREATE POLICY "Public can view candies"
    ON public.candies FOR SELECT
    USING (true);

-- Allow insert/update/delete for all (or authenticate admins in production)
DROP POLICY IF EXISTS "Public/Admins can manage candies" ON public.candies;
CREATE POLICY "Public/Admins can manage candies"
    ON public.candies FOR ALL
    USING (true)
    WITH CHECK (true);

-- 7. RLS POLICIES FOR ORDERS
DROP POLICY IF EXISTS "Public can view and insert orders" ON public.orders;
CREATE POLICY "Public can view and insert orders"
    ON public.orders FOR ALL
    USING (true)
    WITH CHECK (true);

-- 8. RLS POLICIES FOR ORDER_ITEMS
DROP POLICY IF EXISTS "Public can view and insert order items" ON public.order_items;
CREATE POLICY "Public can view and insert order items"
    ON public.order_items FOR ALL
    USING (true)
    WITH CHECK (true);

-- 9. STORAGE BUCKET CONFIGURATION (for candy images)
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

-- 10. INITIAL SEED DATA (Default Candies)
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

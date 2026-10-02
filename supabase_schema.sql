-- ==============================================================================
-- BABIBONBON - Schéma Supabase PostgreSQL pour la Confiserie Magique
-- ==============================================================================
-- Exécute ce script dans l'éditeur SQL de ton tableau de bord Supabase (SQL Editor)
-- pour initialiser les tables avec toutes les données de départ (12 bonbons + réglages).

-- 1. Table des Bonbons (Catalogue & Stocks)
CREATE TABLE IF NOT EXISTS public.candies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 500,
    category TEXT NOT NULL,
    flavor_badge TEXT,
    badge_color TEXT,
    image_url TEXT,
    gradient_bg TEXT,
    emoji_icon TEXT,
    is_popular BOOLEAN DEFAULT FALSE,
    is_new BOOLEAN DEFAULT FALSE,
    stock INTEGER DEFAULT 50,
    weight_grams INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des Commandes
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    child_name TEXT NOT NULL,
    child_id TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'FCFA',
    customer_phone TEXT,
    delivery_address TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'delivering', 'completed', 'cancelled'))
);

-- 3. Table des Réglages de la Confiserie & Gérants
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    store_name TEXT DEFAULT 'BonbonMagique 🍭',
    whatsapp_number TEXT DEFAULT '2250779323716',
    currency TEXT DEFAULT 'FCFA',
    eur_to_fcfa_rate NUMERIC DEFAULT 655.957,
    admin_password TEXT DEFAULT 'admin',
    managers JSONB DEFAULT '[
        {"id": "primary", "username": "admin", "name": "Gérant Principal", "role": "primary", "password": "admin"},
        {"id": "backup", "username": "secours", "name": "Gérant de Secours", "role": "backup", "password": "secours123"}
    ]'::jsonb,
    free_delivery_threshold NUMERIC DEFAULT 4000,
    delivery_fee NUMERIC DEFAULT 500,
    store_notice TEXT DEFAULT 'Livraison rapide chez toi ou à l''école ! Bonbons 100% magiques et certifiés gourmands ✨',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Activer Row Level Security (RLS) avec politiques d'accès public/anonyme pour le front
ALTER TABLE public.candies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Politiques RLS (lecture et écriture simplifiées pour la boutique)
DROP POLICY IF EXISTS "Public Candies Read" ON public.candies;
CREATE POLICY "Public Candies Read" ON public.candies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Candies All" ON public.candies;
CREATE POLICY "Admin Candies All" ON public.candies FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Orders Insert & Read" ON public.orders;
CREATE POLICY "Public Orders Insert & Read" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Store Settings All" ON public.store_settings;
CREATE POLICY "Public Store Settings All" ON public.store_settings FOR ALL USING (true) WITH CHECK (true);

-- 5. Données initiales par défaut (si tables vides)
INSERT INTO public.store_settings (id, store_name, whatsapp_number, currency, eur_to_fcfa_rate, admin_password, free_delivery_threshold, delivery_fee, store_notice)
VALUES (
    'default',
    'BonbonMagique 🍭',
    '2250779323716',
    'FCFA',
    655.957,
    'admin',
    4000,
    500,
    'Livraison rapide chez toi ou à l''école ! Bonbons 100% magiques et certifiés gourmands ✨'
)
ON CONFLICT (id) DO NOTHING;

-- Insertion des 12 bonbons de la boutique
INSERT INTO public.candies (id, name, description, price, category, flavor_badge, badge_color, image_url, gradient_bg, emoji_icon, is_popular, is_new, stock, weight_grams)
VALUES
('candy-1', 'Oursons Gélifiés Câlins', 'Petits oursons multicolores translucides aux vrais jus de fruits (fraise, pomme, orange, citron). Moelleux et irrésistibles !', 500, 'gummy', 'Gélatine 🐻', 'bg-amber-100 text-amber-800 border-amber-200', 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=600&q=80', 'from-amber-200 via-yellow-100 to-orange-100', '🐻', true, false, 45, 100),
('candy-2', 'Rubans Rainbow Ultra-Acides', 'Longues ceintures multicolores saupoudrées de cristaux pétillants. Attention, ça réveille les papilles dès la première bouchée !', 400, 'sour', 'Acide ⚡', 'bg-lime-100 text-lime-800 border-lime-200', 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80', 'from-lime-200 via-emerald-100 to-teal-100', '⚡', true, true, 30, 90),
('candy-3', 'Grande Sucette Tourbillon', 'La reine des fêtes foraines ! Une immense sucette spirale aux parfums fruités qui dure toute une récréation.', 600, 'lollipop', 'Sucette 🍭', 'bg-rose-100 text-rose-800 border-rose-200', 'https://images.unsplash.com/photo-1575224300306-1b8da36134ec?auto=format&fit=crop&w=600&q=80', 'from-pink-200 via-rose-100 to-purple-100', '🍭', true, false, 25, 60),
('candy-4', 'Perles Chocolat Cœur Caramel', 'Bouchées craquantes de chocolat au lait suisse garnies d''un délicieux caramel onctueux et fondant.', 800, 'chocolate', 'Chocolat 🍫', 'bg-amber-100 text-amber-900 border-amber-300', 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80', 'from-amber-300 via-stone-200 to-yellow-100', '🍫', false, false, 20, 120),
('candy-5', 'Fraises Tendres Poudrées', 'Texture ultra moelleuse, enrobage sucré rose et goût inimitable de fraise des bois. Le bonbon favori des petits gourmands !', 500, 'fruity', 'Fruité 🍓', 'bg-red-100 text-red-800 border-red-200', 'https://images.unsplash.com/photo-1499195333224-3ce974eecb47?auto=format&fit=crop&w=600&q=80', 'from-red-200 via-pink-100 to-rose-100', '🍓', true, false, 50, 100),
('candy-6', 'Nuages Chamallows Barbe à Papa', 'Guimauves bicolores pastel douces comme du coton, à savourer natures ou à faire fondre dans du lait chaud pour le goûter.', 450, 'marshmallow', 'Moelleux ☁️', 'bg-sky-100 text-sky-800 border-sky-200', 'https://images.unsplash.com/photo-1534960680480-ca9853707e10?auto=format&fit=crop&w=600&q=80', 'from-sky-200 via-pink-100 to-indigo-100', '☁️', false, false, 35, 110),
('candy-7', 'Bouteilles Cola Pétillantes', 'Le goût authentique du soda dans une bouteille gélifiée au cœur effervescent qui crépite joyeusement en bouche.', 350, 'sour', 'Pétillant 🥤', 'bg-yellow-100 text-yellow-900 border-yellow-200', 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&w=600&q=80', 'from-yellow-200 via-amber-100 to-stone-200', '🥤', false, true, 40, 90),
('candy-8', 'Billes Magiques Dragibus Festives', 'Un arc-en-ciel de petites dragées tendres et colorées. Découvre la couleur surprise et gagne un sourire !', 350, 'gummy', 'Gélatine 🐻', 'bg-purple-100 text-purple-800 border-purple-200', 'https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?auto=format&fit=crop&w=600&q=80', 'from-purple-200 via-fuchsia-100 to-pink-100', '🍬', false, false, 60, 95),
('candy-9', 'Œufs au Plat Gélifiés Étoilés', 'Le blanc tout doux au goût vanille et le jaune fruité à l''abricot. Un grand classique indémodable de la confiserie.', 450, 'gummy', 'Gélatine 🐻', 'bg-amber-100 text-amber-900 border-amber-200', 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=600&q=80', 'from-yellow-200 via-amber-100 to-white', '🍳', false, false, 35, 100),
('candy-10', 'Roches Crunchy Chocolat Noisette', 'Chocolat au lait croquant enrobant des éclats de noisettes grillées et biscuit croustillant. Un régal pour les champions !', 750, 'chocolate', 'Chocolat 🍫', 'bg-amber-200 text-amber-950 border-amber-300', 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=600&q=80', 'from-amber-300 via-orange-200 to-yellow-100', '🍫', false, false, 18, 110),
('candy-11', 'Tétines Fruitées Tutti-Frutti', 'Forme amusante de sucette tétine avec une texture ferme et des arômes fruités intenses. À déguster partout !', 300, 'fruity', 'Fruité 🍓', 'bg-emerald-100 text-emerald-800 border-emerald-200', 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=600&q=80', 'from-emerald-200 via-teal-100 to-cyan-100', '🍼', false, false, 45, 80),
('candy-12', 'Bananes Sucrées Velours', 'Une forme courbée irrésistible, un enrobage croustillant en sucre et un cœur jaune moelleux au doux parfum de banane.', 400, 'fruity', 'Fruité 🍌', 'bg-yellow-100 text-yellow-800 border-yellow-200', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80', 'from-yellow-200 via-amber-100 to-yellow-50', '🍌', false, false, 30, 90)
ON CONFLICT (id) DO NOTHING;

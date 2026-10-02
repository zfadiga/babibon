import { CandyProduct, StoreSettings, ManagerAccount } from '../types/candy';

export const DEFAULT_MANAGERS: ManagerAccount[] = [
  {
    id: 'primary',
    username: 'admin',
    name: 'Gérant Principal',
    role: 'primary',
    password: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'backup',
    username: 'secours',
    name: 'Gérant de Secours',
    role: 'backup',
    password: 'secours123',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: "BonbonMagique 🍭",
  whatsappNumber: "2250779323716", // +225 07 79 32 37 16
  currency: 'FCFA',
  eurToFcfaRate: 655.957,
  adminPassword: "admin",
  managers: DEFAULT_MANAGERS, // Strict max of 2 accounts: 1 primary + 1 backup
  freeDeliveryThreshold: 4000,
  deliveryFee: 500,
  storeNotice: "Livraison rapide chez toi ou à l'école ! Bonbons 100% magiques et certifiés gourmands ✨"
};

export const FUN_AVATARS = [
  { id: 'bear', emoji: '🐻', label: 'Ourson Gourmand', bg: 'bg-amber-100 text-amber-700 border-amber-300' },
  { id: 'unicorn', emoji: '🦄', label: 'Licorne Sucre', bg: 'bg-pink-100 text-pink-700 border-pink-300' },
  { id: 'lollipop', emoji: '🍭', label: 'Roi Sucette', bg: 'bg-rose-100 text-rose-700 border-rose-300' },
  { id: 'tiger', emoji: '🐯', label: 'Tigre Bonbon', bg: 'bg-orange-100 text-orange-700 border-orange-300' },
  { id: 'astronaut', emoji: '🚀', label: 'Astronaute Fizz', bg: 'bg-sky-100 text-sky-700 border-sky-300' },
  { id: 'strawberry', emoji: '🍓', label: 'Princesse Fraise', bg: 'bg-red-100 text-red-700 border-red-300' },
  { id: 'wizard', emoji: '🧙‍♂️', label: 'Mage Caramelo', bg: 'bg-purple-100 text-purple-700 border-purple-300' },
  { id: 'bunny', emoji: '🐰', label: 'Lapin Chamallow', bg: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
];

export const CATEGORY_INFO = [
  { id: 'all', label: 'Tous les bonbons', emoji: '✨', description: 'Tout l\'univers sucré' },
  { id: 'sour', label: 'Acides & Piquants', emoji: '⚡', description: 'Ça pique la langue !' },
  { id: 'gummy', label: 'Oursons & Gélifiés', emoji: '🐻', description: 'Moelleux à souhait' },
  { id: 'chocolate', label: 'Chocolats Doux', emoji: '🍫', description: 'Fondant et gourmand' },
  { id: 'lollipop', label: 'Sucettes Magiques', emoji: '🍭', description: 'À savourer longtemps' },
  { id: 'marshmallow', label: 'Nuages Guimauve', emoji: '☁️', description: 'Doux comme un rêve' },
  { id: 'fruity', label: 'Fruits Croquants', emoji: '🍓', description: 'Le plein de vitamines fun' },
];

export const DEFAULT_CANDIES: CandyProduct[] = [
  {
    id: 'candy-1',
    name: 'Oursons Gélifiés Câlins',
    description: 'Petits oursons multicolores translucides aux vrais jus de fruits (fraise, pomme, orange, citron). Moelleux et irrésistibles !',
    price: 500,
    category: 'gummy',
    flavorBadge: 'Gélatine 🐻',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    imageUrl: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=600&q=80',
    gradientBg: 'from-amber-200 via-yellow-100 to-orange-100',
    emojiIcon: '🐻',
    isPopular: true,
    stock: 45,
    weightGrams: 100
  },
  {
    id: 'candy-2',
    name: 'Rubans Rainbow Ultra-Acides',
    description: 'Longues ceintures multicolores saupoudrées de cristaux pétillants. Attention, ça réveille les papilles dès la première bouchée !',
    price: 400,
    category: 'sour',
    flavorBadge: 'Acide ⚡',
    badgeColor: 'bg-lime-100 text-lime-800 border-lime-200',
    imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80',
    gradientBg: 'from-lime-200 via-emerald-100 to-teal-100',
    emojiIcon: '⚡',
    isPopular: true,
    isNew: true,
    stock: 30,
    weightGrams: 90
  },
  {
    id: 'candy-3',
    name: 'Grande Sucette Tourbillon',
    description: 'La reine des fêtes foraines ! Une immense sucette spirale aux parfums fruités qui dure toute une récréation.',
    price: 600,
    category: 'lollipop',
    flavorBadge: 'Sucette 🍭',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    imageUrl: 'https://images.unsplash.com/photo-1575224300306-1b8da36134ec?auto=format&fit=crop&w=600&q=80',
    gradientBg: 'from-pink-200 via-rose-100 to-purple-100',
    emojiIcon: '🍭',
    isPopular: true,
    stock: 25,
    weightGrams: 60
  },
  {
    id: 'candy-4',
    name: 'Perles Chocolat Cœur Caramel',
    description: 'Bouchées craquantes de chocolat au lait suisse garnies d\'un délicieux caramel onctueux et fondant.',
    price: 800,
    category: 'chocolate',
    flavorBadge: 'Chocolat 🍫',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80',
    gradientBg: 'from-amber-300 via-stone-200 to-yellow-100',
    emojiIcon: '🍫',
    stock: 20,
    weightGrams: 120
  },
  {
    id: 'candy-5',
    name: 'Fraises Tendres Poudrées',
    description: 'Texture ultra moelleuse, enrobage sucré rose et goût inimitable de fraise des bois. Le bonbon favori des petits gourmands !',
    price: 500,
    category: 'fruity',
    flavorBadge: 'Fruité 🍓',
    badgeColor: 'bg-red-100 text-red-800 border-red-200',
    imageUrl: 'https://images.unsplash.com/photo-1499195333224-3ce974eecb47?auto=format&fit=crop&w=600&q=80',
    gradientBg: 'from-red-200 via-pink-100 to-rose-100',
    emojiIcon: '🍓',
    isPopular: true,
    stock: 50,
    weightGrams: 100
  },
  {
    id: 'candy-6',
    name: 'Nuages Chamallows Barbe à Papa',
    description: 'Guimauves bicolores pastel douces comme du coton, à savourer natures ou à faire fondre dans du lait chaud pour le goûter.',
    price: 450,
    category: 'marshmallow',
    flavorBadge: 'Moelleux ☁️',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
    imageUrl: 'https://images.unsplash.com/photo-1534960680480-ca9853707e10?auto=format&fit=crop&w=600&q=80',
    gradientBg: 'from-sky-200 via-pink-100 to-indigo-100',
    emojiIcon: '☁️',
    stock: 35,
    weightGrams: 110
  },
  {
    id: 'candy-7',
    name: 'Bouteilles Cola Pétillantes',
    description: 'Le goût authentique du soda dans une bouteille gélifiée au cœur effervescent qui crépite joyeusement en bouche.',
    price: 350,
    category: 'sour',
    flavorBadge: 'Pétillant 🥤',
    badgeColor: 'bg-yellow-100 text-yellow-900 border-yellow-200',
    imageUrl: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&w=600&q=80',
    gradientBg: 'from-yellow-200 via-amber-100 to-stone-200',
    emojiIcon: '🥤',
    isNew: true,
    stock: 40,
    weightGrams: 90
  },
  {
    id: 'candy-8',
    name: 'Billes Magiques Dragibus Festives',
    description: 'Un arc-en-ciel de petites dragées tendres et colorées. Découvre la couleur surprise et gagne un sourire !',
    price: 350,
    category: 'gummy',
    flavorBadge: 'Gélatine 🐻',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    imageUrl: 'https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?auto=format&fit=crop&w=600&q=80',
    gradientBg: 'from-purple-200 via-fuchsia-100 to-pink-100',
    emojiIcon: '🍬',
    stock: 60,
    weightGrams: 95
  },
  {
    id: 'candy-9',
    name: 'Œufs au Plat Gélifiés Étoilés',
    description: 'Le blanc tout doux au goût vanille et le jaune fruité à l\'abricot. Un grand classique indémodable de la confiserie.',
    price: 450,
    category: 'gummy',
    flavorBadge: 'Gélatine 🐻',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
    imageUrl: 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=600&q=80',
    gradientBg: 'from-yellow-200 via-amber-100 to-white',
    emojiIcon: '🍳',
    stock: 35,
    weightGrams: 100
  },
  {
    id: 'candy-10',
    name: 'Roches Crunchy Chocolat Noisette',
    description: 'Chocolat au lait croquant enrobant des éclats de noisettes grillées et biscuit croustillant. Un régal pour les champions !',
    price: 750,
    category: 'chocolate',
    flavorBadge: 'Chocolat 🍫',
    badgeColor: 'bg-amber-200 text-amber-950 border-amber-300',
    imageUrl: 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=600&q=80',
    gradientBg: 'from-amber-300 via-orange-200 to-yellow-100',
    emojiIcon: '🍫',
    stock: 18,
    weightGrams: 110
  },
  {
    id: 'candy-11',
    name: 'Tétines Fruitées Tutti-Frutti',
    description: 'Forme amusante de sucette tétine avec une texture ferme et des arômes fruités intenses. À déguster partout !',
    price: 300,
    category: 'fruity',
    flavorBadge: 'Fruité 🍓',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    imageUrl: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=600&q=80',
    gradientBg: 'from-emerald-200 via-teal-100 to-cyan-100',
    emojiIcon: '🍼',
    stock: 45,
    weightGrams: 80
  },
  {
    id: 'candy-12',
    name: 'Bananes Sucrées Velours',
    description: 'Une forme courbée irrésistible, un enrobage croustillant en sucre et un cœur jaune moelleux au doux parfum de banane.',
    price: 400,
    category: 'fruity',
    flavorBadge: 'Fruité 🍌',
    badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
    gradientBg: 'from-yellow-200 via-amber-100 to-yellow-50',
    emojiIcon: '🍌',
    stock: 30,
    weightGrams: 90
  }
];

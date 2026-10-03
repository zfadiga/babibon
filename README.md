# 🍭 Babibon Unified — E-Commerce Candy Store & Admin Dashboard

Projet unifié sous **Next.js (App Router)** regroupant la boutique e-commerce pour enfants (**BonbonMagique**) et le tableau de bord d'administration (**Babibon Admin**).

---

## 📂 Architecture Unifiée

```
babibonunifed/
├── app/
│   ├── layout.tsx             # Root layout Next.js (Fournisseur d'état StoreProvider & Modales)
│   ├── globals.css            # Styles globaux, animations et configuration Tailwind
│   ├── page.tsx               # 🛍️ Boutique client : Bannière hero, filtres, bonbons & recherche
│   ├── cart/
│   │   └── page.tsx           # 🛒 Panier client : Récapitulatif, jauges et validation WhatsApp
│   ├── orders/
│   │   └── page.tsx           # 📦 Suivi des commandes : Historique client & statut en direct
│   └── admin/
│       └── page.tsx           # 🛡️ Tableau de bord Admin : Inventaire, commandes et utilisateurs
├── components/
│   ├── store/                 # Composants boutique client
│   │   ├── Navbar.tsx         # Barre de navigation client (liens, badge panier, profil, devise)
│   │   ├── CandyCard.tsx      # Carte produit avec animations, badges et prix
│   │   ├── CandyDetailsModal.tsx # Fiche produit détaillée avec sélection de quantité
│   │   ├── CartDrawer.tsx     # Tiroir latéral panier accessible à tout moment
│   │   ├── CartView.tsx       # Vue panier complète
│   │   ├── OrdersView.tsx     # Vue de suivi des commandes
│   │   ├── WhatsAppOrderModal.tsx # Validation de commande et envoi direct WhatsApp
│   │   ├── LoginModal.tsx     # Modal de connexion enfant/client
│   │   ├── SignupModal.tsx    # Modal d'inscription avec choix d'avatar
│   │   ├── ProfileModal.tsx   # Modal de profil et coordonnées de livraison
│   │   └── GlobalStoreModals.tsx # Conteneur centralisé des modales boutique
│   └── admin/                 # Composants d'administration
│       ├── AdminGuard.tsx     # Garde d'authentification Supabase + Simulateur de rôle Démo
│       ├── AdminNavbar.tsx    # Barre de navigation admin (onglets & retour boutique)
│       ├── CandyForm.tsx      # Formulaire d'ajout de bonbon avec upload d'image
│       ├── CandyTable.tsx     # Tableau de l'inventaire avec recherche, filtre et suppression
│       ├── OrdersTable.tsx    # Tableau des commandes clients avec métriques et statuts
│       ├── AccountSettings.tsx# Modification des identifiants admin (email & mot de passe)
│       ├── UserManagement.tsx # Création d'utilisateurs et attribution de rôles
│       └── LoginForm.tsx      # Formulaire de connexion administrateur
├── context/
│   └── StoreContext.tsx       # Contexte React centralisé pour le panier, l'utilisateur et le catalogue
├── data/
│   └── defaultCandies.ts      # Données mock : Bonbons initiaux, commandes exemples, gérants et avatars
├── lib/
│   ├── supabaseClient.ts      # Client Supabase avec mode dégradé gracieux (mock si non configuré)
│   └── api.ts                 # Service unifié (CRUD bonbons, commandes, upload d'images, auth)
├── types/
│   ├── candy.ts               # Types TypeScript boutique (produit, panier, utilisateur, réglages)
│   └── index.ts               # Types TypeScript admin et alias unifiés
├── utils/
│   └── formatters.ts          # Formatage des prix (FCFA/EUR), confettis et générateur de lien WhatsApp
├── .env.example               # Variables d'environnement modèles
├── .env.local                 # Configuration locale des clés Supabase et backend
├── next.config.js             # Configuration Next.js (support des images distantes)
├── tailwind.config.js         # Configuration Tailwind CSS (palette candy et polices)
└── tsconfig.json              # Configuration TypeScript
```

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances

```bash
npm install
```

### 2. Lancement du serveur de développement

```bash
npm run dev
```

L'application sera accessible sur :
- **Boutique client** : [http://localhost:3000](http://localhost:3000)
- **Panier** : [http://localhost:3000/cart](http://localhost:3000/cart)
- **Mes Commandes** : [http://localhost:3000/orders](http://localhost:3000/orders)
- **Tableau de bord Admin** : [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🛠️ Données Mock & Mode Hors-Ligne

Le projet fonctionne **immédiatement sans aucune configuration préalable de base de données** :
- Le catalogue de bonbons par défaut et les commandes sont initialisés via `data/defaultCandies.ts`.
- L'état local du panier, du profil enfant et des commandes passées est synchronisé automatiquement dans `localStorage`.
- Sur l'interface `/admin`, le simulateur de rôle intégré permet de tester les vues **Admin** et **Non-Autorisé** en un seul clic.

---

## 🔌 Connexion future à Supabase

Pour brancher votre projet Supabase :
1. Renseignez vos identifiants dans `.env.local` :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
   ```
2. `lib/supabaseClient.ts` détectera automatiquement la configuration et basculera du mode mock au mode connecté en direct.

import React, { useState } from 'react';
import { X, Database, Check, Copy, ExternalLink, Sparkles, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';
import { getSavedSupabaseConfig, saveFrontendSupabaseConfig, getSupabaseFrontendClient } from '../../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
  isBackendConnected: boolean;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
  isBackendConnected,
}) => {
  const currentConfig = getSavedSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setStatusMessage(null);

    try {
      saveFrontendSupabaseConfig(url, anonKey);
      const client = getSupabaseFrontendClient();

      if (!client) {
        setStatusMessage({
          text: 'Vérifie que l’URL commence par https:// et que la clé API anonyme est valide.',
          type: 'error',
        });
        setIsTesting(false);
        return;
      }

      // Quick ping test
      const { data, error } = await client.from('candies').select('id').limit(1);

      if (error) {
        if (error.code === '42P01') {
          // Table does not exist yet
          setStatusMessage({
            text: 'Connecté à Supabase avec succès ! Pense à exécuter le script SQL ci-dessous pour créer la table "candies".',
            type: 'info',
          });
        } else {
          setStatusMessage({
            text: `Erreur Supabase: ${error.message}`,
            type: 'error',
          });
        }
      } else {
        setStatusMessage({
          text: `Connexion Supabase réussie ! ${data?.length || 0} bonbon(s) détecté(s) dans la table.`,
          type: 'success',
        });
      }

      onConfigUpdated();
    } catch (err: any) {
      setStatusMessage({
        text: `Erreur inattendue : ${err?.message || err}`,
        type: 'error',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopySql = async () => {
    try {
      const sqlSnippet = `-- BABIBONBON - Schéma Supabase
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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
    status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    store_name TEXT DEFAULT 'BonbonMagique 🍭',
    whatsapp_number TEXT DEFAULT '2250779323716',
    currency TEXT DEFAULT 'FCFA',
    eur_to_fcfa_rate NUMERIC DEFAULT 655.957,
    admin_password TEXT DEFAULT 'admin',
    managers JSONB,
    free_delivery_threshold NUMERIC DEFAULT 4000,
    delivery_fee NUMERIC DEFAULT 500,
    store_notice TEXT
);

ALTER TABLE public.candies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Candies" ON public.candies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Settings" ON public.store_settings FOR ALL USING (true) WITH CHECK (true);
`;
      await navigator.clipboard.writeText(sqlSnippet);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-pink-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl mb-2 shadow-inner">
            <Database className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-candy font-bold tracking-tight">
            Connexion Supabase & Base de Données
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            Connecte ta boutique BonbonMagique à ta base de données cloud PostgreSQL hébergée sur Supabase.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status info */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 p-3.5 rounded-2xl border bg-slate-50 border-slate-200 text-xs">
              <span className="text-slate-500 block mb-1">Serveur Express Backend :</span>
              <span className={`font-bold flex items-center gap-1.5 ${isBackendConnected ? 'text-emerald-600' : 'text-amber-600'}`}>
                <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                {isBackendConnected ? 'En ligne (http://localhost:3001)' : 'Hors-ligne (Mode Direct / Navigateur)'}
              </span>
            </div>
            <div className="flex-1 p-3.5 rounded-2xl border bg-slate-50 border-slate-200 text-xs">
              <span className="text-slate-500 block mb-1">Base Cloud Supabase :</span>
              <span className={`font-bold flex items-center gap-1.5 ${url ? 'text-emerald-600' : 'text-slate-500'}`}>
                <span className={`w-2 h-2 rounded-full ${url ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                {url ? 'Clés renseignées' : 'Non configuré'}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Supabase Project URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono text-slate-800"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                Visible dans ton dashboard Supabase : Project Settings &gt; API &gt; Project URL.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Supabase Anon / Public API Key
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono text-slate-800"
                />
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">
                Clé `anon` publique trouvée dans Project Settings &gt; API &gt; Project API Keys.
              </span>
            </div>

            {statusMessage && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 border ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : statusMessage.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-sky-50 text-sky-800 border-sky-200'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={isTesting}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Test en cours...' : 'Sauvegarder & Tester la connexion'}</span>
              </button>
            </div>
          </form>

          {/* Quick SQL schema copy helper */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Script SQL de création des tables :
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier le SQL</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Un fichier complet <code>supabase_schema.sql</code> a également été généré à la racine de ton projet. Colle-le dans l'onglet <strong>SQL Editor</strong> de ton dashboard Supabase pour créer automatiquement les tables et initialiser les 12 bonbons.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-slate-600 hover:text-emerald-600 flex items-center gap-1.5"
          >
            <span>Ouvrir Supabase Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

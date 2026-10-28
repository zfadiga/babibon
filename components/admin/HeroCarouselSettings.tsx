'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/context/StoreContext';
import { HeroSlide } from '@/types/candy';
import { DEFAULT_HERO_SLIDES } from '@/data/defaultCandies';
import { uploadHeroImage, updateStoreSettings, fetchStoreSettings } from '@/lib/api';
import {
  Sparkles,
  Image as ImageIcon,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  Save,
  Eye,
  ExternalLink,
} from 'lucide-react';

export default function HeroCarouselSettings() {
  const { settings, setSettings } = useStore();

  const [slides, setSlides] = useState<HeroSlide[]>(() => {
    if (settings?.heroSlides && settings.heroSlides.length === 3) {
      return settings.heroSlides;
    }
    return DEFAULT_HERO_SLIDES;
  });

  const [uploadingSlideIndex, setUploadingSlideIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRefs = [
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
  ];

  // Sync slides when settings update from remote or storage
  useEffect(() => {
    if (settings?.heroSlides && settings.heroSlides.length > 0) {
      setSlides(settings.heroSlides);
    }
  }, [settings?.heroSlides]);

  const handleSlideChange = (index: number, field: keyof HeroSlide, value: string) => {
    setSlides((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP).');
      return;
    }

    setUploadingSlideIndex(index);
    setErrorMessage(null);

    try {
      const uploadedUrl = await uploadHeroImage(file);
      handleSlideChange(index, 'imageUrl', uploadedUrl);
      setSuccessMessage(`Image pour la diapositive ${index + 1} téléchargée avec succès !`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(`Erreur lors du téléchargement de l'image : ${err.message || 'Échec réseau'}`);
    } finally {
      setUploadingSlideIndex(null);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm("Êtes-vous sûr de vouloir restaurer les 3 images et textes par défaut du carrousel ?")) {
      setSlides(DEFAULT_HERO_SLIDES);
      setSuccessMessage("Images par défaut restaurées dans l'éditeur. N'oubliez pas d'enregistrer.");
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    // Validate that all slides have an image URL
    for (let i = 0; i < slides.length; i++) {
      if (!slides[i].imageUrl.trim()) {
        setErrorMessage(`L'image de la diapositive ${i + 1} ne peut pas être vide.`);
        setSaving(false);
        return;
      }
    }

    try {
      const result = await updateStoreSettings({ heroSlides: slides });
      if (result.success) {
        if (result.settings) {
          setSettings(result.settings);
        }
        setSuccessMessage("Le carrousel d'images du Hero a été mis à jour avec succès ! Les modifications sont visibles immédiatement sur la boutique.");
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setErrorMessage(result.message || "Erreur lors de la sauvegarde.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur inattendue lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 sm:p-8 space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-bold border border-pink-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vitrine & Animation</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-candy font-bold text-gray-900">
            Gestion du Hero Carrousel (3 Images)
          </h2>
          <p className="text-sm text-gray-500 max-w-2xl">
            Personnalisez les 3 visuels et slogans promotionnels affichés sur la page d&apos;accueil. 
            Le carrousel tourne automatiquement toutes les 3 secondes sur l&apos;interface client.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetToDefaults}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-all cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
          <span>Restaurer défauts</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Slides Editor Form */}
      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {slides.map((slide, index) => {
            const isUploading = uploadingSlideIndex === index;
            const fileInputRef = fileInputRefs[index];

            return (
              <div
                key={slide.id || index}
                className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-5 flex flex-col justify-between hover:border-pink-300 transition-colors shadow-xs"
              >
                {/* Slide header */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-pink-100 text-pink-700 text-xs font-bold font-candy">
                    Diapositive #{index + 1}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    Défilement auto (3s)
                  </span>
                </div>

                {/* Preview Banner */}
                <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 group">
                  {slide.imageUrl ? (
                    <>
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url(${slide.imageUrl})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <span className="text-[10px] font-bold text-pink-300 uppercase tracking-wider block truncate">
                          {slide.badge || 'Badge'}
                        </span>
                        <h4 className="text-xs font-bold truncate">
                          {slide.title} <span className="text-pink-300">{slide.highlight}</span>
                        </h4>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                      <ImageIcon className="w-8 h-8 opacity-40" />
                      <span className="text-xs">Aucune image définie</span>
                    </div>
                  )}

                  {isUploading && (
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
                      <span className="text-xs font-medium">Téléchargement...</span>
                    </div>
                  )}
                </div>

                {/* Image upload & URL controls */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-700">
                    Source de l&apos;image
                  </label>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(index, file);
                    }}
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'Chargement...' : 'Téléverser image'}</span>
                    </button>

                    {slide.imageUrl && (
                      <a
                        href={slide.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-600 transition-colors flex items-center justify-center"
                        title="Voir l'image en taille réelle"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <div>
                    <input
                      type="url"
                      value={slide.imageUrl}
                      onChange={(e) => handleSlideChange(index, 'imageUrl', e.target.value)}
                      placeholder="https://... (URL de l'image)"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700"
                    />
                  </div>
                </div>

                {/* Texts customization */}
                <div className="space-y-3 pt-2 border-t border-slate-200/60">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Badge supérieur
                    </label>
                    <input
                      type="text"
                      value={slide.badge}
                      onChange={(e) => handleSlideChange(index, 'badge', e.target.value)}
                      placeholder="Ex: Confiserie Féerique ✨"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Titre principal
                    </label>
                    <input
                      type="text"
                      value={slide.title}
                      onChange={(e) => handleSlideChange(index, 'title', e.target.value)}
                      placeholder="Ex: L’univers le plus gourmand"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Texte mis en valeur (couleur)
                    </label>
                    <input
                      type="text"
                      value={slide.highlight}
                      onChange={(e) => handleSlideChange(index, 'highlight', e.target.value)}
                      placeholder="Ex: d’Abidjan 🍭"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 text-pink-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={slide.description}
                      onChange={(e) => handleSlideChange(index, 'description', e.target.value)}
                      placeholder="Ex: Des oursons tendres et des créations sucrées..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Étiquette de livraison / Tag
                    </label>
                    <input
                      type="text"
                      value={slide.tag}
                      onChange={(e) => handleSlideChange(index, 'tag', e.target.value)}
                      placeholder="Ex: Livraison express à domicile ou à l’école"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-800 text-xs"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit button bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Eye className="w-4 h-4 text-pink-500" />
            <span>Les 3 diapositives s&apos;actualisent instantanément pour tous les visiteurs connectés.</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-candy font-bold text-sm shadow-lg shadow-pink-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enregistrement des images...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Enregistrer le Carrousel</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

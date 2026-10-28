'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  MessageCircle,
  Truck,
  Heart,
  Star,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';

interface SlideData {
  id: number;
  imageUrl: string;
  badge: string;
  title: string;
  highlight: string;
  description: string;
  tag: string;
  accentColor: string;
}

const HERO_SLIDES: SlideData[] = [
  {
    id: 1,
    imageUrl: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=1600&q=85',
    badge: 'Confiserie Féerique ✨',
    title: 'L’univers le plus gourmand',
    highlight: 'd’Abidjan 🍭',
    description: 'Des oursons gélifiés tendres, des sucettes multicolores et des créations sucrées qui émerveillent petits et grands.',
    tag: 'Livraison express à domicile ou à l’école',
    accentColor: 'from-pink-500 to-rose-600',
  },
  {
    id: 2,
    imageUrl: 'https://images.unsplash.com/photo-1575224300306-1b8da36134ec?auto=format&fit=crop&w=1600&q=85',
    badge: 'Spécial Récréation 🎪',
    title: 'Sucettes Géantes & Délices',
    highlight: 'Tourbillon 🌀',
    description: 'Retrouve la magie des fêtes foraines ! Des saveurs fruitées intenses et des textures irrésistibles à partager.',
    tag: 'Plus de 20 variétés de bonbons en stock',
    accentColor: 'from-amber-500 to-rose-500',
  },
  {
    id: 3,
    imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1600&q=85',
    badge: 'Sensations Pétillantes ⚡',
    title: 'Rubans Rainbow Ultra-Acides',
    highlight: '& Gélifiés 🌈',
    description: 'Fais le plein de friandises piquantes et passe ta commande en quelques secondes directement sur WhatsApp !',
    tag: 'Paiement à la livraison possible',
    accentColor: 'from-purple-500 to-pink-500',
  },
];

export const HeroCarousel: React.FC = () => {
  const { setIsWhatsAppModalOpen } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Automatic slide rotation every 3 seconds
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const handleScrollToCatalog = () => {
    const catalogElement = document.getElementById('catalog');
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      className="relative w-full overflow-hidden bg-slate-900 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Carrousel d'accueil"
    >
      {/* Slides Container */}
      <div className="relative h-[480px] sm:h-[540px] md:h-[600px] w-full">
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Background Image with Zoom effect */}
              <div
                className={`absolute inset-0 bg-cover bg-center transition-transform duration-7000 ease-out ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
                style={{
                  backgroundImage: `url(${slide.imageUrl})`,
                }}
              />

              {/* Gradient Overlays for optimal readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/20" />

              {/* Slide Content */}
              <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
                <div className="max-w-2xl text-white py-12 space-y-4 sm:space-y-6">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-bold text-pink-200 shadow-sm animate-fade-in">
                    <Sparkles className="w-3.5 h-3.5 text-pink-300" />
                    <span>{slide.badge}</span>
                  </div>

                  {/* Headline */}
                  <h1 className="text-3xl sm:text-5xl md:text-6xl font-candy font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
                    <span>{slide.title} </span>
                    <span className="bg-gradient-to-r from-pink-400 via-rose-300 to-amber-300 bg-clip-text text-transparent block sm:inline">
                      {slide.highlight}
                    </span>
                  </h1>

                  {/* Description */}
                  <p className="text-sm sm:text-base md:text-lg text-slate-200 max-w-xl leading-relaxed drop-shadow-xs">
                    {slide.description}
                  </p>

                  {/* Features info bar */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-pink-100/90 pt-1">
                    <span className="inline-flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-3 py-1 rounded-xl border border-white/10">
                      <Truck className="w-3.5 h-3.5 text-pink-400" />
                      <span>{slide.tag}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-3 py-1 rounded-xl border border-white/10">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>Qualité & Fraîcheur 100%</span>
                    </span>
                  </div>

                  {/* Call to Actions */}
                  <div className="flex flex-wrap items-center gap-3.5 pt-2 sm:pt-4">
                    <button
                      type="button"
                      onClick={handleScrollToCatalog}
                      className="px-6 sm:px-7 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-candy font-bold text-sm shadow-xl shadow-pink-500/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95 group"
                    >
                      <ShoppingBag className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Découvrir les bonbons</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsWhatsAppModalOpen(true)}
                      className="px-5 sm:px-6 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-candy font-bold text-sm border border-white/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      <span>Commander sur WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Image précédente"
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-2xl bg-slate-950/40 hover:bg-slate-950/70 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-90"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        aria-label="Image suivante"
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-2xl bg-slate-950/40 hover:bg-slate-950/70 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-90"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Carousel Progress & Indicator Dots */}
      <div className="absolute bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 bg-slate-950/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/15">
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => setCurrentSlide(index)}
              aria-label={`Aller à la diapositive ${index + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                isActive
                  ? 'w-7 sm:w-8 h-2.5 bg-gradient-to-r from-pink-400 to-rose-400'
                  : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          );
        })}
      </div>
    </section>
  );
};

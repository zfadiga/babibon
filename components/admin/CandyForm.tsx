'use client';

import React, { useState, useRef } from 'react';
import { createCandy, uploadCandyImage } from '@/lib/api';
import {
  PlusCircle,
  Loader2,
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle,
  FileImage,
} from 'lucide-react';

interface CandyFormProps {
  onCandyAdded?: () => void;
}

const CATEGORIES = [
  'Gummies & Jellies',
  'Chocolates & Truffles',
  'Hard Candies',
  'Lollipops',
  'Sour Sweets',
  'Marshmallows',
  'Licorice',
  'Caramels & Toffees',
  'Chewy Candies',
  'Gift Boxes & Mixes',
];

export default function CandyForm({ onCandyAdded }: CandyFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    description: '',
    stock: 0,
    category: CATEGORIES[0],
  });

  // Image Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value,
    }));
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Veuillez sélectionner un fichier image valide (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('La taille de l\'image ne doit pas dépasser 5 Mo.');
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const removeSelectedFile = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      if (!formData.name.trim()) throw new Error('Le nom du bonbon est obligatoire.');
      if (formData.price <= 0) throw new Error('Le prix doit être supérieur à 0.');

      let finalImageUrl = imageUrlInput.trim();

      if (selectedFile) {
        finalImageUrl = await uploadCandyImage(selectedFile);
      } else if (!finalImageUrl) {
        finalImageUrl =
          'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400';
      }

      const activeCategory = isCustomCategory
        ? customCategory.trim() || 'Assortiment'
        : formData.category;

      await createCandy({
        name: formData.name.trim(),
        price: Number(formData.price),
        description: formData.description.trim(),
        image_url: finalImageUrl,
        stock: Number(formData.stock) || 0,
        category: activeCategory,
      });

      setSuccessMsg(`"${formData.name}" a été ajouté au catalogue avec succès !`);

      // Reset form
      setFormData({
        name: '',
        price: 0,
        description: '',
        stock: 0,
        category: CATEGORIES[0],
      });
      removeSelectedFile();
      setIsCustomCategory(false);
      setCustomCategory('');

      if (onCandyAdded) onCandyAdded();
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible d\'ajouter la friandise.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 animate-fade-in">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
          <PlusCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Ajouter un nouveau bonbon</h2>
          <p className="text-xs text-gray-500">
            Enregistrez un nouvel article dans le catalogue produit
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center space-x-2 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Nom du bonbon *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Ex: Fraises Tagada Pétillantes"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Catégorie *
            </label>
            {!isCustomCategory ? (
              <div className="flex space-x-2">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(true)}
                  className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 cursor-pointer"
                >
                  Autre
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Nouvelle catégorie personnalisée"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(false)}
                  className="px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200 cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Prix (FCFA) *
            </label>
            <input
              type="number"
              name="price"
              step="50"
              min="0"
              required
              placeholder="Ex: 500"
              value={formData.price || ''}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
            />
          </div>

          {/* Stock */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Quantité en stock
            </label>
            <input
              type="number"
              name="stock"
              min="0"
              placeholder="Ex: 50"
              value={formData.stock || ''}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Description détaillée
          </label>
          <textarea
            name="description"
            rows={3}
            placeholder="Goût, texture, format du sachet..."
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
          />
        </div>

        {/* Image Upload Area */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Photo du bonbon
          </label>

          {previewUrl || imageUrlInput ? (
            <div className="relative w-40 h-40 rounded-2xl overflow-hidden border-2 border-rose-200 shadow-sm group">
              <img
                src={previewUrl || imageUrlInput}
                alt="Aperçu"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={removeSelectedFile}
                className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors shadow-md cursor-pointer"
                title="Supprimer la photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-rose-500 bg-rose-50'
                  : 'border-gray-200 hover:border-rose-400 bg-gray-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  Cliquez ou glissez une image ici
                </p>
                <p className="text-xs text-gray-400">PNG, JPG, WebP jusqu'à 5 Mo</p>
              </div>
            </div>
          )}

          {/* Fallback URL input */}
          <div className="mt-3">
            <input
              type="url"
              placeholder="Ou collez directement une URL d'image (ex: https://...)"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-rose-200 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-98"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Enregistrer le bonbon</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

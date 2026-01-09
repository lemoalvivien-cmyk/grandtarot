import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PhotoUpload({ currentPhotoUrl, onPhotoUploaded, lang = 'fr' }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentPhotoUrl);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(lang === 'fr' ? 'Veuillez sélectionner une image' : 'Please select an image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(lang === 'fr' ? 'Taille max : 5MB' : 'Max size: 5MB');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPreview(file_url);
      onPhotoUploaded(file_url);
    } catch (error) {
      console.error('Upload error:', error);
      alert(lang === 'fr' ? 'Erreur lors de l\'upload' : 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const content = {
    fr: {
      title: "Photo de profil",
      subtitle: "Obligatoire pour activer votre compte",
      upload: "Choisir une photo",
      change: "Changer"
    },
    en: {
      title: "Profile photo",
      subtitle: "Required to activate your account",
      upload: "Choose photo",
      change: "Change"
    }
  };

  const t = content[lang];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-sm font-medium text-slate-300 mb-1">{t.title}</h3>
        <p className="text-xs text-slate-500">{t.subtitle}</p>
      </div>

      <div className="flex flex-col items-center">
        {/* Preview */}
        <div className="relative group mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-violet-500/30 rounded-full blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative w-32 h-32 rounded-full bg-slate-800 border-2 border-amber-500/20 overflow-hidden flex items-center justify-center">
            {preview ? (
              <img src={preview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-12 h-12 text-slate-600" />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Upload Button */}
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <Button 
            type="button"
            disabled={uploading}
            className="bg-amber-500/20 border border-amber-500/30 text-amber-200 hover:bg-amber-500/30"
            asChild
          >
            <span>
              <Upload className="w-4 h-4 mr-2" />
              {preview ? t.change : t.upload}
            </span>
          </Button>
        </label>
      </div>
    </div>
  );
}
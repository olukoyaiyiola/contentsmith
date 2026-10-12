'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, AlertCircle, ArrowRight, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';

export default function TryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [offering, setOffering] = useState('');
  const [city, setCity] = useState('Lagos (Yaba)');
  const [audience, setAudience] = useState('Local neighborhood customers and weekend event planners');
  const [tone, setTone] = useState('Honest & Direct');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [productFiles, setProductFiles] = useState<File[]>([]);
  const [productPreviews, setProductPreviews] = useState<string[]>([]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo file size must be under 5 MB.');
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).slice(0, 2);
      const valid: File[] = [];
      const previews: string[] = [];

      for (const f of selected) {
        if (f.size > 5 * 1024 * 1024) {
          setError('Product photos must be under 5 MB each.');
          return;
        }
        valid.push(f);
        previews.push(URL.createObjectURL(f));
      }
      setProductFiles(valid);
      setProductPreviews(previews);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !offering.trim()) {
      setError('Please provide business name and offering.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('businessName', businessName);
      formData.append('offering', offering);
      formData.append('city', city);
      formData.append('audience', audience);
      formData.append('tone', tone);
      if (whatsappNumber) formData.append('whatsappNumber', whatsappNumber);
      if (logoFile) formData.append('logo', logoFile);
      productFiles.forEach((file) => {
        formData.append('productPhotos', file);
      });

      const res = await fetch('/api/trials/create', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start trial');
      }

      // Navigate to unguessable trial result view
      router.push(`/try/${data.slug}`);
    } catch (err: any) {
      setError(err?.message || 'A network error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#F5B301] border-[1.5px] border-[#121316] text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Free 48-Hour Trial</span>
        </div>
        <h1 className="font-display font-black text-2xl sm:text-4xl text-[#121316] tracking-tight mb-2">
          Create a week of shop content
        </h1>
        <p className="text-[#5C5F66] text-sm sm:text-base leading-relaxed">
          Provide shop basics below. ContentSmith extracts the brand identity and outputs 7 authentic posts with ready-to-use visuals.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 bg-amber-50 border-[1.5px] border-amber-600 rounded-lg flex items-start gap-3 text-amber-900 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-700 mt-0.5" />
          <div>
            <p className="font-bold">Notice</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Intake Form */}
      <form onSubmit={handleSubmit} className="signboard-card p-6 sm:p-8 rounded-xl space-y-6">
        {/* Business Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#121316] mb-1.5">
            Business Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Adunni Pastries Yaba"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border-[1.5px] border-[#121316] rounded text-sm text-[#121316] focus:outline-none focus:ring-2 focus:ring-[#F5B301]"
          />
        </div>

        {/* Offering */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#121316] mb-1.5">
            What do you sell or offer? <span className="text-red-600">*</span>
          </label>
          <textarea
            required
            rows={2}
            placeholder="e.g. Custom meat pies, birthday cakes, and freshly baked chin-chin for daily pickup"
            value={offering}
            onChange={(e) => setOffering(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border-[1.5px] border-[#121316] rounded text-sm text-[#121316] focus:outline-none focus:ring-2 focus:ring-[#F5B301]"
          />
        </div>

        {/* City & Audience Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#121316] mb-1.5">
              City / Neighborhood <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Lagos (Yaba)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border-[1.5px] border-[#121316] rounded text-sm text-[#121316] focus:outline-none focus:ring-2 focus:ring-[#F5B301]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#121316] mb-1.5">
              Target Audience
            </label>
            <input
              type="text"
              placeholder="e.g. Office workers and student shoppers"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border-[1.5px] border-[#121316] rounded text-sm text-[#121316] focus:outline-none focus:ring-2 focus:ring-[#F5B301]"
            />
          </div>
        </div>

        {/* Tone Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#121316] mb-2">
            Brand Tone
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {['Honest & Direct', 'Warm & Welcoming', 'Punchy & Energetic', 'Artisan & Traditional'].map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTone(t)}
                className={`py-2 px-3 rounded border-[1.5px] text-center font-medium transition-all ${
                  tone === t
                    ? 'bg-[#F5B301] border-[#121316] text-[#121316] font-bold shadow-[2px_2px_0px_#121316]'
                    : 'bg-[#FFFFFF] border-[#E5E2DA] text-[#5C5F66] hover:border-[#121316]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Logo Upload (Strongly Encouraged) */}
        <div className="pt-2 border-t border-[#E5E2DA]">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#121316]">
              Shop Logo Upload <span className="text-[#5C5F66] lowercase font-normal">(strongly recommended)</span>
            </label>
          </div>
          <p className="text-xs text-[#5C5F66] mb-3 leading-relaxed">
            ContentSmith extracts the exact hex palette, type character, and shape language from the logo so generated visuals match the real shopfront.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <label className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FFFFFF] border-[1.5px] border-dashed border-[#121316] rounded cursor-pointer hover:bg-neutral-50 text-xs font-semibold">
              <Upload className="w-4 h-4" />
              <span>{logoFile ? 'Replace logo' : 'Choose logo image (under 5 MB)'}</span>
              <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </label>
            {logoPreview && (
              <div className="flex items-center gap-2">
                <img src={logoPreview} alt="Logo preview" className="w-10 h-10 object-contain rounded border border-[#121316]" />
                <span className="text-xs text-[#121316] font-medium truncate max-w-[160px]">{logoFile?.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Product Photos Upload */}
        <div className="pt-2 border-t border-[#E5E2DA]">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#121316] mb-1.5">
            Product or Shop Photos <span className="text-[#5C5F66] lowercase font-normal">(optional, up to 2)</span>
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <label className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FFFFFF] border-[1.5px] border-dashed border-[#E5E2DA] hover:border-[#121316] rounded cursor-pointer hover:bg-neutral-50 text-xs font-semibold text-[#5C5F66] hover:text-[#121316]">
              <ImageIcon className="w-4 h-4" />
              <span>Select up to 2 product photos</span>
              <input type="file" accept="image/*" multiple onChange={handleProductChange} className="hidden" />
            </label>
            {productPreviews.length > 0 && (
              <div className="flex items-center gap-2">
                {productPreviews.map((url, i) => (
                  <img key={i} src={url} alt="Product preview" className="w-10 h-10 object-cover rounded border border-[#E5E2DA]" />
                ))}
                <span className="text-xs text-[#5C5F66]">{productFiles.length} photo(s) selected</span>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Contact */}
        <div className="pt-2 border-t border-[#E5E2DA]">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#121316] mb-1.5">
            WhatsApp Number <span className="text-[#5C5F66] lowercase font-normal">(optional, for pre-filled chat link)</span>
          </label>
          <input
            type="tel"
            placeholder="e.g. 08012345678"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border-[1.5px] border-[#121316] rounded text-sm text-[#121316] focus:outline-none focus:ring-2 focus:ring-[#F5B301]"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-danfo py-3.5 px-6 rounded text-base font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing brand identity &amp; assembling calendar...</span>
              </>
            ) : (
              <>
                <span>Generate Brand Identity &amp; 7-Day Plan</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <p className="text-center text-xs text-[#5C5F66] mt-3">
            Protected by daily community quota. Results remain accessible for 48 hours.
          </p>
        </div>
      </form>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  Image as ImageIcon,
  Key,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

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
  
  // Custom API Key & Model Settings
  const [apiKey, setApiKey] = useState('');
  const [openRouterApiKey, setOpenRouterApiKey] = useState('');
  const [imageProvider, setImageProvider] = useState<'openrouter' | 'gemini'>('openrouter');
  const [showKeyField, setShowKeyField] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('contentsmith_gemini_api_key');
    if (saved) {
      setApiKey(saved);
      setShowKeyField(true);
    }
    const savedOpenRouter = localStorage.getItem('contentsmith_openrouter_api_key');
    if (savedOpenRouter) {
      setOpenRouterApiKey(savedOpenRouter);
      setShowKeyField(true);
    }
    const savedProvider = localStorage.getItem('contentsmith_image_provider');
    if (savedProvider === 'gemini' || savedProvider === 'openrouter') {
      setImageProvider(savedProvider);
    }
  }, []);

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

      // Save & pass custom API keys and provider choice if entered
      if (apiKey.trim()) {
        localStorage.setItem('contentsmith_gemini_api_key', apiKey.trim());
        formData.append('apiKey', apiKey.trim());
      }
      if (openRouterApiKey.trim()) {
        localStorage.setItem('contentsmith_openrouter_api_key', openRouterApiKey.trim());
        formData.append('openRouterApiKey', openRouterApiKey.trim());
      }
      localStorage.setItem('contentsmith_image_provider', imageProvider);
      formData.append('imageProvider', imageProvider);

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
      if (err?.message?.toLowerCase().includes('api key')) {
        setShowKeyField(true);
      }
    }
  };

  const isKeyRelatedError = error && (
    error.toLowerCase().includes('api key') || 
    error.toLowerCase().includes('unauthorized') ||
    error.toLowerCase().includes('invalid_argument')
  );

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

      {/* Error banner with Vercel guidance */}
      {error && (
        <div className="mb-6 p-4 sm:p-5 bg-amber-50 border-[1.5px] border-amber-600 rounded-lg text-amber-950 text-xs sm:text-sm space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-700 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Notice</p>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>

          {isKeyRelatedError && (
            <div className="pt-3 border-t border-amber-300 text-xs text-amber-900 space-y-2">
              <p className="font-bold">How to fix in Vercel:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Open your project on the <strong>Vercel Dashboard</strong>.</li>
                <li>Go to <strong>Settings → Environment Variables</strong>.</li>
                <li>Add Key: <code className="bg-amber-200/80 px-1 py-0.5 rounded font-mono font-bold">GEMINI_API_KEY</code> (or <code className="bg-amber-200/80 px-1 py-0.5 rounded font-mono font-bold">GOOGLE_API_KEY</code>).</li>
                <li>Value: Paste your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold text-amber-950">Google AI Studio</a>.</li>
                <li>Click <strong>Save</strong> and trigger a quick <strong>Redeploy</strong>.</li>
              </ol>
              <p className="mt-2 text-[11px] text-amber-800">
                💡 <em>Alternatively, paste your key directly in the <strong>Gemini API Key</strong> box below to run immediately without redeploying.</em>
              </p>
            </div>
          )}
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

        {/* AI Engine & API Keys Configuration */}
        <div className="pt-2 border-t border-[#E5E2DA]">
          <button
            type="button"
            onClick={() => setShowKeyField(!showKeyField)}
            className="text-xs font-bold text-[#121316] hover:underline flex items-center gap-1.5"
          >
            <Key className="w-3.5 h-3.5 text-[#F5B301]" />
            <span>{showKeyField ? 'Hide AI Engine & Key settings' : 'Configure AI Engine & API Keys (Qwen Image / Gemini)'}</span>
          </button>

          {showKeyField && (
            <div className="mt-3 p-4 bg-[#F3F1EC] rounded-lg border border-[#E5E2DA] space-y-4">
              {/* Image Engine Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#121316] mb-1.5">
                  Visual Image Engine
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setImageProvider('openrouter')}
                    className={`p-3 rounded border text-left flex flex-col gap-1 transition-all ${
                      imageProvider === 'openrouter'
                        ? 'bg-amber-100/70 border-[#121316] shadow-[2px_2px_0px_#121316]'
                        : 'bg-white border-[#E5E2DA] hover:border-[#121316]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#121316]">Qwen Image 3 (OpenRouter)</span>
                      <span className="text-[10px] bg-[#F5B301] text-[#121316] font-bold px-1.5 py-0.5 rounded">Selected</span>
                    </div>
                    <span className="text-[11px] text-[#5C5F66]">
                      Commercial retail rendering &amp; photorealistic backgrounds.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageProvider('gemini')}
                    className={`p-3 rounded border text-left flex flex-col gap-1 transition-all ${
                      imageProvider === 'gemini'
                        ? 'bg-amber-100/70 border-[#121316] shadow-[2px_2px_0px_#121316]'
                        : 'bg-white border-[#E5E2DA] hover:border-[#121316]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#121316]">Imagen 3 (Google Gemini)</span>
                    </div>
                    <span className="text-[11px] text-[#5C5F66]">
                      Google native image generation pipeline.
                    </span>
                  </button>
                </div>
              </div>

              {/* OpenRouter API Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#121316]">
                    OpenRouter API Key {imageProvider === 'openrouter' && <span className="text-amber-800 font-normal">(for Qwen Image)</span>}
                  </label>
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-700 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Get Key at OpenRouter</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="sk-or-v1-..."
                  value={openRouterApiKey}
                  onChange={(e) => setOpenRouterApiKey(e.target.value)}
                  className="w-full p-2 bg-white border border-[#121316] rounded font-mono text-xs focus:ring-2 focus:ring-[#F5B301]"
                />
                <p className="text-[11px] text-[#5C5F66]">
                  Enter your OpenRouter key to generate images with Qwen, or set <code className="font-mono font-semibold">OPENROUTER_API_KEY</code> in Vercel environment variables.
                </p>
              </div>

              {/* Gemini API Key */}
              <div className="space-y-1.5 pt-2 border-t border-[#E5E2DA]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#121316]">
                    Gemini API Key (AI Studio)
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-700 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Get Key at Google AI Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full p-2 bg-white border border-[#121316] rounded font-mono text-xs focus:ring-2 focus:ring-[#F5B301]"
                />
                <p className="text-[11px] text-[#5C5F66]">
                  Used for brand identity extraction and 7-day calendar planning. If <code className="font-mono font-semibold">GEMINI_API_KEY</code> is set in Vercel, leave empty.
                </p>
              </div>
            </div>
          )}
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

'use client';

import { useEffect, useState, use, Suspense } from 'react';
import { 
  Trial, 
  TrialPost, 
  IdentityCard, 
  PostGenerationStatus 
} from '@/types/database';
import { siteConfig, getWhatsAppHref } from '@/config/site';
import { 
  Clock, 
  Check, 
  Copy, 
  Download, 
  RefreshCw, 
  Share2, 
  AlertTriangle, 
  Sparkles, 
  Eye, 
  Layers, 
  Palette,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';


function TrialContent({ slug }: { slug: string }) {
  const [trial, setTrial] = useState<Trial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Active selected post for modal
  const [activePost, setActivePost] = useState<TrialPost | null>(null);
  const [aspectRatioView, setAspectRatioView] = useState<'4:5' | '9:16'>('4:5');
  const [copiedCaptionId, setCopiedCaptionId] = useState<string | null>(null);
  
  // Palette editing modal/state
  const [editingPalette, setEditingPalette] = useState(false);
  const [primaryHex, setPrimaryHex] = useState('#121316');
  const [secondaryHex, setSecondaryHex] = useState('#EAE6DF');
  const [accentHex, setAccentHex] = useState('#F5B301');
  const [savingPalette, setSavingPalette] = useState(false);

  // Progressive generation state
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  // Load trial on mount
  useEffect(() => {
    fetchTrial();
  }, [slug]);

  const fetchTrial = async () => {
    try {
      const res = await fetch(`/api/trials/${slug}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Trial not found');
      }
      setTrial(data.trial);
      if (data.trial.identityCard?.palette) {
        setPrimaryHex(data.trial.identityCard.palette.primary);
        setSecondaryHex(data.trial.identityCard.palette.secondary);
        setAccentHex(data.trial.identityCard.palette.accent);
      }
      if (data.trial.posts && data.trial.posts.length > 0 && !activePost) {
        setActivePost(data.trial.posts[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not load trial');
    } finally {
      setLoading(false);
    }
  };

  // Update palette
  const handleSavePalette = async () => {
    setSavingPalette(true);
    try {
      const res = await fetch(`/api/trials/${slug}/update-palette`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary: primaryHex,
          secondary: secondaryHex,
          accent: accentHex,
        }),
      });
      const data = await res.json();
      if (res.ok && data.identityCard && trial) {
        setTrial({ ...trial, identityCard: data.identityCard });
        setEditingPalette(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPalette(false);
    }
  };

  // Progressive Generation (2 at a time)
  const generateSinglePost = async (post: TrialPost): Promise<TrialPost> => {
    setTrial(prev => {
      if (!prev || !prev.posts) return prev;
      return {
        ...prev,
        posts: prev.posts.map(p => p.id === post.id ? { ...p, generationStatus: 'generating' } : p)
      };
    });

    try {
      const savedApiKey = typeof window !== 'undefined' ? localStorage.getItem('contentsmith_gemini_api_key') : null;
      const res = await fetch(`/api/trials/${slug}/generate-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, apiKey: savedApiKey || undefined })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setTrial(prev => {
        if (!prev || !prev.posts) return prev;
        return {
          ...prev,
          posts: prev.posts.map(p => p.id === post.id ? data.post : p)
        };
      });
      return data.post;
    } catch (err: any) {
      setTrial(prev => {
        if (!prev || !prev.posts) return prev;
        return {
          ...prev,
          posts: prev.posts.map(p => p.id === post.id ? { ...p, generationStatus: 'failed', errorMessage: err?.message || 'Failed' } : p)
        };
      });
      throw err;
    }
  };

  const generateAllVisuals = async () => {
    if (!trial?.posts) return;
    setIsGeneratingAll(true);

    const queuedPosts = trial.posts.filter(p => p.generationStatus === 'queued' || p.generationStatus === 'failed');

    // Run 2 at a time
    for (let i = 0; i < queuedPosts.length; i += 2) {
      const batch = queuedPosts.slice(i, i + 2);
      await Promise.allSettled(batch.map(p => generateSinglePost(p)));
    }

    setIsGeneratingAll(false);
    fetchTrial();
  };

  const copyCaption = (post: TrialPost) => {
    navigator.clipboard.writeText(`${post.hook}\n\n${post.caption}\n\n${post.cta}`);
    setCopiedCaptionId(post.id);
    setTimeout(() => setCopiedCaptionId(null), 2500);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[#121316] border-t-[#F5B301] rounded-full animate-spin mb-4"></div>
        <p className="font-display font-bold text-lg text-[#121316]">Retrieving your content workspace...</p>
      </div>
    );
  }

  if (error || !trial) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="signboard-card p-8 rounded-xl">
          <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
          <h2 className="font-display font-black text-2xl mb-2">Workspace Unavailable</h2>
          <p className="text-sm text-[#5C5F66] mb-6">
            {error || 'This trial link has expired after 48 hours or cannot be found.'}
          </p>
          <a href="/try" className="btn-danfo px-6 py-2.5 rounded font-bold text-sm inline-block">
            Start a new trial
          </a>
        </div>
      </div>
    );
  }

  const posts = trial.posts || [];
  const readyCount = posts.filter(p => p.generationStatus === 'ready').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 48-Hour Expiration Banner */}
      <div className="mb-6 p-3 sm:p-4 signboard-border bg-[#F5B301]/20 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-[#121316] font-medium">
          <Clock className="w-4 h-4 text-[#121316]" />
          <span>
            Private 48-Hour Trial Workspace. Bookmark this URL: <strong className="font-mono">/try/{slug}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-[#121316]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Automatic purge in 48h</span>
        </div>
      </div>

      {/* Trial Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E5E2DA]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#121316] text-[#FFFFFF] text-xs font-bold uppercase tracking-wider rounded mb-2">
            <span>{trial.city}</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-4xl text-[#121316]">
            {trial.businessName}
          </h1>
          <p className="text-sm text-[#5C5F66] mt-1 max-w-xl">
            {trial.offering}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={generateAllVisuals}
            disabled={isGeneratingAll || readyCount === posts.length}
            className="btn-danfo px-5 py-2.5 rounded text-sm font-bold flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isGeneratingAll ? 'animate-spin' : ''}`} />
            <span>
              {isGeneratingAll
                ? 'Generating visuals (2 at a time)...'
                : readyCount === posts.length
                ? 'All 7 visuals ready'
                : `Generate visuals (${readyCount}/7 ready)`}
            </span>
          </button>
        </div>
      </div>

      {/* What ContentSmith Sees (Identity Card) */}
      <div className="mb-10 signboard-card p-5 sm:p-6 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-[#E5E2DA]">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#121316]" />
            <h2 className="font-display font-bold text-lg text-[#121316]">
              What ContentSmith sees (Brand Identity Card)
            </h2>
          </div>
          <button
            onClick={() => setEditingPalette(!editingPalette)}
            className="text-xs font-bold uppercase tracking-wider text-[#121316] hover:underline flex items-center gap-1"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{editingPalette ? 'Close palette editor' : 'Correct brand palette'}</span>
          </button>
        </div>

        {/* Identity Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs sm:text-sm">
          {/* Palette View / Editor */}
          <div>
            <span className="text-[#5C5F66] uppercase text-xs font-bold block mb-2">
              Color Palette (60 / 30 / 10)
            </span>
            {editingPalette ? (
              <div className="space-y-2 bg-[#F3F1EC] p-3 rounded border border-[#E5E2DA]">
                <div>
                  <label className="text-xs font-medium block text-[#121316]">Primary Ground (60%):</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={primaryHex}
                      onChange={(e) => setPrimaryHex(e.target.value)}
                      className="w-7 h-7 rounded border border-[#121316] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryHex}
                      onChange={(e) => setPrimaryHex(e.target.value)}
                      className="px-2 py-1 text-xs border border-[#121316] rounded font-mono w-24"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium block text-[#121316]">Secondary Ground (30%):</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={secondaryHex}
                      onChange={(e) => setSecondaryHex(e.target.value)}
                      className="w-7 h-7 rounded border border-[#121316] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={secondaryHex}
                      onChange={(e) => setSecondaryHex(e.target.value)}
                      className="px-2 py-1 text-xs border border-[#121316] rounded font-mono w-24"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium block text-[#121316]">Accent Tone (10%):</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={accentHex}
                      onChange={(e) => setAccentHex(e.target.value)}
                      className="w-7 h-7 rounded border border-[#121316] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={accentHex}
                      onChange={(e) => setAccentHex(e.target.value)}
                      className="px-2 py-1 text-xs border border-[#121316] rounded font-mono w-24"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSavePalette}
                  disabled={savingPalette}
                  className="w-full btn-danfo py-1.5 rounded text-xs font-bold mt-2"
                >
                  {savingPalette ? 'Saving...' : 'Apply Palette Update'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-8 h-8 rounded border border-[#121316] shadow-sm"
                    style={{ backgroundColor: trial.identityCard?.palette.primary || '#121316' }}
                    title="Primary"
                  ></span>
                  <span className="font-mono text-xs">{trial.identityCard?.palette.primary}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-8 h-8 rounded border border-[#121316] shadow-sm"
                    style={{ backgroundColor: trial.identityCard?.palette.secondary || '#EAE6DF' }}
                    title="Secondary"
                  ></span>
                  <span className="font-mono text-xs">{trial.identityCard?.palette.secondary}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-8 h-8 rounded border border-[#121316] shadow-sm"
                    style={{ backgroundColor: trial.identityCard?.palette.accent || '#F5B301' }}
                    title="Accent"
                  ></span>
                  <span className="font-mono text-xs">{trial.identityCard?.palette.accent}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tone & Shape Language */}
          <div>
            <span className="text-[#5C5F66] uppercase text-xs font-bold block mb-1">
              Voice &amp; Geometry
            </span>
            <p className="font-medium text-[#121316] mb-1">
              Tone: {trial.identityCard?.brandTone || trial.tone}
            </p>
            <p className="text-xs text-[#5C5F66]">
              Shape style: <span className="capitalize font-semibold text-[#121316]">{trial.identityCard?.shapeLanguage}</span> • Type: <span className="capitalize font-semibold text-[#121316]">{trial.identityCard?.typeCharacter}</span>
            </p>
          </div>

          {/* Things to Avoid */}
          <div>
            <span className="text-[#5C5F66] uppercase text-xs font-bold block mb-1">
              Strictly Avoided
            </span>
            <ul className="text-xs text-[#5C5F66] space-y-0.5 list-disc pl-4">
              {(trial.identityCard?.negativeCues || ["purple gradients", "neon glow", "floating 3D objects"]).map((cue, idx) => (
                <li key={idx}>{cue}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 7-Day Social Calendar Grid */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-[#121316]">
              7-Day Content Plan
            </h2>
            <p className="text-xs sm:text-sm text-[#5C5F66]">
              7 archetypes tailored to Nigerian trade objectives.
            </p>
          </div>

          {/* Aspect Ratio Switcher */}
          <div className="flex items-center gap-1 bg-[#FFFFFF] p-1 border border-[#121316] rounded text-xs font-bold">
            <button
              onClick={() => setAspectRatioView('4:5')}
              className={`px-3 py-1 rounded transition-colors ${
                aspectRatioView === '4:5' ? 'bg-[#F5B301] text-[#121316]' : 'text-[#5C5F66]'
              }`}
            >
              4:5 Feed
            </button>
            <button
              onClick={() => setAspectRatioView('9:16')}
              className={`px-3 py-1 rounded transition-colors ${
                aspectRatioView === '9:16' ? 'bg-[#F5B301] text-[#121316]' : 'text-[#5C5F66]'
              }`}
            >
              9:16 Status
            </button>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => {
            const isReady = post.generationStatus === 'ready';
            const isGenerating = post.generationStatus === 'generating';
            const isFailed = post.generationStatus === 'failed';
            const imageUrl = aspectRatioView === '4:5' ? post.feedImageUrl : post.storyImageUrl;

            return (
              <div
                key={post.id}
                className="signboard-card rounded-xl overflow-hidden flex flex-col justify-between"
              >
                {/* Visual Preview */}
                <div className={`relative bg-neutral-900 overflow-hidden flex items-center justify-center ${
                  aspectRatioView === '9:16' ? 'aspect-[9/16]' : 'aspect-[4/5]'
                }`}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={post.hook}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="p-6 text-center text-neutral-400">
                      {isGenerating ? (
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-[#F5B301]" />
                          <span className="text-xs font-semibold text-white">Generating visual...</span>
                        </div>
                      ) : isFailed ? (
                        <div className="flex flex-col items-center gap-2 text-rose-400">
                          <AlertTriangle className="w-6 h-6" />
                          <span className="text-xs font-semibold">{post.errorMessage || 'Generation failed'}</span>
                          <button
                            onClick={() => generateSinglePost(post)}
                            className="btn-danfo px-3 py-1 rounded text-xs font-bold text-[#121316] mt-2"
                          >
                            Retry generation
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Layers className="w-6 h-6 opacity-60" />
                          <span className="text-xs font-medium">Visual queued</span>
                          <button
                            onClick={() => generateSinglePost(post)}
                            className="btn-danfo px-3 py-1 rounded text-xs font-bold text-[#121316] mt-2"
                          >
                            Generate this visual
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Day Badge */}
                  <div className="absolute top-3 left-3 bg-[#121316] text-white text-xs font-bold px-2 py-0.5 rounded shadow">
                    Day {post.dayIndex} ({post.dayName})
                  </div>

                  {/* Archetype chip */}
                  <div className="absolute top-3 right-3 bg-[#F5B301] text-[#121316] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow">
                    {post.layoutArchetype.replace(/_/g, ' ')}
                  </div>
                </div>

                {/* Post Content Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C5F66] block mb-1">
                      {post.pillar}
                    </span>
                    <h3 className="font-display font-bold text-base text-[#121316] line-clamp-2 mb-2">
                      {post.hook}
                    </h3>
                    <p className="text-xs text-[#5C5F66] line-clamp-3 mb-3 leading-relaxed">
                      {post.caption}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E5E2DA] flex items-center justify-between gap-2">
                    <button
                      onClick={() => copyCaption(post)}
                      className="btn-outline px-2.5 py-1.5 rounded text-xs font-bold flex items-center gap-1.5"
                    >
                      {copiedCaptionId === post.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Caption</span>
                        </>
                      )}
                    </button>

                    {imageUrl && (
                      <a
                        href={imageUrl}
                        download={`${trial.businessName}_Day${post.dayIndex}_${aspectRatioView.replace(':', '_')}.png`}
                        className="btn-danfo px-2.5 py-1.5 rounded text-xs font-bold flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PNG</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WhatsApp Continuation CTA */}
      <section className="signboard-border bg-[#F5B301] p-6 sm:p-10 rounded-xl mb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8">
            <span className="bg-[#121316] text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-2 inline-block">
              Trial Complete
            </span>
            <h3 className="font-display font-black text-2xl sm:text-3xl text-[#121316] mb-2">
              Ready to take this into monthly production?
            </h3>
            <p className="text-sm text-[#121316]/80 leading-relaxed">
              Connect directly with the ContentSmith craft desk. Share this trial slug ({slug}) to discuss dedicated weekly calendar production, photography clean-up, and ongoing publication.
            </p>
          </div>

          <div className="md:col-span-4 flex flex-col gap-3">
            <a
              href={getWhatsAppHref(`Hello ContentSmith, I just reviewed my 7-day calendar for ${trial.businessName} (Trial reference: ${slug}). I would like to speak about continuing this work.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ink py-3 px-4 rounded text-center text-sm font-bold flex items-center justify-center gap-2"
            >
              <span>Continue on WhatsApp</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={`/designers?trialId=${slug}`}
              className="btn-outline py-2.5 px-4 rounded text-center text-xs font-bold"
            >
              Request a Human Designer →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function TrialResultPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolved = use(params);
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[#121316] border-t-[#F5B301] rounded-full animate-spin mb-4"></div>
        <p className="font-display font-bold text-lg text-[#121316]">Loading trial workspace...</p>
      </div>
    }>
      <TrialContent slug={resolved.slug} />
    </Suspense>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { ExampleItem } from '@/types/database';
import { 
  Filter, 
  Send, 
  CheckCircle2, 
  Layers, 
  Sparkles, 
  AlertCircle, 
  Check, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function ExamplesPage() {
  const [examples, setExamples] = useState<ExampleItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');

  // Submit Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [businessName, setBusinessName] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [industry, setIndustry] = useState('Food & Bakery');
  const [platform, setPlatform] = useState('Instagram 4:5');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [notes, setNotes] = useState('');
  const [consentAgreed, setConsentAgreed] = useState(false);

  useEffect(() => {
    fetch('/api/admin/overview')
      .then((res) => res.json())
      .then((data) => {
        if (data.examples) {
          setExamples(data.examples.filter((e: ExampleItem) => e.isPublished));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const industries = ['All', 'Food & Bakery', 'Fashion & Apparel', 'Craft & Retail'];
  const platforms = ['All', 'Instagram 4:5', 'WhatsApp Status 9:16'];

  const filtered = examples.filter((item) => {
    const matchInd = selectedIndustry === 'All' || item.industry === selectedIndustry;
    const matchPlat = selectedPlatform === 'All' || item.platform === selectedPlatform;
    return matchInd && matchPlat;
  });

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentAgreed) {
      setSubmitError('Consent is required to submit work for public showcase.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/examples/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          submitterName,
          contactInfo,
          industry,
          platform,
          imageUrl,
          caption,
          notes,
          consentAgreed,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit work');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setShowSubmitModal(false);
        setSubmitSuccess(false);
        // Reset form
        setBusinessName('');
        setSubmitterName('');
        setContactInfo('');
        setImageUrl('');
        setCaption('');
        setConsentAgreed(false);
      }, 2000);
    } catch (err: any) {
      setSubmitError(err?.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-[#E5E2DA]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#F5B301] border-[1.5px] border-[#121316] text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Showcase Gallery</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-[#121316] tracking-tight mb-2">
            Real content by real merchants
          </h1>
          <p className="text-sm sm:text-base text-[#5C5F66] max-w-xl">
            Live marketing output from Nigerian bakeries, clothiers, and artisan shops. Filterable by industry and format.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="btn-danfo px-5 py-2.5 rounded text-sm font-bold flex items-center gap-2 self-start md:self-auto"
        >
          <span>Submit your work</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        {/* Industry Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5C5F66] mr-1">
            Industry:
          </span>
          {industries.map((ind) => (
            <button
              key={ind}
              onClick={() => setSelectedIndustry(ind)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                selectedIndustry === ind
                  ? 'bg-[#121316] text-[#FFFFFF]'
                  : 'bg-[#FFFFFF] border border-[#E5E2DA] text-[#5C5F66] hover:border-[#121316]'
              }`}
            >
              {ind}
            </button>
          ))}
        </div>

        {/* Platform Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5C5F66] mr-1">
            Format:
          </span>
          {platforms.map((plat) => (
            <button
              key={plat}
              onClick={() => setSelectedPlatform(plat)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                selectedPlatform === plat
                  ? 'bg-[#F5B301] border border-[#121316] text-[#121316]'
                  : 'bg-[#FFFFFF] border border-[#E5E2DA] text-[#5C5F66] hover:border-[#121316]'
              }`}
            >
              {plat}
            </button>
          ))}
        </div>
      </div>

      {/* Showcase Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#121316] border-t-[#F5B301] rounded-full animate-spin mb-4"></div>
          <p className="font-display font-bold text-sm text-[#121316]">Loading curated examples...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="signboard-card p-12 text-center rounded-xl">
          <Layers className="w-8 h-8 mx-auto text-[#5C5F66] mb-2" />
          <p className="text-sm font-semibold text-[#121316]">No published items in this filter combination yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((item) => (
            <div key={item.id} className="signboard-card rounded-xl overflow-hidden flex flex-col justify-between">
              {/* Media Container */}
              <div className="relative aspect-[4/5] bg-neutral-900 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-[#121316] text-white text-[11px] font-bold px-2 py-0.5 rounded shadow">
                  {item.platform}
                </div>
                <div className="absolute top-3 right-3 bg-[#F5B301] text-[#121316] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow">
                  {item.industry}
                </div>
              </div>

              {/* Item Info */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-[#121316]">{item.makerCredit}</span>
                    {item.consentFlag && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Consent Verified
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-base text-[#121316] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#5C5F66] leading-relaxed mb-4">
                    {item.caption}
                  </p>
                </div>

                {/* Why It Works Box */}
                <div className="p-3 bg-[#F3F1EC] rounded border border-[#E5E2DA] text-xs">
                  <span className="font-bold text-[#121316] block mb-0.5">Why it works:</span>
                  <p className="text-[#5C5F66] leading-normal">{item.whyItWorks}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Work Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-[#121316]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border-[1.5px] border-[#121316] shadow-[4px_4px_0px_#121316] rounded-xl max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display font-black text-xl mb-1 text-[#121316]">
              Submit Work for Showcase
            </h2>
            <p className="text-xs text-[#5C5F66] mb-6">
              Share real flyers or posts created for your business. Submissions enter a moderation queue and appear only after approval.
            </p>

            {submitSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-600 rounded-lg text-center text-emerald-900">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h3 className="font-bold text-base">Submission Received</h3>
                <p className="text-xs mt-1">Thank you. The craft team will review your work shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitWork} className="space-y-4 text-xs">
                {submitError && (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded text-rose-800">
                    {submitError}
                  </div>
                )}

                <div>
                  <label className="block font-bold text-[#121316] mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Bakehouse Lagos"
                    className="w-full p-2 border border-[#121316] rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#121316] mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={submitterName}
                      onChange={(e) => setSubmitterName(e.target.value)}
                      placeholder="e.g. Funke O."
                      className="w-full p-2 border border-[#121316] rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#121316] mb-1">Contact (Email/WhatsApp) *</label>
                    <input
                      type="text"
                      required
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      placeholder="e.g. 08012345678"
                      className="w-full p-2 border border-[#121316] rounded"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#121316] mb-1">Industry</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full p-2 border border-[#121316] rounded bg-white"
                    >
                      <option>Food &amp; Bakery</option>
                      <option>Fashion &amp; Apparel</option>
                      <option>Craft &amp; Retail</option>
                      <option>Professional Services</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-[#121316] mb-1">Platform</label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full p-2 border border-[#121316] rounded bg-white"
                    >
                      <option>Instagram 4:5</option>
                      <option>WhatsApp Status 9:16</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#121316] mb-1">Image URL / Link *</label>
                  <input
                    type="url"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2 border border-[#121316] rounded"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#121316] mb-1">Caption / Notes</label>
                  <textarea
                    rows={2}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Provide the caption or brief backstory"
                    className="w-full p-2 border border-[#121316] rounded"
                  />
                </div>

                {/* Consent Checkbox */}
                <div className="pt-2 border-t border-[#E5E2DA]">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={consentAgreed}
                      onChange={(e) => setConsentAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-[#121316]"
                    />
                    <span className="text-[11px] text-[#5C5F66]">
                      I confirm that I own or represent this business and grant ContentSmith permission to display this work publicly in the showcase gallery.
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 border border-[#121316] rounded font-semibold text-[#121316]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !consentAgreed}
                    className="btn-danfo px-5 py-2 rounded font-bold text-[#121316] disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit for review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

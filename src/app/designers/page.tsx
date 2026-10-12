'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { siteConfig, getWhatsAppHref, getNeyeWhatsAppHref } from '@/config/site';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Palette, 
  ArrowRight,
  MessageSquare
} from 'lucide-react';

function DesignersForm() {
  const searchParams = useSearchParams();
  const trialIdParam = searchParams.get('trialId') || '';

  const [businessName, setBusinessName] = useState('');
  const [preferredDirection, setPreferredDirection] = useState('');
  const [rejectedDirections, setRejectedDirections] = useState('');
  const [deadline, setDeadline] = useState('Within 5 working days');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [trialId, setTrialId] = useState(trialIdParam);
  const [referenceUrl, setReferenceUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (trialIdParam) {
      setTrialId(trialIdParam);
    }
  }, [trialIdParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/designers/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          preferredDirection,
          rejectedDirections,
          deadline,
          whatsappNumber,
          trialId: trialId || undefined,
          referenceAssetUrls: referenceUrl ? [referenceUrl] : [],
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit designer request');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Submission error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5B301] border-[1.5px] border-[#121316] text-xs font-bold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Human Craft Studio</span>
        </div>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-[#121316] tracking-tight mb-4">
          Bespoke design for Nigerian trade
        </h1>
        <p className="text-sm sm:text-base text-[#5C5F66] leading-relaxed mb-6">
          When software is not enough. The ContentSmith fellowship provides dedicated graphic artists for custom logo marks, physical packaging labels, printed signboards, and comprehensive menu systems.
        </p>

        {/* Quote on Request Banner */}
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#121316] text-[#FFFFFF] rounded-md font-display font-bold text-sm tracking-wide shadow">
          <span>Quote on request</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#F5B301]"></span>
          <span className="text-[#EAE6DF] font-normal text-xs">Tailored to exact project scope</span>
        </div>
      </div>

      {/* Process Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div className="signboard-card p-5 rounded-lg text-center">
          <Palette className="w-6 h-6 mx-auto mb-2 text-[#121316]" />
          <h3 className="font-display font-bold text-sm text-[#121316] mb-1">Tailored Visual Lockups</h3>
          <p className="text-xs text-[#5C5F66]">Clean vector assets crafted specifically for your packaging and print signboards.</p>
        </div>
        <div className="signboard-card p-5 rounded-lg text-center">
          <Clock className="w-6 h-6 mx-auto mb-2 text-[#121316]" />
          <h3 className="font-display font-bold text-sm text-[#121316] mb-1">Reliable Turnaround</h3>
          <p className="text-xs text-[#5C5F66]">Clear deadlines agreed upon in advance with zero missed delivery promises.</p>
        </div>
        <div className="signboard-card p-5 rounded-lg text-center">
          <MessageSquare className="w-6 h-6 mx-auto mb-2 text-[#121316]" />
          <h3 className="font-display font-bold text-sm text-[#121316] mb-1">Direct WhatsApp Desk</h3>
          <p className="text-xs text-[#5C5F66]">Iterate directly with your assigned designer without tedious ticketing portals.</p>
        </div>
      </div>

      {/* Intake Form */}
      <div className="signboard-card p-6 sm:p-10 rounded-xl">
        <h2 className="font-display font-black text-xl sm:text-2xl mb-1 text-[#121316]">
          Request a Designer Consultation
        </h2>
        <p className="text-xs sm:text-sm text-[#5C5F66] mb-6">
          Complete the brief below. A senior craft lead will review the specifications and reply on WhatsApp with estimated timelines and a project quote.
        </p>

        {submitted ? (
          <div className="p-8 bg-emerald-50 border-[1.5px] border-emerald-600 rounded-lg text-center text-emerald-900">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <h3 className="font-display font-bold text-xl mb-2">Request Logged Successfully</h3>
            <p className="text-sm text-emerald-800 max-w-md mx-auto mb-6">
              Your brief has been assigned to our strategy desk. <strong>Neye (+234 916 271 6205)</strong> will contact you via WhatsApp ({whatsappNumber}) within one business day.
            </p>
            <a
              href={getNeyeWhatsAppHref(`Hello Neye, I submitted a bespoke content strategy & design request for ${businessName}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-danfo px-6 py-3 rounded text-sm font-bold inline-block"
            >
              Confirm with Neye on WhatsApp directly
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 text-xs sm:text-sm">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded text-rose-800">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#121316] mb-1.5">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adunni Pastries Yaba"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full p-2.5 border-[1.5px] border-[#121316] rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#121316] mb-1.5">
                  WhatsApp Contact Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 08012345678"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full p-2.5 border-[1.5px] border-[#121316] rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#121316] mb-1.5">
                Preferred Visual Direction *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Describe the desired aesthetic (e.g. Traditional Nigerian sign-painting, warm earth tones, bold heavy lettering for bakery flyers)"
                value={preferredDirection}
                onChange={(e) => setPreferredDirection(e.target.value)}
                className="w-full p-2.5 border-[1.5px] border-[#121316] rounded"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#121316] mb-1.5">
                Rejected Directions / What to Avoid *
              </label>
              <textarea
                required
                rows={2}
                placeholder="What must be avoided? (e.g. No flashy neon gradients, no overly glossy plastic textures, no generic clip art)"
                value={rejectedDirections}
                onChange={(e) => setRejectedDirections(e.target.value)}
                className="w-full p-2.5 border-[1.5px] border-[#121316] rounded"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#121316] mb-1.5">
                  Project Deadline *
                </label>
                <select
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-2.5 border-[1.5px] border-[#121316] rounded bg-white"
                >
                  <option>Urgent (Within 48 hours)</option>
                  <option>Standard (Within 5 working days)</option>
                  <option>End of Month</option>
                  <option>Flexible / Planning ahead</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#121316] mb-1.5">
                  Associated Trial ID (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12-char trial reference"
                  value={trialId}
                  onChange={(e) => setTrialId(e.target.value)}
                  className="w-full p-2.5 border-[1.5px] border-[#121316] rounded font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#121316] mb-1.5">
                Reference Image or Moodboard Link (optional)
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/... or image link"
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                className="w-full p-2.5 border-[1.5px] border-[#121316] rounded"
              />
            </div>

            <div className="pt-4 border-t border-[#E5E2DA]">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-danfo py-3.5 px-6 rounded text-sm sm:text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Submitting brief...' : 'Submit Designer Brief for Quote'}
              </button>
              <p className="text-center text-xs text-[#5C5F66] mt-2.5">
                No upfront fee required. Quotes provided based on merchant scope.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function DesignersPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-bold">Loading Designers portal...</div>}>
      <DesignersForm />
    </Suspense>
  );
}

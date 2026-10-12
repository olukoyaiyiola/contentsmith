import { siteConfig } from "@/config/site";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-16">
      <div className="mb-8 pb-4 border-b border-[#E5E2DA]">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-[#121316] mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-[#5C5F66]">
          Commercial guidelines and fair use rules for ContentSmith.
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-[#121316]">
        <div className="signboard-card p-6 rounded-lg">
          <h2 className="font-display font-bold text-base mb-2">1. Merchant Content Ownership</h2>
          <p className="text-[#5C5F66]">
            You retain 100% full commercial ownership of all marketing content, captions, post structures, and visual flyers generated through your ContentSmith trial. You are free to publish, print, or distribute them across any social media network or physical medium without paying licensing royalties.
          </p>
        </div>

        <div className="signboard-card p-6 rounded-lg">
          <h2 className="font-display font-bold text-base mb-2">2. Fair Use &amp; Abuse Prevention</h2>
          <p className="text-[#5C5F66]">
            ContentSmith provides free trial access to assist small businesses. To prevent automated bot abuse and ensure system stability, we enforce a strict limit of 1 trial per IP per 24 hours (and 3 trials per week), as well as a daily global server quota. Attempts to circumvent rate limits via automated scrapers are prohibited.
          </p>
        </div>

        <div className="signboard-card p-6 rounded-lg">
          <h2 className="font-display font-bold text-base mb-2">3. Service Availability &amp; Kill Switch</h2>
          <p className="text-[#5C5F66]">
            While we strive for maximum uptime, generation services depend on upstream AI infrastructure. ContentSmith administrators reserve the right to engage a temporary maintenance kill switch during scheduled updates or service spikes.
          </p>
        </div>

        <div className="signboard-card p-6 rounded-lg">
          <h2 className="font-display font-bold text-base mb-2">4. Fellowship Relationship</h2>
          <p className="text-[#5C5F66]">
            ContentSmith the software is maintained by the ContentSmith fellowship. The software provides quick exploratory content; long-term tailored visual identity programs and bespoke brand systems are arranged directly through human designer engagements.
          </p>
        </div>
      </div>
    </div>
  );
}

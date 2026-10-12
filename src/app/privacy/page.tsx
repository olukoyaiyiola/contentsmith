import { siteConfig } from "@/config/site";
import { ShieldCheck, Clock, Trash2, Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-16">
      <div className="mb-8 pb-4 border-b border-[#E5E2DA]">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-[#121316] mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-[#5C5F66]">
          Clear and honest data practices for Nigerian business owners.
        </p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-[#121316]">
        <section className="signboard-card p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-2 text-base font-display font-bold">
            <Clock className="w-5 h-5 text-[#F5B301]" />
            <h2>48-Hour Ephemeral Retention</h2>
          </div>
          <p className="text-[#5C5F66]">
            Every trial generated on ContentSmith is ephemeral. Uploaded logos, product photos, and resulting visual flyers exist at a random, unguessable URL for exactly 48 hours. When 48 hours elapse, the system automatically purges the trial record and permanently deletes all image files from storage.
          </p>
        </section>

        <section className="signboard-card p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-2 text-base font-display font-bold">
            <Trash2 className="w-5 h-5 text-[#F5B301]" />
            <h2>EXIF Metadata Stripping</h2>
          </div>
          <p className="text-[#5C5F66]">
            Photos taken on mobile phones often contain embedded metadata (such as GPS coordinates, camera model, and camera settings). ContentSmith automatically scrubs all EXIF metadata on our servers before processing or storing images.
          </p>
        </section>

        <section className="signboard-card p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-2 text-base font-display font-bold">
            <Lock className="w-5 h-5 text-[#F5B301]" />
            <h2>WhatsApp Numbers &amp; Contacts</h2>
          </div>
          <p className="text-[#5C5F66]">
            Any WhatsApp numbers provided are used exclusively to facilitate prefilled communication between the merchant and our craft desk. We do not sell, spam, or share phone records with third parties.
          </p>
        </section>

        <section className="signboard-card p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-2 text-base font-display font-bold">
            <ShieldCheck className="w-5 h-5 text-[#F5B301]" />
            <h2>Model Privacy &amp; Data Isolation</h2>
          </div>
          <p className="text-[#5C5F66]">
            Images and prompts sent to Gemini run via secure server-side API calls. We do not expose client API tokens in browser bundles, and uploads are never indexed publicly unless you explicitly submit your work to the Examples showcase.
          </p>
        </section>
      </div>
    </div>
  );
}

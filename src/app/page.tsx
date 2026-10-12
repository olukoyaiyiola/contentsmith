import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Sparkles, Calendar, ArrowRight, ShieldCheck, Clock, MessageSquare } from "lucide-react";

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-16">
      {/* Hero Section */}
      <section className="mb-16 sm:mb-24">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5B301] border-[1.5px] border-[#121316] text-xs font-bold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Made for Nigerian Enterprise</span>
        </div>

        <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-[#121316] tracking-tight leading-[1.08] max-w-4xl mb-6">
          A week of authentic social posts and brand-aligned visual flyers.
        </h1>

        <p className="text-base sm:text-xl text-[#5C5F66] max-w-2xl leading-relaxed mb-8">
          Upload a shop logo and product photos. ContentSmith extracts the brand palette, constructs a 7-day social calendar, and renders clear visual announcements for Instagram and WhatsApp Status.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/try"
            className="btn-danfo px-6 py-3.5 rounded text-sm sm:text-base font-bold flex items-center gap-2"
          >
            <span>Generate a free 7-day calendar</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/examples"
            className="btn-outline px-6 py-3.5 rounded text-sm sm:text-base font-semibold"
          >
            Inspect showcase examples
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-[#E5E2DA]">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-[#5C5F66]">
            <Clock className="w-4 h-4 text-[#121316]" />
            <span>Ready in under 90 seconds</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-[#5C5F66]">
            <ShieldCheck className="w-4 h-4 text-[#121316]" />
            <span>Zero generic AI templates</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-[#5C5F66]">
            <MessageSquare className="w-4 h-4 text-[#121316]" />
            <span>1-tap WhatsApp sharing</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-[#5C5F66]">
            <span className="w-3.5 h-3.5 bg-[#F5B301] border border-[#121316] inline-block"></span>
            <span>48-hour private trial link</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-16 sm:mb-24">
        <div className="mb-10">
          <h2 className="font-display font-black text-2xl sm:text-4xl text-[#121316] tracking-tight mb-3">
            How ContentSmith operates
          </h2>
          <p className="text-[#5C5F66] text-sm sm:text-base">
            Grounded in daily commerce. Designed for phones on everyday mobile connections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="signboard-card p-6 rounded-lg relative flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded bg-[#121316] text-[#FFFFFF] font-display font-black flex items-center justify-center text-sm mb-4">
                01
              </div>
              <h3 className="font-display font-bold text-lg text-[#121316] mb-2">
                Supply the shop basics
              </h3>
              <p className="text-sm text-[#5C5F66] leading-relaxed">
                Provide business name, trade category, and city. Upload the shop logo and up to two recent product photos.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#E5E2DA] text-xs font-semibold text-[#121316]">
              Takes 45 seconds on mobile
            </div>
          </div>

          {/* Step 2 */}
          <div className="signboard-card p-6 rounded-lg relative flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded bg-[#F5B301] text-[#121316] border border-[#121316] font-display font-black flex items-center justify-center text-sm mb-4">
                02
              </div>
              <h3 className="font-display font-bold text-lg text-[#121316] mb-2">
                Verify brand identity
              </h3>
              <p className="text-sm text-[#5C5F66] leading-relaxed">
                ContentSmith inspects the logo colors and shapes to construct an Identity Card. Tweak the hex colors if preferred before generating.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#E5E2DA] text-xs font-semibold text-[#121316]">
              Full palette oversight
            </div>
          </div>

          {/* Step 3 */}
          <div className="signboard-card p-6 rounded-lg relative flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded bg-[#121316] text-[#FFFFFF] font-display font-black flex items-center justify-center text-sm mb-4">
                03
              </div>
              <h3 className="font-display font-bold text-lg text-[#121316] mb-2">
                Receive the week plan
              </h3>
              <p className="text-sm text-[#5C5F66] leading-relaxed">
                A 7-day social grid appears immediately with real Yoruba-compatible typography overlays. Download PNGs or export directly to WhatsApp Status.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#E5E2DA] text-xs font-semibold text-[#121316]">
              4:5 Feed &amp; 9:16 WhatsApp Status
            </div>
          </div>
        </div>
      </section>

      {/* Acceptance Persona Spotlight */}
      <section className="mb-16 signboard-border bg-[#FFFFFF] p-6 sm:p-10 rounded-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8">
            <span className="danfo-badge px-2.5 py-1 text-xs rounded uppercase inline-block mb-3">
              Case in point
            </span>
            <h3 className="font-display font-black text-2xl sm:text-3xl mb-3">
              Adunni Pastries, Commercial Avenue, Yaba
            </h3>
            <p className="text-sm sm:text-base text-[#5C5F66] leading-relaxed mb-4">
              A pastry shop with no dedicated graphic artist. She uploads her shop sign and two photos of warm meat pies. Within two minutes, she has seven distinct posts: Wednesday batch prep, Friday bulk party slots, and Sunday restock alerts with clean typographic flyers.
            </p>
            <div className="flex items-center gap-4 text-xs font-semibold text-[#121316]">
              <span>• Zero graphic software needed</span>
              <span>• Complete data privacy</span>
              <span>• 48-hour unguessable link</span>
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-3">
            <Link
              href="/try"
              className="btn-danfo py-3 px-4 rounded text-center text-sm font-bold"
            >
              Start trial for a shop
            </Link>
            <a
              href={siteConfig.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline py-3 px-4 rounded text-center text-sm font-semibold flex items-center justify-center gap-2"
            >
              <span>Speak with the craft desk</span>
            </a>
          </div>
        </div>
      </section>

      {/* The Fellowship Connection */}
      <section className="border-t border-[#E5E2DA] pt-12 pb-6">
        <div className="max-w-2xl">
          <h4 className="font-display font-bold text-base text-[#121316] uppercase tracking-wide mb-2">
            The ContentSmith Fellowship
          </h4>
          <p className="text-sm text-[#5C5F66] leading-relaxed">
            ContentSmith the software is maintained by the ContentSmith fellowship, an initiative supporting visual craft and enterprise across West Africa. The software provides speed; human artisans handle tailored long-term commissions.
          </p>
        </div>
      </section>
    </div>
  );
}

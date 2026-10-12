import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ContentSmith — Content Calendars & Visual Identity for Nigerian SMEs",
  description: "Transform your logo and product photos into a week of authentic social posts and brand-aligned visual flyers. Built for Nigerian businesses.",
  metadataBase: new URL("https://contentsmith.ng"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${bricolage.variable} ${instrumentSans.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#FBFBFA] text-[#121316]">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-40 bg-[#FBFBFA]/95 backdrop-blur-md border-b-[1.5px] border-[#121316]">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="w-6 h-6 bg-[#F5B301] border-[1.5px] border-[#121316] flex items-center justify-center font-display font-extrabold text-xs">
                C
              </span>
              <span className="font-display font-black text-xl tracking-tight text-[#121316]">
                ContentSmith
              </span>
            </Link>

            {/* Desktop & Mobile Navigation Links */}
            <nav className="flex items-center gap-3 sm:gap-6 text-sm font-medium">
              <Link
                href="/try"
                className="text-[#121316] hover:underline underline-offset-4 font-semibold"
              >
                Try it
              </Link>
              <Link
                href="/examples"
                className="text-[#121316] hover:underline underline-offset-4 hidden xs:inline-block"
              >
                Examples
              </Link>
              <Link
                href="/designers"
                className="text-[#121316] hover:underline underline-offset-4 hidden sm:inline-block"
              >
                Designers
              </Link>
              <Link
                href="/try"
                className="btn-danfo px-3.5 py-1.5 rounded text-xs sm:text-sm tracking-wide"
              >
                Request access
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t-[1.5px] border-[#121316] bg-[#FFFFFF] py-10 mt-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 bg-[#F5B301] border-[1.5px] border-[#121316] flex items-center justify-center font-display font-bold text-xs">
                    C
                  </span>
                  <span className="font-display font-bold text-lg">ContentSmith</span>
                </div>
                <p className="text-sm text-[#5C5F66] leading-relaxed max-w-sm">
                  Content calendars and visual identity for Nigerian businesses. Built phone-first for daily merchants.
                </p>
              </div>

              <div>
                <h4 className="font-display font-bold text-sm uppercase tracking-wider mb-3">Navigation</h4>
                <ul className="space-y-2 text-sm text-[#5C5F66]">
                  <li><Link href="/try" className="hover:text-[#121316]">Try it (Free 48h Trial)</Link></li>
                  <li><Link href="/examples" className="hover:text-[#121316]">Examples Gallery</Link></li>
                  <li><Link href="/designers" className="hover:text-[#121316]">Human Designers</Link></li>
                  <li><Link href="/admin" className="hover:text-[#121316]">Admin Portal</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-display font-bold text-sm uppercase tracking-wider mb-3">Contact &amp; Strategy</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-xs text-[#5C5F66] block">Merchant Support Desk (Iyi):</span>
                    <a
                      href={siteConfig.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-bold text-[#121316] hover:underline"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      WhatsApp {siteConfig.whatsappDisplay} (Iyi)
                    </a>
                  </div>
                  <div>
                    <span className="text-xs text-[#5C5F66] block">Tailored Strategy &amp; Planning (Neye):</span>
                    <a
                      href={siteConfig.neyeWhatsAppLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-bold text-[#121316] hover:underline"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#F5B301]"></span>
                      WhatsApp {siteConfig.neyeWhatsAppDisplay} (Neye)
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Fellowship Notice & Legal */}
            <div className="border-t border-[#E5E2DA] pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-[#5C5F66]">
              <p className="max-w-xl italic">
                {siteConfig.fellowshipNote}
              </p>
              <div className="flex items-center gap-4">
                <Link href="/privacy" className="hover:underline">Privacy</Link>
                <span>•</span>
                <Link href="/terms" className="hover:underline">Terms</Link>
                <span>•</span>
                <span>Lagos, Nigeria</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

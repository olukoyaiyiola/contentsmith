export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  whatsappLink: string;
  fellowshipNote: string;
  navItems: { label: string; href: string }[];
  dailyTrialCap: number;
}

export const siteConfig: SiteConfig = {
  name: "ContentSmith",
  tagline: "Content calendars and visual identity for Nigerian businesses.",
  description: "Transform your logo and product photos into a week of authentic social posts and brand-aligned visual flyers.",
  whatsappNumber: "2347032293819",
  whatsappDisplay: "07032293819",
  whatsappLink: "https://wa.me/2347032293819",
  fellowshipNote: "ContentSmith the software is maintained by the ContentSmith fellowship, an initiative supporting visual craft and enterprise across West Africa.",
  navItems: [
    { label: "Try it", href: "/try" },
    { label: "Examples", href: "/examples" },
    { label: "Designers", href: "/designers" },
  ],
  dailyTrialCap: 50,
};

export function getWhatsAppHref(message?: string): string {
  const base = `https://wa.me/${siteConfig.whatsappNumber}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

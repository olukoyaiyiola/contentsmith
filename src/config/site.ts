export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  // General merchant support desk (Iyi)
  whatsappNumber: string;
  whatsappDisplay: string;
  whatsappLink: string;
  iyiName: string;
  // Tailored human content strategy & planning (Neye)
  neyeWhatsAppNumber: string;
  neyeWhatsAppDisplay: string;
  neyeWhatsAppLink: string;
  neyeName: string;
  fellowshipNote: string;
  navItems: { label: string; href: string }[];
  dailyTrialCap: number;
}

export const siteConfig: SiteConfig = {
  name: "ContentSmith",
  tagline: "Content calendars and visual identity for Nigerian businesses.",
  description: "Transform your logo and product photos into a week of authentic social posts and brand-aligned visual flyers.",
  // General support desk (Iyi)
  whatsappNumber: "2347032293819",
  whatsappDisplay: "07032293819",
  whatsappLink: "https://wa.me/2347032293819",
  iyiName: "Iyi",
  // Tailored human content strategy & planning desk (Neye)
  neyeWhatsAppNumber: "2349162716205",
  neyeWhatsAppDisplay: "+234 916 271 6205",
  neyeWhatsAppLink: "https://wa.me/2349162716205",
  neyeName: "Neye",
  fellowshipNote: "ContentSmith the software is maintained by the ContentSmith fellowship, an initiative supporting visual craft and enterprise across West Africa.",
  navItems: [
    { label: "Try it", href: "/try" },
    { label: "Examples", href: "/examples" },
    { label: "Designers", href: "/designers" },
  ],
  dailyTrialCap: 50,
};

// General desk WhatsApp link (Iyi)
export function getWhatsAppHref(message?: string): string {
  const base = `https://wa.me/${siteConfig.whatsappNumber}`;
  const defaultText = message || `Hello Iyi, I have an inquiry about ContentSmith.`;
  return `${base}?text=${encodeURIComponent(defaultText)}`;
}

// Tailored strategy & planning link (Neye)
export function getNeyeWhatsAppHref(message?: string): string {
  const base = `https://wa.me/${siteConfig.neyeWhatsAppNumber}`;
  const defaultText = message || `Hello Neye, I would like to discuss more tailored content strategy and planning for my business.`;
  return `${base}?text=${encodeURIComponent(defaultText)}`;
}

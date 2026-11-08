import type { Metadata } from "next";
import { DM_Sans, Geist_Mono, Playfair_Display, Noto_Sans_JP } from "next/font/google";
import { getLocale } from "next-intl/server";
import Script from "next/script";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });
const notoJp = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Whole Cuts — Premium Frozen Meat, Delivered in Japan",
    template: "%s | Whole Cuts",
  },
  description:
    "Grass-fed beef, lamb, game and charcuterie shipped frozen across Japan. Steaks, block cuts, and chef-grade meat for home cooks.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${dmSans.variable} ${geistMono.variable} ${playfair.variable} ${notoJp.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`}
        </Script>
        {children}
      </body>
    </html>
  );
}

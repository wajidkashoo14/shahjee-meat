import type { Metadata } from "next";
import { Fraunces, Geist_Mono, Manrope, Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import { getLocale } from "next-intl/server";
import Script from "next/script";
import "./globals.css";

// Typography (see DESIGN_SYSTEM.md):
//   Fraunces: display serif for headings, product names and the wordmark.
//     It's variable, and the optical-size axis keeps big headlines refined and
//     small titles sturdy.
//   Manrope: body and UI text, prices, tables, dashboards.
//   Noto Serif JP / Noto Sans JP: Japanese glyphs for the same two roles.
//     They aren't preloaded; browsers fetch only the slices a page uses.
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["opsz"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  weight: ["400", "500", "600", "700"],
  preload: false,
});
const notoSerifJp = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  weight: ["600"],
  preload: false,
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
      className={`${fraunces.variable} ${manrope.variable} ${geistMono.variable} ${notoSansJp.variable} ${notoSerifJp.variable} h-full antialiased`}
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

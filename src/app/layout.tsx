import type { Metadata, Viewport } from "next";
import { Anton, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { site } from "@/data/site";
import { SmoothScroll } from "@/motion/SmoothScroll";
import { TransitionProvider } from "@/components/shell/TransitionProvider";
import { Header } from "@/components/shell/Header";
import { Menu } from "@/components/shell/Menu";
import { Cursor } from "@/components/shell/Cursor";
import { Intro } from "@/components/intro/Intro";
import { Footer } from "@/components/shell/Footer";

/* Display: Anton — heavy condensed, the evolution of the old site's Druk/Bebas voice.
   UI: Geist (+ Geist Mono for metadata) — neutral, technical, one family. */
const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

const description = `${site.name} — ${site.role.toLowerCase()} focused on backend and system design: job queues, payments, event-driven systems. Also photography and color grading.`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.role}`, template: `%s — ${site.name}` },
  description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.socials[0].href }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.name,
    title: `${site.name} — ${site.role}`,
    description,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: `${site.name}` }],
  },
  twitter: { card: "summary_large_image", title: site.name, description, images: ["/og.jpg"] },
};

export const viewport: Viewport = {
  themeColor: "#080808",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Enables hidden-until-animated states only when JS is running.
            Every full load starts at the top: browser scroll restoration is disabled so the
            intro always plays from frame 0 (a hash target is honoured after the intro).
            A page restored from the back/forward cache reloads so the intro replays too.
            A key/click before hydration is remembered as a request to skip the intro. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('js');try{if('scrollRestoration' in history)history.scrollRestoration='manual'}catch(e){}window.scrollTo(0,0);addEventListener('pageshow',function(e){if(e.persisted)location.reload()});var k=function(){window.__kageSkip=1};addEventListener('keydown',k,{once:true});addEventListener('pointerdown',k,{once:true});",
          }}
        />
      </head>
      <body>
        <a href="#main" className="sr-only-focusable meta fixed left-3 top-3 z-[100] bg-bone px-3 py-2 text-ink">
          Skip to content
        </a>
        <TransitionProvider>
          <SmoothScroll />
          <Header />
          <Menu />
          <main id="main">{children}</main>
          <Footer />
          <Intro />
        </TransitionProvider>
        <Cursor />
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}

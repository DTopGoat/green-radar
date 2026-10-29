import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AppHeader } from "@/components/radar/header";
import appCss from "../styles.css?url";

const themeBoot = `try{var t=localStorage.getItem("gr-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Green Radar" },
      { name: "description", content: "Sentinel-2 view of farmland signals in the Cordillera, Philippines. Estimates are labeled. Not farming advice." },
      { name: "theme-color", content: "#1b5e3b" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        <PreviewHostBridge />
        <AuthProvider>
          <div className="flex h-dvh flex-col">
            <AppHeader />
            <div className="flex min-h-0 flex-1 flex-col">
              <Outlet />
            </div>
          </div>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster, toast } from "sonner";
import { UserProvider } from "@/lib/user-context";
import { registerServiceWorker, useOnlineStatus } from "@/lib/pwa";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";

import "../style.css";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md rounded-2xl p-8 text-center">
        <h1 className="text-gradient text-7xl font-bold">404</h1>

        <p className="mt-3 text-muted-foreground">This page could not be found.</p>

        <a
          href="/"
          className="mt-6 inline-flex items-center rounded-lg bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md rounded-2xl p-8 text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>

        <p className="mt-3 text-muted-foreground">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-lg bg-gradient-primary px-4 py-2 text-primary-foreground"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      {
        title: "Arthyne — AI Behavioral Finance Companion",
      },
      {
        name: "description",
        content: "Understand the why behind your spending.",
      },
      {
        name: "theme-color",
        content: "#7C3AED",
      },
      {
        name: "mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "default",
      },
      {
        name: "apple-mobile-web-app-title",
        content: "Arthyne",
      },
      {
        name: "application-name",
        content: "Arthyne",
      },
    ],
    links: [
      {
        rel: "manifest",
        href: "/manifest.json",
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon.png",
      },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>

      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (!isOnline) {
      toast.warning("You're currently offline. Cached application shell is active.", {
        id: "offline-warning",
        duration: 4000,
      });
    }
  }, [isOnline]);

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <PWAInstallBanner />
        <Outlet />
      </UserProvider>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

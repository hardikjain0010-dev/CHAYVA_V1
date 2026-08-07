import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import { UserProvider } from "@/lib/user-context";

import "../style.css";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md rounded-2xl p-8 text-center">
        <h1 className="text-gradient text-7xl font-bold">404</h1>

        <p className="mt-3 text-muted-foreground">
          This page could not be found.
        </p>

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

        <p className="mt-3 text-muted-foreground">
          {error.message}
        </p>
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
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Chayva",
      },
      {
        name: "description",
        content: "AI-powered expense tracker",
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

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <Outlet />
      </UserProvider>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

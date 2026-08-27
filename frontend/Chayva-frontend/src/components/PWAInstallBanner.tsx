import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { usePWAInstall } from "@/lib/pwa";
import { CaayvaLogo } from "@/components/CaayvaLogo";

export function PWAInstallBanner() {
  const { isInstallable, install, dismiss } = usePWAInstall();

  if (!isInstallable) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl glass-strong border border-border/80 p-3.5 shadow-2xl md:bottom-6 md:right-6 md:left-auto md:max-w-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <CaayvaLogo className="h-8 w-8 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground leading-tight">Install Caayva</p>
              <p className="text-[0.7rem] text-muted-foreground truncate">
                Add to your home screen for an app-like experience
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={install}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-glow-sm)] transition active:scale-95 hover:opacity-95"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={dismiss}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/5 transition"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

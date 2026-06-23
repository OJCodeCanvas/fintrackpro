"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share, PlusSquare, Smartphone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "fintrack_install_dismissed";

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function detectIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showSheet, setShowSheet] = useState(false);

  // Detect environment once on mount (these don't change during the session)
  const standalone = detectStandalone();
  const ios = detectIOS();

  useEffect(() => {
    // Already installed — don't show anything
    if (standalone) return;

    // Was it dismissed recently? Don't show for 7 days.
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Android/Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Show the banner after a delay so it doesn't feel intrusive
    const timer = setTimeout(() => setShowBanner(true), ios ? 5000 : 3000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, [standalone, ios]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowBanner(false);
        setShowSheet(false);
      }
      setDeferredPrompt(null);
    } else if (ios) {
      // Show the iOS instructions sheet
      setShowSheet(true);
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  if (standalone) return null;

  return (
    <>
      {/* Floating banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 60, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 60, x: "-50%" }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md"
            style={{ marginBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="bg-card border border-border shadow-2xl rounded-2xl p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">Install FinTrack</div>
                <div className="text-xs text-muted-foreground">
                  {ios ? "Add to your home screen" : "Quick access from your home screen"}
                </div>
              </div>
              <Button size="sm" onClick={handleInstall} className="shrink-0">
                <Download className="w-3.5 h-3.5 mr-1" /> Install
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 text-muted-foreground"
                onClick={handleDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS instructions sheet */}
      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-2">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <SheetTitle className="text-xl">Install FinTrack on iPhone</SheetTitle>
            <SheetDescription>
              Add FinTrack to your home screen for a full-screen app experience
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-2 pb-6">
            <div className="space-y-3">
              <Step
                num={1}
                icon={Share}
                title="Tap the Share button"
                desc="Tap the Share icon in Safari's bottom toolbar"
              />
              <Step
                num={2}
                icon={PlusSquare}
                title='Select "Add to Home Screen"'
                desc="Scroll down and tap Add to Home Screen"
              />
              <Step
                num={3}
                icon={Check}
                title="Tap Add"
                desc="FinTrack will appear on your home screen like a native app"
              />
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <Smartphone className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-xs">
                Once installed, FinTrack works in full screen and launches from your
                home screen — just like a native iOS app.
              </p>
            </div>

            <Button onClick={() => setShowSheet(false)} className="w-full">
              Got it
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function Step({
  num,
  icon: Icon,
  title,
  desc,
}: {
  num: number;
  icon: any;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="relative shrink-0">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
          {num}
        </span>
      </div>
      <div className="flex-1 pt-1">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

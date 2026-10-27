"use client";

import { useState } from "react";
import { usePWAInstall } from "./usePWAInstall";
import { Download, Smartphone, X, Share } from "lucide-react";

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed and running standalone, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-majalis-gold px-2.5 py-1 text-xs font-medium text-majalis-ink hover:bg-majalis-gold/90 transition-all shadow-sm"
        title="تثبيت التطبيق على جهازك"
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">تثبيت التطبيق</span>
        <span className="inline sm:hidden">تثبيت</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-majalis-gold/40 bg-majalis-card px-2.5 py-1 text-xs font-medium text-majalis-ink hover:border-majalis-gold transition-colors"
          title="تثبيت المنصة على آيفون / آيباد"
        >
          <Smartphone className="h-3.5 w-3.5 text-majalis-gold" />
          <span className="hidden sm:inline">تثبيت على آيفون</span>
          <span className="inline sm:hidden">تثبيت</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-majalis-gold/40 bg-majalis-card p-6 shadow-2xl animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-majalis-gold/20">
                <h3 className="font-display text-base font-bold text-majalis-ink">
                  تثبيت مجالس على آيفون / آيباد
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-majalis-ink/50 hover:text-majalis-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs leading-relaxed text-majalis-ink/80">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-majalis-gold/20 text-majalis-gold font-bold text-[11px]">
                    ١
                  </div>
                  <p>
                    اضغط على زر المشاركة <Share className="inline h-3.5 w-3.5 text-majalis-gold mx-0.5" /> في أسفل شريط متصفح Safari.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-majalis-gold/20 text-majalis-gold font-bold text-[11px]">
                    ٢
                  </div>
                  <p>
                    مرر لأسفل واختر <strong>«إضافة إلى الشاشة الرئيسية»</strong> (Add to Home Screen).
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-majalis-gold/20 text-majalis-gold font-bold text-[11px]">
                    ٣
                  </div>
                  <p>
                    اضغط على <strong>«إضافة»</strong> في الزاوية العلوية لفتح التطبيق كنافذة مستقلة بدون متصفح.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-majalis-green py-2 text-xs font-medium text-majalis-goldSoft hover:bg-majalis-green/90"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}

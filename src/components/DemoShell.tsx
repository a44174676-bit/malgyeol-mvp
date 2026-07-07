"use client";

import Link from "next/link";
import Image from "next/image";
import { createContext, useContext, useMemo, useState } from "react";
import { DEMO_LANGS, demoCopy, type DemoCopy, type DemoLang } from "@/lib/demo-i18n";

const DemoLangContext = createContext<{
  lang: DemoLang;
  setLang: (lang: DemoLang) => void;
  t: DemoCopy;
} | null>(null);

export function useDemoCopy() {
  const value = useContext(DemoLangContext);
  if (!value) {
    throw new Error("useDemoCopy must be used inside DemoShell");
  }
  return value;
}

export function DemoShell({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<DemoLang>(() => {
    if (typeof window === "undefined") return "ko";
    const saved = window.localStorage.getItem("malgyeol-demo-lang");
    return saved === "ko" || saved === "en" || saved === "vi" ? saved : "ko";
  });

  const setLang = (nextLang: DemoLang) => {
    setLangState(nextLang);
    window.localStorage.setItem("malgyeol-demo-lang", nextLang);
    window.localStorage.setItem("vrMediTourLang", nextLang);
  };

  const value = useMemo(() => ({ lang, setLang, t: demoCopy[lang] }), [lang]);
  const t = value.t;

  return (
    <DemoLangContext.Provider value={value}>
      <main className="min-h-screen bg-[#050b15] text-[#edf5ff]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pb-44 pt-5 sm:px-6 lg:pt-7">
          <header className="rounded-2xl border border-white/10 bg-[#071326]/90 px-4 py-3 shadow-[0_18px_44px_rgba(0,0,0,0.32)] backdrop-blur">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <Link href="/demo" className="flex min-w-0 items-center gap-3">
                <Image
                  src="/demo-brand/logo.jpg"
                  alt="VR MEDI TOUR & HOME logo"
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-xl object-cover"
                />
                <div className="min-w-0">
                  <p className="text-sm font-extrabold leading-tight text-white">
                    VR MEDI TOUR
                    <span className="block text-xs font-bold text-[#afc3d9]">& HOME Lab</span>
                  </p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#7dd3fc]">
                    {t.brandLab}
                  </p>
                </div>
              </Link>

              <nav className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#dce9fb]">
                <a
                  href="https://vr-meditour.com/malgyeol/"
                  className="rounded-full border border-white/10 px-3 py-2 hover:border-[#7dd3fc] hover:text-[#7dd3fc]"
                >
                  {t.introLink}
                </a>
                <Link
                  href="/demo/care"
                  className="rounded-full border border-white/10 px-3 py-2 hover:border-[#7dd3fc] hover:text-[#7dd3fc]"
                >
                  {t.careNav}
                </Link>
                <Link
                  href="/demo/korean"
                  className="rounded-full border border-white/10 px-3 py-2 hover:border-[#7dd3fc] hover:text-[#7dd3fc]"
                >
                  {t.koreanNav}
                </Link>
                <a
                  href="mailto:info@vr-meditour.com?subject=%EB%A7%90%EA%B2%B0%20MVP%20%ED%94%BC%EB%93%9C%EB%B0%B1"
                  className="rounded-full border border-[#7dd3fc]/50 bg-[#0ea5e9]/10 px-3 py-2 text-[#e0f2fe] hover:border-[#7dd3fc]"
                >
                  {t.feedback}
                </a>
              </nav>
            </div>
          </header>

          {children}

          <footer className="rounded-2xl border border-white/10 bg-[#0c1524]/85 p-5 text-sm text-[#afc3d9] shadow-[0_18px_44px_rgba(0,0,0,0.28)]">
            <p className="font-extrabold text-white">VR MEDI TOUR & HOME</p>
            <p className="mt-1">{t.footerProduct}</p>
            <p className="mt-1">{t.contact}</p>
            <div className="mt-4 grid gap-2 border-t border-white/10 pt-4 md:grid-cols-2">
              <p>{t.careNotice}</p>
              <p>{t.koreanNotice}</p>
            </div>
          </footer>
        </div>

        <aside className="fixed bottom-4 right-4 z-50 w-[min(92vw,360px)] rounded-2xl border border-[#7dd3fc]/30 bg-[#071326]/95 p-3 shadow-[0_18px_44px_rgba(0,0,0,0.38)] backdrop-blur">
          <div className="grid grid-cols-[70px_1fr] items-center gap-3">
            <Image
              src={DEMO_LANGS.find((item) => item.code === lang)?.image ?? DEMO_LANGS[0].image}
              alt="Medi Hana language guide"
              width={70}
              height={70}
              className="h-[70px] w-[70px] rounded-full object-contain drop-shadow-[0_14px_18px_rgba(0,0,0,0.34)]"
            />
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#91e7f2]">
                {t.hanaKicker}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#dce9fb]">{t.hanaText}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#afc3d9]">
              {t.languageLabel}
            </span>
            <div className="flex gap-2">
              {DEMO_LANGS.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  aria-pressed={lang === item.code}
                  onClick={() => setLang(item.code)}
                  className={`h-10 w-10 rounded-full border p-1 transition ${
                    lang === item.code
                      ? "border-[#73ffe6] bg-[#0c2a48] shadow-[0_0_22px_rgba(90,220,255,0.48)]"
                      : "border-[#87beff]/45 bg-[#081830] hover:border-[#5adcff]"
                  }`}
                  title={item.label}
                >
                  <Image
                    src={item.image}
                    alt={`${item.label} language`}
                    width={32}
                    height={32}
                    className="h-full w-full rounded-full object-contain"
                  />
                </button>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </DemoLangContext.Provider>
  );
}

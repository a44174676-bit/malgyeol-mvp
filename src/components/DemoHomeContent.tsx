"use client";

import Link from "next/link";
import { DemoShell, useDemoCopy } from "@/components/DemoShell";
import { Card, Eyebrow } from "@/components/ui";

export function DemoHomeContent() {
  return (
    <DemoShell>
      <DemoHomeBody />
    </DemoShell>
  );
}

function DemoHomeBody() {
  const { t } = useDemoCopy();

  return (
    <>
      <section className="relative overflow-hidden rounded-[28px] border border-[#7dd3fc]/30 bg-[linear-gradient(135deg,rgba(4,12,29,0.98),rgba(9,27,52,0.92)_54%,rgba(16,34,61,0.86))] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.36)] sm:p-8">
        <div className="grid gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-[#82b8d3]/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#c9e7ff]">
              Public Beta MVP
            </p>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#fff8e7] sm:text-5xl">
              {t.homeTitle}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#afc3d9]">
              {t.homeLead}
            </p>
            <p className="mt-3 max-w-3xl rounded-2xl border border-[#f6d58f]/25 bg-[#f6d58f]/10 px-4 py-3 text-sm font-semibold text-[#fff2ce]">
              {t.homeData}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/demo/care"
                className="rounded-xl bg-[#5cc8d5] px-4 py-3 text-sm font-extrabold text-[#051427] hover:bg-[#7dd3fc]"
              >
                {t.careCta}
              </Link>
              <Link
                href="/demo/korean"
                className="rounded-xl border border-[#7dd3fc]/40 px-4 py-3 text-sm font-extrabold text-[#e0f2fe] hover:border-[#7dd3fc]"
              >
                {t.koreanCta}
              </Link>
              <a
                href="mailto:info@vr-meditour.com?subject=%EB%A7%90%EA%B2%B0%20MVP%20%ED%94%BC%EB%93%9C%EB%B0%B1"
                className="rounded-xl border border-white/15 px-4 py-3 text-sm font-extrabold text-[#dce9fb] hover:border-[#7dd3fc]"
              >
                {t.feedbackFull}
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-[#f6d58f]/35 bg-white/10 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
            <div className="flex gap-2 border-b border-white/15 pb-4">
              <span className="h-3 w-3 rounded-full bg-[#edf5ff]/70" />
              <span className="h-3 w-3 rounded-full bg-[#edf5ff]/55" />
              <span className="h-3 w-3 rounded-full bg-[#edf5ff]/40" />
            </div>
            <div className="mt-5 grid gap-4">
              <div>
                <b className="text-[#fff8e7]">Care</b>
                <p className="mt-1 text-sm leading-6 text-[#afc3d9]">{t.careFlowText}</p>
              </div>
              <div>
                <b className="text-[#fff8e7]">Korean</b>
                <p className="mt-1 text-sm leading-6 text-[#afc3d9]">{t.koreanFlowText}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-[#7dd3fc]/25 bg-white/95">
          <Eyebrow>말결 Care</Eyebrow>
          <h2 className="text-lg font-bold">{t.careFlowTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">{t.careFlowText}</p>
        </Card>
        <Card className="border-[#f6d58f]/40 bg-white/95">
          <Eyebrow>말결 Korean</Eyebrow>
          <h2 className="text-lg font-bold">{t.koreanFlowTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">{t.koreanFlowText}</p>
        </Card>
      </div>
    </>
  );
}

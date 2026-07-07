"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="border border-line rounded-lg px-4 py-2 text-sm font-semibold hover:border-accent hover:text-accent-deep print:hidden"
    >
      인쇄 / PDF 저장
    </button>
  );
}

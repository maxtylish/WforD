"use client";

export default function BrandFooter() {
  return (
    <div className="shrink-0 px-4 py-3 border-t border-gray-100 bg-white">
      {/* Top line: Powered by */}
      <p className="text-center text-xs text-gray-400 font-medium tracking-wide mb-2">
        Powered by{" "}
        <span className="text-gray-600 font-semibold">Lukuarts Studio</span>{" "}
        <span>2026</span>
      </p>

      {/* Divider */}
      <div className="border-t border-gray-100 mb-2" />

      {/* Bottom: studio info */}
      <div className="flex flex-col items-center gap-0.5">
        <p className="text-xs font-bold text-gray-700 tracking-wide">
          青玥影像 Lukuarts Studio
        </p>
        <a
          href="tel:0932754860"
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          0932-754-860
        </a>
        <a
          href="https://lukuarts.studio"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium transition-colors"
          style={{ color: "var(--brand)" }}
        >
          官方網站 →
        </a>
      </div>
    </div>
  );
}

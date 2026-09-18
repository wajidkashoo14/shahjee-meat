"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Region = { id: string; cut: string; labelEn: string; labelJa: string; path: string; labelPos: [number, number] };

const REGIONS: Region[] = [
  { id: "chuck", cut: "chuck-eye", labelEn: "Chuck", labelJa: "肩肉（チャック）", path: "M40,120 L130,90 L150,190 L60,210 Z", labelPos: [80, 155] },
  { id: "rib", cut: "ribeye", labelEn: "Rib", labelJa: "リブ", path: "M150,190 L220,150 L250,170 L235,230 L160,235 Z", labelPos: [195, 195] },
  { id: "short-loin", cut: "t-bone", labelEn: "Short Loin", labelJa: "ロイン", path: "M250,170 L310,155 L320,205 L280,235 L235,230 Z", labelPos: [280, 195] },
  { id: "sirloin", cut: "sirloin", labelEn: "Sirloin", labelJa: "サーロイン", path: "M310,155 L360,150 L370,200 L340,225 L320,205 Z", labelPos: [340, 185] },
  { id: "round", cut: "aitchbone", labelEn: "Round", labelJa: "もも肉（ラウンド）", path: "M360,150 L430,160 L440,240 L370,250 L340,225 L370,200 Z", labelPos: [400, 200] },
  { id: "brisket", cut: "brisket", labelEn: "Brisket", labelJa: "ブリスケット", path: "M40,120 L130,90 L120,60 L60,70 Z", labelPos: [85, 90] },
  { id: "plate-flank", cut: "flank", labelEn: "Plate & Flank", labelJa: "プレート＆フランク", path: "M130,90 L235,80 L235,150 L150,190 Z", labelPos: [185, 130] },
  { id: "shank", cut: "tongue", labelEn: "Shank", labelJa: "すね肉", path: "M40,210 L60,210 L55,270 L35,270 Z", labelPos: [48, 240] },
];

export function CutMap() {
  const [hovered, setHovered] = useState<string | null>(null);
  const locale = useLocale() as "en" | "ja";
  const t = useTranslations("home");
  const router = useRouter();

  const active = REGIONS.find((r) => r.id === hovered);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px] lg:items-center">
      <div className="relative rounded-3xl border border-border bg-surface p-6">
        <svg viewBox="0 0 480 300" className="w-full" role="img" aria-label={t("cutMapAlt")}>
          <ellipse cx="240" cy="150" rx="230" ry="130" fill="var(--color-surface-raised)" opacity="0.3" />
          {REGIONS.map((r) => (
            <path
              key={r.id}
              d={r.path}
              className={cn(
                "cursor-pointer stroke-border transition-colors",
                hovered === r.id ? "fill-primary" : "fill-[var(--color-surface-raised)] hover:fill-primary/60",
              )}
              strokeWidth={1.5}
              onMouseEnter={() => setHovered(r.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => router.push(`/collections/beef?cut=${r.cut}`)}
            />
          ))}
          {REGIONS.map((r) => (
            <text
              key={`${r.id}-label`}
              x={r.labelPos[0]}
              y={r.labelPos[1]}
              textAnchor="middle"
              className="pointer-events-none select-none fill-foreground text-[9px] font-medium"
            >
              {locale === "ja" ? r.labelJa : r.labelEn}
            </text>
          ))}
        </svg>
      </div>

      <div>
        <h3 className="font-display text-2xl">{t("cutMapTitle")}</h3>
        <p className="mt-2 text-sm text-foreground-muted">{active ? (locale === "ja" ? active.labelJa : active.labelEn) : t("cutMapHint")}</p>
        <p className="mt-4 text-xs text-foreground-muted">{t("cutMapCta")}</p>
      </div>
    </div>
  );
}

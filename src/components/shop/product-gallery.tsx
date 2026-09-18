"use client";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name }: { images: { url: string; alt: string }[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl bg-surface-raised"
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
      >
        {current && (
          <Image
            src={current.url}
            alt={current.alt || name}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className={cn("object-cover transition-transform duration-500", zoomed && "scale-110")}
          />
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              onClick={() => setActive(i)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-xl border-2",
                active === i ? "border-primary" : "border-transparent",
              )}
            >
              <Image src={img.url} alt={img.alt || name} fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

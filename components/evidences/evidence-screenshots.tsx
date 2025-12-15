"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { EvidenceScreenshot } from "@/lib/types";
import Image from "next/image";
import { useState } from "react";

interface EvidenceScreenshotsProps {
  screenshots: EvidenceScreenshot[];
}

const ENGINES = ["google", "yahoo", "bing", "meta"] as const;
const ENGINE_LABELS: Record<string, string> = {
  google: "Google",
  yahoo: "Yahoo",
  bing: "Bing",
  meta: "Meta",
};

export function EvidenceScreenshots({ screenshots }: EvidenceScreenshotsProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const getScreenshotForEngine = (engine: string) => {
    return screenshots.find((s) => s.engine === engine);
  };

  const getImageUrl = (screenshot: EvidenceScreenshot) => {
    if (!screenshot.file_path) return null;

    const supabase = createClient();
    const {
      data: { publicUrl },
    } = supabase.storage
      .from("evidences_screenshots")
      .getPublicUrl(screenshot.file_path);

    return publicUrl;
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Screenshots das Buscas</h3>

      <div className="grid grid-cols-2 gap-4">
        {ENGINES.map((engine) => {
          const screenshot = getScreenshotForEngine(engine);
          const imageUrl = screenshot ? getImageUrl(screenshot) : null;

          return (
            <div key={engine} className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {ENGINE_LABELS[engine]}
              </p>
              <div className="rounded-lg border bg-muted overflow-hidden aspect-square flex items-center justify-center">
                {imageUrl ? (
                  <button
                    onClick={() => setSelectedImage(imageUrl)}
                    className="relative w-full h-full cursor-pointer hover:opacity-90 transition-opacity group"
                  >
                    <Image
                      src={imageUrl}
                      alt={`${ENGINE_LABELS[engine]} screenshot`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Expandir
                      </span>
                    </div>
                  </button>
                ) : (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      Não disponível
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Modal */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <div className="relative w-full h-96">
              <Image
                src={selectedImage}
                alt="Screenshot expandida"
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

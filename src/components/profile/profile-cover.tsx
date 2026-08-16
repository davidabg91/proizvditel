"use client";

import { useState, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateCoverPosition } from "@/app/tablo/profil/actions";

export function ProfileCover({
  coverUrl,
  initialPositionY = 50,
  initialPositionX = 50,
  initialScale = 100,
  isOwner = false,
}: {
  coverUrl: string | null;
  initialPositionY?: number;
  initialPositionX?: number;
  initialScale?: number;
  isOwner?: boolean;
}) {
  const [posY, setPosY] = useState(initialPositionY);
  const [posX, setPosX] = useState(initialPositionX);
  const [scale, setScale] = useState(initialScale);

  const [savedY, setSavedY] = useState(initialPositionY);
  const [savedX, setSavedX] = useState(initialPositionX);
  const [savedScale, setSavedScale] = useState(initialScale);

  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDraggingRef = useRef(false);
  const startClientXRef = useRef(0);
  const startClientYRef = useRef(0);
  const startPosXRef = useRef(initialPositionX);
  const startPosYRef = useRef(initialPositionY);
  const containerRef = useRef<HTMLDivElement>(null);

  function startDrag(clientX: number, clientY: number) {
    if (!isEditing) return;
    isDraggingRef.current = true;
    startClientXRef.current = clientX;
    startClientYRef.current = clientY;
    startPosXRef.current = posX;
    startPosYRef.current = posY;
  }

  function onDrag(clientX: number, clientY: number) {
    if (!isDraggingRef.current || !containerRef.current) return;
    const deltaX = clientX - startClientXRef.current;
    const deltaY = clientY - startClientYRef.current;
    const containerWidth = containerRef.current.offsetWidth || 800;
    const containerHeight = containerRef.current.offsetHeight || 280;

    const deltaPercentX = (deltaX / containerWidth) * 100;
    const deltaPercentY = (deltaY / containerHeight) * 100;

    const newX = Math.max(0, Math.min(100, Math.round(startPosXRef.current - deltaPercentX)));
    const newY = Math.max(0, Math.min(100, Math.round(startPosYRef.current - deltaPercentY)));

    setPosX(newX);
    setPosY(newY);
  }

  function stopDrag() {
    isDraggingRef.current = false;
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await updateCoverPosition(posY, posX, scale);
      if (res.ok) {
        setSavedY(posY);
        setSavedX(posX);
        setSavedScale(scale);
        setIsEditing(false);
        setSuccessMessage(true);
        setTimeout(() => setSuccessMessage(false), 3000);
      } else {
        setError(res.error);
      }
    });
  }

  function handleCancel() {
    setPosY(savedY);
    setPosX(savedX);
    setScale(savedScale);
    setIsEditing(false);
    setError(null);
  }

  if (!coverUrl) {
    return (
      <div className="relative h-56 w-full overflow-hidden bg-primary-soft sm:h-72">
        <div className="h-full w-full bg-gradient-to-br from-primary/15 via-accent/10 to-transparent" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={[
        "relative h-56 w-full overflow-hidden bg-primary-soft sm:h-72 select-none",
        isEditing ? "cursor-grab active:cursor-grabbing ring-2 ring-primary ring-inset" : "",
      ].join(" ")}
      onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
      onMouseMove={(e) => onDrag(e.clientX, e.clientY)}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
      onTouchStart={(e) => {
        if (e.touches[0]) startDrag(e.touches[0].clientX, e.touches[0].clientY);
      }}
      onTouchMove={(e) => {
        if (e.touches[0]) onDrag(e.touches[0].clientX, e.touches[0].clientY);
      }}
      onTouchEnd={stopDrag}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverUrl}
        alt="Корица"
        draggable={false}
        className="pointer-events-none h-full w-full object-cover transition-transform duration-75"
        style={{
          objectPosition: `${posX}% ${posY}%`,
          transform: `scale(${scale / 100})`,
          transformOrigin: `${posX}% ${posY}%`,
        }}
      />

      {/* Индикация за успешна промяна */}
      {successMessage && (
        <div className="absolute top-4 right-4 z-20 rounded-[var(--radius-md)] bg-success px-3.5 py-1.5 text-xs font-semibold text-white shadow-md animate-in fade-in duration-200">
          ✓ Позицията и мащабът са запазени!
        </div>
      )}

      {/* Режим на наместване за собственика */}
      {isOwner && (
        <>
          {!isEditing ? (
            <div className="absolute bottom-4 right-4 z-10">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface/90 px-3.5 py-1.5 text-xs font-semibold text-foreground backdrop-blur-md shadow-sm transition-all hover:bg-surface hover:scale-[1.02]"
              >
                <svg
                  className="h-3.5 w-3.5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                  />
                </svg>
                Намести и мащабирай корицата
              </button>
            </div>
          ) : (
            <div className="absolute inset-0 z-20 flex flex-col justify-between bg-black/35 p-3 sm:p-4 backdrop-blur-[2px]">
              <div className="flex items-center justify-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-black/80 px-4 py-1.5 text-xs font-medium text-white shadow-lg">
                  <span>✋</span>
                  <span>Плъзнете с мишката за местене, или използвайте плъзгачите долу</span>
                </div>
              </div>

              {error ? (
                <div className="mx-auto max-w-sm rounded bg-danger px-3 py-1 text-center text-xs font-medium text-white shadow">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col gap-2.5 rounded-[var(--radius-lg)] border border-border/80 bg-surface/95 p-3 shadow-xl backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  {/* Мащаб (Приближаване / Отдалечаване) */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">🔍 Мащаб:</span>
                    <button
                      type="button"
                      onClick={() => setScale((s) => Math.max(100, s - 15))}
                      className="flex h-6 w-6 items-center justify-center rounded border border-border bg-surface text-sm font-bold hover:border-primary"
                    >
                      −
                    </button>
                    <input
                      type="range"
                      min="100"
                      max="250"
                      step="5"
                      value={scale}
                      onChange={(e) => setScale(Number(e.target.value))}
                      className="w-20 sm:w-28 accent-[var(--color-primary)] cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => setScale((s) => Math.min(250, s + 15))}
                      className="flex h-6 w-6 items-center justify-center rounded border border-border bg-surface text-sm font-bold hover:border-primary"
                    >
                      +
                    </button>
                    <span className="font-mono text-muted-foreground w-10">{scale}%</span>
                  </div>

                  {/* Вертикална позиция */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">↕️ Вертикално:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={posY}
                      onChange={(e) => setPosY(Number(e.target.value))}
                      className="w-16 sm:w-24 accent-[var(--color-primary)] cursor-pointer"
                    />
                    <span className="font-mono text-muted-foreground w-8">{posY}%</span>
                  </div>

                  {/* Хоризонтална позиция */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">↔️ Хоризонтално:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={posX}
                      onChange={(e) => setPosX(Number(e.target.value))}
                      className="w-16 sm:w-24 accent-[var(--color-primary)] cursor-pointer"
                    />
                    <span className="font-mono text-muted-foreground w-8">{posX}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isPending}
                  >
                    Отказ
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSave}
                    disabled={isPending}
                  >
                    {isPending ? "Запазване…" : "Запази позицията"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

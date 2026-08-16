"use client";

import { useState, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateCoverPosition } from "@/app/tablo/profil/actions";

export function ProfileCover({
  coverUrl,
  initialPosition = 50,
  isOwner = false,
}: {
  coverUrl: string | null;
  initialPosition?: number;
  isOwner?: boolean;
}) {
  const [position, setPosition] = useState(initialPosition);
  const [savedPosition, setSavedPosition] = useState(initialPosition);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startPosRef = useRef(initialPosition);
  const containerRef = useRef<HTMLDivElement>(null);

  function startDrag(clientY: number) {
    if (!isEditing) return;
    isDraggingRef.current = true;
    startYRef.current = clientY;
    startPosRef.current = position;
  }

  function onDrag(clientY: number) {
    if (!isDraggingRef.current || !containerRef.current) return;
    const deltaY = clientY - startYRef.current;
    const containerHeight = containerRef.current.offsetHeight || 280;

    // Пресмятаме процентното отместване (дърпане надолу показва горната част = по-малък процент)
    const deltaPercent = (deltaY / containerHeight) * 100;
    const newPos = Math.max(0, Math.min(100, Math.round(startPosRef.current - deltaPercent)));
    setPosition(newPos);
  }

  function stopDrag() {
    isDraggingRef.current = false;
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await updateCoverPosition(position);
      if (res.ok) {
        setSavedPosition(position);
        setIsEditing(false);
        setSuccessMessage(true);
        setTimeout(() => setSuccessMessage(false), 3000);
      } else {
        setError(res.error);
      }
    });
  }

  function handleCancel() {
    setPosition(savedPosition);
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
      onMouseDown={(e) => startDrag(e.clientY)}
      onMouseMove={(e) => onDrag(e.clientY)}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
      onTouchStart={(e) => {
        if (e.touches[0]) startDrag(e.touches[0].clientY);
      }}
      onTouchMove={(e) => {
        if (e.touches[0]) onDrag(e.touches[0].clientY);
      }}
      onTouchEnd={stopDrag}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverUrl}
        alt="Корица"
        draggable={false}
        className="pointer-events-none h-full w-full object-cover transition-[object-position] duration-75"
        style={{ objectPosition: `50% ${position}%` }}
      />

      {/* Индикация за успешна промяна */}
      {successMessage && (
        <div className="absolute top-4 right-4 z-20 rounded-[var(--radius-md)] bg-success px-3.5 py-1.5 text-xs font-semibold text-white shadow-md animate-in fade-in duration-200">
          ✓ Позицията е запазена!
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
                    d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
                  />
                </svg>
                Намести корицата
              </button>
            </div>
          ) : (
            <div className="absolute inset-0 z-20 flex flex-col justify-between bg-black/35 p-4 backdrop-blur-[2px]">
              <div className="flex items-center justify-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-black/75 px-4 py-1.5 text-xs font-medium text-white shadow-lg">
                  <span>↕️</span>
                  <span>Плъзнете нагоре или надолу, за да наместите снимката</span>
                </div>
              </div>

              {error ? (
                <div className="mx-auto max-w-sm rounded bg-danger px-3 py-1 text-center text-xs font-medium text-white shadow">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] bg-surface/95 p-3 shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Позиция:
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={position}
                    onChange={(e) => setPosition(Number(e.target.value))}
                    className="w-28 sm:w-40 accent-[var(--color-primary)] cursor-pointer"
                  />
                  <span className="text-xs font-mono font-medium text-foreground w-8">
                    {position}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
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

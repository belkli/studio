'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useTranslations } from 'next-intl';

type A11yPrefs = {
  fontScale: number;
  highContrast: boolean;
  highlightLinks: boolean;
  readableFont: boolean;
  pauseAnimations: boolean;
  monochrome: boolean;
  invertColors: boolean;
};

const STORAGE_KEY = 'harmonia.a11y.prefs.v1';
const POSITION_KEY = 'harmonia.a11y.position.v1';
const DEFAULT_PREFS: A11yPrefs = {
  fontScale: 100,
  highContrast: false,
  highlightLinks: false,
  readableFont: false,
  pauseAnimations: false,
  monochrome: false,
  invertColors: false,
};

function clampFontScale(next: number) {
  return Math.max(90, Math.min(140, next));
}

function applyPrefs(prefs: A11yPrefs) {
  const html = document.documentElement;
  html.style.fontSize = `${prefs.fontScale}%`;
  html.classList.toggle('a11y-high-contrast', prefs.highContrast);
  html.classList.toggle('a11y-highlight-links', prefs.highlightLinks);
  html.classList.toggle('a11y-readable-font', prefs.readableFont);
  html.classList.toggle('a11y-pause-animations', prefs.pauseAnimations);
  html.classList.toggle('a11y-monochrome', prefs.monochrome);
  html.classList.toggle('a11y-invert-colors', prefs.invertColors);
}

export function AccessibilityPanel() {
  const t = useTranslations('AccessibilityWidget');
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULT_PREFS);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const dragStateRef = useRef<{ pointerId: number; startX: number; startY: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Partial<A11yPrefs>) : {};
      const next = { ...DEFAULT_PREFS, ...parsed };
      next.fontScale = clampFontScale(next.fontScale ?? DEFAULT_PREFS.fontScale);
      setPrefs(next);
      applyPrefs(next);
    } catch {
      applyPrefs(DEFAULT_PREFS);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(POSITION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { x?: number; y?: number };
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setPosition({ x: parsed.x, y: parsed.y });
          return;
        }
      }
    } catch {
      // Ignore invalid saved position.
    }
    setPosition({ x: 16, y: Math.max(16, window.innerHeight - 80) });
  }, []);

  useEffect(() => {
    if (!position) return;
    try {
      localStorage.setItem(POSITION_KEY, JSON.stringify(position));
    } catch {
      // Ignore storage failures.
    }
  }, [position]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => {
      setPosition((prev) => {
        if (!prev) return prev;
        const maxX = Math.max(8, window.innerWidth - 72);
        const maxY = Math.max(8, window.innerHeight - 72);
        return {
          x: Math.max(8, Math.min(prev.x, maxX)),
          y: Math.max(8, Math.min(prev.y, maxY)),
        };
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    applyPrefs(prefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore storage failures.
    }
  }, [prefs]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      toggleRef.current?.focus();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const percent = useMemo(() => `${prefs.fontScale}%`, [prefs.fontScale]);

  function toggle(key: keyof Omit<A11yPrefs, 'fontScale'>) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const onTogglePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!position) return;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX - position.x,
      startY: event.clientY - position.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onTogglePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const nextX = event.clientX - drag.startX;
    const nextY = event.clientY - drag.startY;
    const maxX = Math.max(8, window.innerWidth - 72);
    const maxY = Math.max(8, window.innerHeight - 72);
    const x = Math.max(8, Math.min(nextX, maxX));
    const y = Math.max(8, Math.min(nextY, maxY));

    if (Math.abs(event.movementX) > 1 || Math.abs(event.movementY) > 1) {
      drag.moved = true;
      suppressClickRef.current = true;
    }
    setPosition({ x, y });
  };

  const onTogglePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragStateRef.current = null;
    setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  return (
    <div
      className="a11y-widget-root"
      style={position ? { left: `${position.x}px`, top: `${position.y}px` } : undefined}
    >
      <button
        ref={toggleRef}
        type="button"
        className="a11y-toggle"
        aria-expanded={open}
        aria-controls="a11y-widget-panel"
        aria-label={t('openButton')}
        onClick={() => {
          if (suppressClickRef.current) return;
          setOpen((v) => !v);
        }}
        onPointerDown={onTogglePointerDown}
        onPointerMove={onTogglePointerMove}
        onPointerUp={onTogglePointerUp}
      >
        {t('openShort')}
      </button>

      {open && (
        <section
          ref={panelRef}
          id="a11y-widget-panel"
          className="a11y-panel"
          aria-label={t('panelTitle')}
          role="dialog"
          aria-modal="false"
          tabIndex={-1}
        >
          <div className="a11y-panel-header">
            <h2>{t('panelTitle')}</h2>
            <button type="button" className="a11y-close" onClick={() => setOpen(false)} aria-label={t('closeButton')}>
              x
            </button>
          </div>

          <div className="a11y-section">
            <p className="a11y-section-title">{t('fontSize')}</p>
            <div className="a11y-row">
              <button type="button" onClick={() => setPrefs((p) => ({ ...p, fontScale: clampFontScale(p.fontScale - 10) }))}>
                {t('decrease')}
              </button>
              <span aria-live="polite">{percent}</span>
              <button type="button" onClick={() => setPrefs((p) => ({ ...p, fontScale: clampFontScale(p.fontScale + 10) }))}>
                {t('increase')}
              </button>
              <button type="button" onClick={() => setPrefs((p) => ({ ...p, fontScale: DEFAULT_PREFS.fontScale }))}>
                {t('reset')}
              </button>
            </div>
          </div>

          <div className="a11y-section">
            <p className="a11y-section-title">{t('visualAdjustments')}</p>
            <div className="a11y-grid">
              <button type="button" aria-pressed={prefs.highContrast} onClick={() => toggle('highContrast')}>
                {t('highContrast')}
              </button>
              <button type="button" aria-pressed={prefs.monochrome} onClick={() => toggle('monochrome')}>
                {t('monochrome')}
              </button>
              <button type="button" aria-pressed={prefs.invertColors} onClick={() => toggle('invertColors')}>
                {t('invertColors')}
              </button>
              <button type="button" aria-pressed={prefs.highlightLinks} onClick={() => toggle('highlightLinks')}>
                {t('highlightLinks')}
              </button>
              <button type="button" aria-pressed={prefs.readableFont} onClick={() => toggle('readableFont')}>
                {t('readableFont')}
              </button>
              <button type="button" aria-pressed={prefs.pauseAnimations} onClick={() => toggle('pauseAnimations')}>
                {t('pauseAnimations')}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

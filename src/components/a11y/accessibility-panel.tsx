'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { Accessibility, Maximize2, Minimize2 } from 'lucide-react';
import { BRAND_A11Y_PREFS_KEY, BRAND_A11Y_POSITION_KEY, BRAND_A11Y_MINIMIZED_KEY } from '@/lib/brand';

type A11yPrefs = {
  fontScale: number;
  highContrast: boolean;
  highlightLinks: boolean;
  readableFont: boolean;
  pauseAnimations: boolean;
  monochrome: boolean;
  invertColors: boolean;
};

const STORAGE_KEY = BRAND_A11Y_PREFS_KEY;
const POSITION_KEY = BRAND_A11Y_POSITION_KEY;
const MINIMIZED_KEY = BRAND_A11Y_MINIMIZED_KEY;
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
  const [prefs, setPrefs] = useState<A11yPrefs>(() => {
    if (typeof window === 'undefined') return DEFAULT_PREFS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Partial<A11yPrefs>) : {};
      const next = { ...DEFAULT_PREFS, ...parsed };
      next.fontScale = clampFontScale(next.fontScale ?? DEFAULT_PREFS.fontScale);
      return next;
    } catch {
      return DEFAULT_PREFS;
    }
  });
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [panelPosition, setPanelPosition] = useState<{ left: number; top: number } | null>(null);
  const [minimized, setMinimized] = useState(false);
  const minimizedInitialized = useRef(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(MINIMIZED_KEY) === '1') setMinimized(true);
    } catch { /* ignore */ }
    minimizedInitialized.current = true;
  }, []);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const dragStateRef = useRef<{ pointerId: number; startX: number; startY: number } | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    applyPrefs(prefs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!minimizedInitialized.current) return;
    try {
      localStorage.setItem(MINIMIZED_KEY, minimized ? '1' : '0');
    } catch {
      // Ignore storage failures.
    }
  }, [minimized]);

  const clampPosition = (x: number, y: number) => {
    const toggleRect = toggleRef.current?.getBoundingClientRect();
    const width = Math.max(48, Math.ceil(toggleRect?.width || (minimized ? 48 : 124)));
    const height = Math.max(48, Math.ceil(toggleRect?.height || 48));
    const maxX = Math.max(8, window.innerWidth - width - 8);
    const maxY = Math.max(8, window.innerHeight - height - 8);
    return {
      x: Math.max(8, Math.min(x, maxX)),
      y: Math.max(8, Math.min(y, maxY)),
    };
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(POSITION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { x?: number; y?: number };
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setPosition(clampPosition(parsed.x, parsed.y));
          return;
        }
      }
    } catch {
      // Ignore invalid saved position.
    }
    setPosition({ x: 16, y: Math.max(16, window.innerHeight - 84) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minimized]);

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
        return clampPosition(prev.x, prev.y);
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minimized]);

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

  useEffect(() => {
    if (!open || !position) return;

    const updatePanelPosition = () => {
      const toggleRect = toggleRef.current?.getBoundingClientRect();
      if (!toggleRect) return;

      const panelRect = panelRef.current?.getBoundingClientRect();
      const panelWidth = Math.min(window.innerWidth * 0.92, panelRect?.width || 360);
      const panelHeight = Math.min(window.innerHeight * 0.75, panelRect?.height || 620);

      const left = Math.max(8, Math.min(toggleRect.left, window.innerWidth - panelWidth - 8));
      const spaceAbove = toggleRect.top - 8;
      const spaceBelow = window.innerHeight - toggleRect.bottom - 8;
      const top =
        spaceAbove >= panelHeight || spaceAbove >= spaceBelow
          ? Math.max(8, toggleRect.top - panelHeight - 8)
          : Math.min(window.innerHeight - panelHeight - 8, toggleRect.bottom + 8);

      setPanelPosition({ left, top });
    };

    const raf = requestAnimationFrame(updatePanelPosition);
    window.addEventListener('resize', updatePanelPosition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePanelPosition);
    };
  }, [open, position, minimized]);

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
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onTogglePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const next = clampPosition(event.clientX - drag.startX, event.clientY - drag.startY);
    if (Math.abs(event.movementX) > 1 || Math.abs(event.movementY) > 1) {
      suppressClickRef.current = true;
    }
    setPosition(next);
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
      style={position ? ({ left: `${position.x}px`, top: `${position.y}px` } as CSSProperties) : { visibility: 'hidden' }}
    >
      <div className="a11y-widget-actions">
        <button
          type="button"
          className="a11y-mini-toggle"
          onClick={() => setMinimized((v) => !v)}
          aria-label={t('openButton')}
        >
          {minimized ? <Maximize2 className="h-3.5 w-3.5" aria-hidden /> : <Minimize2 className="h-3.5 w-3.5" aria-hidden />}
        </button>
      </div>

      <button
        ref={toggleRef}
        type="button"
        className={minimized ? 'a11y-toggle a11y-toggle--mini' : 'a11y-toggle'}
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
        <Accessibility className="a11y-toggle-icon" aria-hidden />
        {!minimized && <span>{t('openShort')}</span>}
      </button>

      {open && (
        <section
          ref={panelRef}
          id="a11y-widget-panel"
          className="a11y-panel"
          style={panelPosition ? ({ left: `${panelPosition.left}px`, top: `${panelPosition.top}px` } as CSSProperties) : undefined}
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

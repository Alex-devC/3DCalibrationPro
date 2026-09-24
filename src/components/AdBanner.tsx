import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '../i18n/I18nContext.tsx';
import { db } from '../data/storage.ts';

export interface AdBannerProps {
  variant?: 'reserve' | 'interactive';
  className?: string;
}

const ADSTERRA_CONFIG = {
  mobile: {
    key: '44710d8c7a943040ee71d01db440ae06',
    width: 320,
    height: 50,
    scriptUrl: 'https://www.highrevenueformat.com/44710d8c7a943040ee71d01db440ae06/invoke.js',
  },
  desktop: {
    key: 'ef5b6c49fc95d5a9758fab0d4d48f2c3',
    width: 728,
    height: 90,
    scriptUrl: 'https://www.highrevenueformat.com/ef5b6c49fc95d5a9758fab0d4d48f2c3/invoke.js',
  },
} as const;

export const AdBanner: React.FC<AdBannerProps> = ({ className = '' }) => {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync with global reactive application settings
  const [showAds, setShowAds] = useState<boolean>(() => {
    return db.getSettings().showAdBanner ?? true;
  });

  const [dismissed, setDismissed] = useState<boolean>(false);
  const [containerWidth, setContainerWidth] = useState<number>(() => {
    return typeof window !== 'undefined' ? window.innerWidth : 360;
  });

  // Reactive subscription to db settings changes
  useEffect(() => {
    return db.subscribe(() => {
      setShowAds(db.getSettings().showAdBanner ?? true);
    });
  }, []);

  // Measure container width accurately using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = (w: number) => {
      if (w > 0) setContainerWidth(Math.floor(w));
    };

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = entry.contentRect.width;
          updateWidth(w);
        }
      });
      ro.observe(containerRef.current);
      return () => ro.disconnect();
    } else {
      const onResize = () => updateWidth(window.innerWidth);
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
  }, []);

  // Format decision: Desktop 728×90 requires at least 748px available width
  const isDesktop = containerWidth >= 748;
  const currentFormat = isDesktop ? 'desktop' : 'mobile';
  const config = ADSTERRA_CONFIG[currentFormat];

  // Mobile responsiveness: Scale down smoothly if screen width < 320px
  const scale = !isDesktop && containerWidth < 320 && containerWidth > 0
    ? Math.max(0.65, containerWidth / 320)
    : 1;

  // Build isolated HTML payload for iframe sandboxing
  // Prevents global window.atOptions pollution and script collisions
  const adHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Advertisement</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background: transparent;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key' : '${config.key}',
      'format' : 'iframe',
      'height' : ${config.height},
      'width' : ${config.width},
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="${config.scriptUrl}"></script>
</body>
</html>`;

  // Inject ad script cleanly into isolated iframe document
  useEffect(() => {
    if (!showAds || dismissed) return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(adHtml);
        doc.close();
      }
    } catch {
      try {
        iframe.srcdoc = adHtml;
      } catch {
        // Fallback handled gracefully
      }
    }
  }, [showAds, dismissed, currentFormat, adHtml]);

  // If user disabled ads in settings or dismissed in session:
  // Strictly zero scripts or iframes loaded
  if (!showAds || dismissed) {
    return null;
  }

  const computedContainerHeight = isDesktop
    ? config.height
    : Math.round(config.height * scale);

  return (
    <aside
      ref={containerRef}
      className={`w-full max-w-full flex flex-col items-center justify-center my-4 relative z-0 select-none ${className}`}
      aria-label={t('common.advertisement')}
    >
      {/* Discreet metadata bar */}
      <div
        className="flex items-center justify-between pb-1 text-outline/60 font-mono text-[9px] uppercase tracking-wider transition-all"
        style={{ width: isDesktop ? config.width : Math.min(containerWidth, config.width) }}
      >
        <div className="flex items-center gap-1.5">
          <span>{t('common.advertisement')}</span>
          <span className="w-1 h-1 rounded-full bg-outline/40" />
          <span>{config.width}×{config.height}</span>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-outline/40 hover:text-on-surface transition-colors p-0.5 rounded"
          title={t('common.close')}
          aria-label={t('common.close')}
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      </div>

      {/* Frame wrapper with overflow control and scaling */}
      <div
        className="relative flex items-center justify-center overflow-hidden rounded-lg border border-surface-container-high/60 bg-surface-container-low shadow-sm transition-all"
        style={{
          width: isDesktop ? config.width : Math.min(containerWidth, config.width),
          height: computedContainerHeight,
        }}
      >
        {/* Discreet background indicator for local dev / offline / adblocker resilience */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-2 text-center"
          aria-hidden="true"
        >
          <div className="flex items-center gap-1 text-outline/35 font-mono text-[10px]">
            <span className="material-symbols-outlined text-[14px]">ad_units</span>
            <span>ADSTERRA NETWORK</span>
          </div>
          <span className="font-mono text-[9px] text-outline/25">
            {isDesktop ? '728 × 90 // LEADERBOARD DESKTOP' : '320 × 50 // BANNER MOBILE'}
          </span>
        </div>

        {/* Real Adsterra isolated execution sandbox */}
        <div
          style={{
            width: config.width,
            height: config.height,
            transform: !isDesktop && scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: 'top center',
          }}
          className="shrink-0 flex items-center justify-center"
        >
          <iframe
            key={`${currentFormat}-${config.key}`}
            ref={iframeRef}
            title={`Adsterra ${currentFormat} banner`}
            width={config.width}
            height={config.height}
            scrolling="no"
            className="w-full h-full border-0 overflow-hidden bg-transparent"
          />
        </div>
      </div>
    </aside>
  );
};

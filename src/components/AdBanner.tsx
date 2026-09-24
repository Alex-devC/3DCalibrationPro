import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext.tsx';

interface AdBannerProps {
  variant?: 'reserve' | 'interactive';
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ variant = 'reserve', className = '' }) => {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null; // Collapses gracefully when closed or absent
  }

  if (variant === 'interactive') {
    return (
      <aside
        id="benchmark-sponsor-banner"
        className={`w-full rounded-lg bg-surface-container p-space-sm flex items-center justify-between gap-space-sm shadow-sm transition-opacity duration-200 border border-surface-container-high/60 ${className}`}
        aria-label="Sponsored advertisement"
      >
        <div className="flex items-center gap-space-sm min-w-0">
          <div className="w-10 h-10 rounded bg-surface-container-high flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[20px]">bolt</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] text-primary uppercase font-bold tracking-wide">
                {t('dashboard.sponsoredSpec')}
              </span>
              <span className="w-1 h-1 rounded-full bg-outline"></span>
              <span className="font-mono text-[11px] text-on-surface-variant">
                {t('dashboard.upgradeTitle')}
              </span>
            </div>
            <p className="text-[13px] text-on-surface truncate">
              {t('dashboard.upgradeDesc')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            className="h-9 px-3 rounded bg-surface-container-high text-primary font-mono text-[12px] flex items-center justify-center hover:bg-surface-container-highest transition-colors active:scale-95"
            onClick={() => {
              // placeholder sponsor action
            }}
          >
            {t('dashboard.explore')}
          </button>
          <button
            type="button"
            aria-label="Dismiss Ad"
            className="w-8 h-8 rounded flex items-center justify-center text-outline hover:text-on-surface active:scale-90 transition-transform"
            onClick={() => setDismissed(true)}
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </aside>
    );
  }

  // Baseline Non-Intrusive Reserve Slot
  return (
    <div
      className={`w-full rounded bg-surface-container-high h-12 flex items-center justify-between px-space-md font-mono text-[11px] text-outline border border-outline-variant/30 select-none ${className}`}
      aria-label="Sponsored benchmark reserve"
    >
      <span className="tracking-wider uppercase">
        {t('dashboard.sponsoredSpec')}
      </span>
      <span className="font-mono text-primary tracking-tight">
        {t('dashboard.nonIntrusiveReserve')}
      </span>
    </div>
  );
};

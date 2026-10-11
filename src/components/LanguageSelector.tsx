import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LANGUAGE_NATIVE_NAMES,
  SUPPORTED_LANGUAGE_CODES,
  changeAppLanguage,
  type LanguageCode,
} from '../localization';
import { AppIcon } from '../lib/icons';

export default function LanguageSelector({
  variant = 'grid',
}: {
  variant?: 'grid' | 'icon' | 'pills';
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const current = (i18n.language as LanguageCode) || 'en';

  const select = async (code: LanguageCode) => {
    await changeAppLanguage(code);
    setOpen(false);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1600);
  };

  const chips = (
    <div className="flex flex-wrap gap-2">
      {SUPPORTED_LANGUAGE_CODES.map((code) => {
        const selected = current === code || current.startsWith(`${code}-`);
        return (
          <button
            key={code}
            type="button"
            onClick={() => select(code)}
            aria-pressed={selected}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
              selected
                ? 'bg-gradient-to-r from-[#073B3A] to-[#087F73] text-white shadow-xs'
                : 'bg-white/80 text-textSecondary border border-border/80 hover:bg-white hover:border-primary/40'
            }`}
          >
            {LANGUAGE_NATIVE_NAMES[code]}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-10 items-center gap-1.5 rounded-full bg-white/85 px-3 shadow-glass border border-white text-xs font-bold text-deepEmerald hover:bg-white transition-all active:scale-95"
          aria-label={t('common.chooseLanguage')}
        >
          <span className="text-sm">🌐</span>
          <span className="uppercase">{current.slice(0, 2)}</span>
          <span className="text-[10px] text-textMuted">▼</span>
        </button>
      ) : (
        chips
      )}

      {/* Language Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white/95 p-5 shadow-lifted border border-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌐</span>
                <h3 className="text-base font-extrabold text-deepEmerald">
                  {t('common.chooseLanguage')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-textMuted hover:text-deepEmerald"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">{chips}</div>
          </div>
        </div>
      )}

      {/* Toast Confirmation */}
      {toastVisible && (
        <div className="pointer-events-none fixed inset-x-0 bottom-10 z-50 flex justify-center px-4 animate-fade-in">
          <div className="flex items-center gap-2 rounded-full bg-deepEmerald px-5 py-2.5 text-xs font-bold text-white shadow-lifted border border-mint">
            <AppIcon name="checkmark-circle" size={16} className="text-mint" />
            <span>{t('common.languageChanged')}</span>
          </div>
        </div>
      )}
    </>
  );
}

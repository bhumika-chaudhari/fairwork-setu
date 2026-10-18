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
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 active:scale-95 ${
              selected
                ? 'bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white shadow-dockActive border border-[#E5953E]/50'
                : 'bg-white/80 hover:bg-white text-textSecondary border border-[#F4EBDD] hover:border-primary/40 backdrop-blur-md shadow-xs'
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
          className="flex h-10 items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-xl px-3 shadow-glass border border-[#F4EBDD] text-xs font-bold text-deepEmerald hover:bg-white transition-all active:scale-95"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E2B3E]/30 p-4 backdrop-blur-xl animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-[30px] bg-white/90 p-6 shadow-glassModal border border-[#F4EBDD] backdrop-blur-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent" />
            <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
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

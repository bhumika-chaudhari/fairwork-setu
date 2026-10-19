import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LANGUAGE_NATIVE_NAMES,
  SUPPORTED_LANGUAGE_CODES,
  changeAppLanguage,
  type LanguageCode,
} from '../localization';
import { AppIcon } from '../lib/icons';
import ModalPortal from './ModalPortal';
import { playPop } from '../lib/feedback';

interface LanguageSelectorProps {
  variant?: 'grid' | 'icon' | 'pills';
  size?: 'sm' | 'md';
  className?: string;
}

export default function LanguageSelector({
  variant = 'grid',
  size = 'md',
  className = '',
}: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const current = (i18n.language as LanguageCode) || 'en';

  const select = async (code: LanguageCode) => {
    playPop();
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

  const isSmall = size === 'sm';

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex items-center rounded-full bg-white/80 backdrop-blur-xl shadow-glass border border-[#F4EBDD] font-bold text-deepEmerald hover:bg-white transition-all active:scale-95 ${
            isSmall ? 'h-9 px-2.5 gap-1 text-xs' : 'h-10 px-3 gap-1.5 text-xs'
          } ${className}`}
          aria-label={t('common.chooseLanguage')}
        >
          <span className={isSmall ? 'text-xs' : 'text-sm'}>🌐</span>
          <span className="uppercase text-[11px] font-bold tracking-tight">{current.slice(0, 2)}</span>
          <span className="text-[9px] text-textMuted">▼</span>
        </button>
      ) : (
        chips
      )}

      {/* Language Modal */}
      <ModalPortal
        isOpen={open}
        onClose={() => setOpen(false)}
        maxWidthClass="sm:max-w-sm"
      >
        <div className="shrink-0 px-6 pt-4 pb-3 border-b border-border/40 flex items-center justify-between">
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
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 max-h-[60vh]">{chips}</div>
      </ModalPortal>

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

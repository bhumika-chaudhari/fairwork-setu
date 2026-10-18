import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../lib/icons';
import SetuLogo from '../components/SetuLogo';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-warmCream px-6 text-center">
      <div className="mb-4">
        <SetuLogo size="lg" />
      </div>
      <div className="my-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-cleanWhite/90 shadow-glass border border-softBorder text-terracotta">
        <AppIcon name="search-outline" size={44} />
      </div>
      <h1 className="mb-2 text-2xl md:text-3xl font-extrabold text-warmCocoa">
        {t('notFound.title')}
      </h1>
      <p className="mb-8 max-w-sm text-sm text-textSecondary leading-relaxed">
        {t('notFound.body')}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/home', { replace: true })}
          className="flex h-12 items-center gap-2 rounded-full emerald-gradient-btn px-6 font-bold text-white shadow-warm transition-transform active:scale-[0.98]"
        >
          <AppIcon name="home" size={16} />
          <span>{t('notFound.goHome')}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex h-12 items-center gap-2 rounded-full bg-cleanWhite/90 border border-softBorder px-6 font-bold text-warmCocoa shadow-glass hover:bg-cleanWhite transition-transform active:scale-[0.98]"
        >
          <span>Landing Page</span>
        </button>
      </div>
    </div>
  );
}

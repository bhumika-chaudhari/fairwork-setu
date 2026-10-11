import { useTranslation } from 'react-i18next';
import type { HealthResource } from '../data/mockData';
import { AppIcon } from '../lib/icons';
import Badge from './Badge';
import Card from './Card';

export default function HealthResourceCard({ resource }: { resource: HealthResource }) {
  const { t } = useTranslation();

  return (
    <Card variant="health">
      <div className="mb-3 flex items-center">
        <div className="mr-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-healthSoft">
          <AppIcon name={resource.isGovernment ? 'shield-checkmark' : 'medical'} size={22} className="text-health" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold leading-7 text-textPrimary">{t(resource.nameKey)}</h3>
          <p className="mt-0.5 text-sm text-textSecondary">{t(resource.typeKey)}</p>
        </div>
        <Badge label={resource.distance} tone="health" />
      </div>
      <p className="mb-3 text-sm font-medium text-health">{t(resource.servicesKey)}</p>
      <div className="flex min-h-[48px] items-center justify-between border-t border-border pt-3">
        {resource.phone ? (
          <a href={`tel:${resource.phone}`} className="flex min-h-[48px] items-center text-sm font-medium text-health">
            <AppIcon name="call" size={16} className="mr-1" />
            {resource.phone}
          </a>
        ) : (
          <span />
        )}
        <span className="flex min-h-[48px] items-center text-sm font-semibold text-health">
          {t('sehat.viewSource')}
          <AppIcon name="open-outline" size={14} className="ml-1" />
        </span>
      </div>
    </Card>
  );
}

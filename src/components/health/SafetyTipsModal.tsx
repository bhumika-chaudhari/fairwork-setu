import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppIcon } from '../../lib/icons';
import type { HealthSafetyTip } from '../../types/health';
import {
  fetchSafetyTips,
  saveHealthItem,
  removeSavedHealthItem,
  isHealthItemSaved,
} from '../../services/healthService';
import ModalPortal from '../ModalPortal';

interface SafetyTipsModalProps {
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Tips' },
  { id: 'heat', label: 'Heat & Summer' },
  { id: 'lifting', label: 'Ergonomics' },
  { id: 'pollution', label: 'Dust & Pollution' },
  { id: 'road_safety', label: 'Road Safety' },
  { id: 'stress', label: 'Rest & Mental' },
];

export default function SafetyTipsModal({ onClose }: SafetyTipsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({});
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});

  const { data: tips = [], isLoading } = useQuery({
    queryKey: ['health_safety_tips', selectedCategory],
    queryFn: () => fetchSafetyTips(selectedCategory),
  });

  const handleHelpfulClick = (tipId: string, initialCount: number) => {
    setHelpfulCounts((prev) => {
      const current = prev[tipId] ?? initialCount;
      return { ...prev, [tipId]: current + 1 };
    });
  };

  const handleToggleSave = (tip: HealthSafetyTip) => {
    if (isHealthItemSaved(tip.id)) {
      removeSavedHealthItem(tip.id);
      setSavedIds((prev) => ({ ...prev, [tip.id]: false }));
    } else {
      saveHealthItem({
        id: tip.id,
        type: 'tip',
        title: tip.title,
        subtitle: `${tip.categoryLabel} • ${tip.summary.slice(0, 45)}...`,
        data: tip,
      });
      setSavedIds((prev) => ({ ...prev, [tip.id]: true }));
    }
  };

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      maxWidthClass="sm:max-w-xl"
      panelClassName="h-[92dvh] sm:h-[650px]"
    >
      {/* Pinned Header */}
      <div className="shrink-0 px-5 pt-3 pb-3 border-b border-[#F4EBDD] bg-white">
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#E5953E] text-white shadow-xs">
                <AppIcon name="shield-checkmark" size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#1E2B3E] font-serif">
                  Workplace Safety & Health Guidance
                </h3>
                <p className="text-xs text-[#231F20]/75">
                  Practical, evidence-informed advice for informal and gig occupations.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all active:scale-95"
              aria-label="Close"
            >
              <AppIcon name="close" size={16} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-5 pt-3 pb-1 shrink-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`py-1.5 px-3 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-[#B34A26] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tips Stream */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-3 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-stone-500">
              Loading occupational safety guidance...
            </div>
          ) : (
            tips.map((tip) => {
              const currentHelpful = helpfulCounts[tip.id] ?? tip.helpfulCount;
              const isSaved = savedIds[tip.id] ?? isHealthItemSaved(tip.id);

              return (
                <div
                  key={tip.id}
                  className="rounded-2xl border border-[#F4EBDD] bg-[#FDF8F0]/40 p-4 space-y-3 shadow-xs hover:border-[#E5953E]/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#3A757D] bg-white px-2 py-0.5 rounded-md border border-stone-200">
                        {tip.categoryLabel}
                      </span>
                      <h4 className="text-sm font-bold text-[#1E2B3E] mt-1.5">
                        {tip.title}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleSave(tip)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        isSaved
                          ? 'bg-amber-50 text-[#B34A26] border-amber-200'
                          : 'bg-white text-stone-400 border-stone-200 hover:text-stone-700'
                      }`}
                      title={isSaved ? 'Bookmarked' : 'Bookmark tip'}
                    >
                      <AppIcon name={isSaved ? 'bookmark' : 'bookmark-outline'} size={15} />
                    </button>
                  </div>

                  <p className="text-xs text-[#231F20]/80 leading-relaxed font-medium">
                    {tip.summary}
                  </p>

                  <div className="rounded-xl bg-white p-3 border border-[#F4EBDD] space-y-1">
                    <span className="text-[10px] font-extrabold text-[#7C2D16] uppercase tracking-wider block">
                      Recommended Steps:
                    </span>
                    <ul className="space-y-1">
                      {(tip.tips || []).map((step: string, idx: number) => (
                        <li key={idx} className="text-xs text-stone-700 flex items-start gap-1.5">
                          <span className="text-[#B34A26] font-bold">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => handleHelpfulClick(tip.id, tip.helpfulCount)}
                      className="flex items-center gap-1.5 text-stone-600 hover:text-[#B34A26] font-semibold transition-all active:scale-95"
                    >
                      <AppIcon name="thumbs-up-outline" size={13} />
                      <span>Helpful ({currentHelpful})</span>
                    </button>

                    <span className="text-[10px] text-stone-400">
                      FairWork Occupational Health
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pinned Footer */}
        <div className="shrink-0 px-5 py-3 border-t border-[#F4EBDD] bg-[#FDF8F0] flex items-center justify-between text-xs text-stone-500">
          <span>Promoting worker safety & injury prevention</span>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-stone-700 transition-all active:scale-95"
          >
            Close
          </button>
        </div>
      </ModalPortal>
    );
  }

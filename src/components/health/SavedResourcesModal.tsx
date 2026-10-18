import { useState, useEffect } from 'react';
import { AppIcon } from '../../lib/icons';
import type { SavedHealthItem } from '../../types/health';
import {
  getSavedHealthItems,
  removeSavedHealthItem,
} from '../../services/healthService';
import ModalPortal from '../ModalPortal';

interface SavedResourcesModalProps {
  onClose: () => void;
  onOpenFacility: (facility: any) => void;
  onOpenScheme: (scheme: any) => void;
}

export default function SavedResourcesModal({
  onClose,
  onOpenFacility,
  onOpenScheme,
}: SavedResourcesModalProps) {
  const [items, setItems] = useState<SavedHealthItem[]>([]);

  useEffect(() => {
    setItems(getSavedHealthItems());
  }, []);

  const handleRemove = (id: string) => {
    const updated = removeSavedHealthItem(id);
    setItems(updated);
  };

  const handleClearAll = () => {
    if (confirm('Clear all your saved health bookmarks?')) {
      localStorage.removeItem('setu_saved_health_items_v1');
      setItems([]);
    }
  };

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      maxWidthClass="sm:max-w-xl"
      panelClassName="h-[92dvh] sm:h-[600px]"
    >
      {/* Pinned Header */}
      <div className="shrink-0 px-5 pt-3 pb-3 border-b border-[#F4EBDD] bg-white">
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#B34A26] text-white shadow-xs">
                <AppIcon name="bookmark-check" size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#1E2B3E] font-serif">
                  Saved Health Resources
                </h3>
                <p className="text-xs text-[#231F20]/75">
                  Your bookmarked clinics, welfare schemes, and safety tips.
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

        {/* Privacy Note */}
        <div className="px-5 pt-3 mb-1 shrink-0">
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2 shadow-xs">
            <AppIcon name="shield-checkmark" size={16} className="text-emerald-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Privacy Assurance:</strong> Your saved items are stored strictly locally on your device. They are never shared with gig platforms or advertisers.
            </p>
          </div>
        </div>

        {/* List of saved items */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-3 space-y-2.5">
          {items.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-500">
              <AppIcon name="bookmark" size={32} className="mx-auto text-stone-400 mb-2" />
              <p className="font-bold text-stone-700">No saved health items yet</p>
              <p className="mt-1">
                Tap the bookmark icon on any hospital, welfare scheme, or tip to save it here for offline reference.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-xs flex items-center justify-between gap-3 hover:border-stone-300 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-[#B34A26] bg-[#B34A26]/10 px-2 py-0.5 rounded">
                      {item.type}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      Saved {new Date(item.savedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#1E2B3E] truncate mt-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-stone-500 truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (item.type === 'facility') onOpenFacility(item.data);
                      if (item.type === 'scheme') onOpenScheme(item.data);
                    }}
                    className="py-1 px-2.5 rounded-lg text-xs font-bold text-[#3A757D] bg-[#3A757D]/10 hover:bg-[#3A757D]/20"
                  >
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100"
                    title="Remove item"
                  >
                    <AppIcon name="trash" size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pinned Footer */}
        <div className="shrink-0 px-5 py-3 border-t border-[#F4EBDD] bg-[#FDF8F0] flex items-center justify-between text-xs">
          {items.length > 0 ? (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-stone-500 hover:text-red-600 font-bold transition-colors"
            >
              Clear All ({items.length})
            </button>
          ) : (
            <div />
          )}

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

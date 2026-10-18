import { useState } from 'react';
import { AppIcon } from '../../lib/icons';
import ModalPortal from '../ModalPortal';

interface EmergencyHelpModalProps {
  onClose: () => void;
  locality?: string;
}

export default function EmergencyHelpModal({ onClose, locality = 'Kothrud, Pune' }: EmergencyHelpModalProps) {
  const [copiedLoc, setCopiedLoc] = useState(false);

  const handleCopyLocality = () => {
    navigator.clipboard?.writeText(locality);
    setCopiedLoc(true);
    setTimeout(() => setCopiedLoc(false), 2000);
  };

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      maxWidthClass="sm:max-w-lg"
      panelClassName="border-2 border-red-300"
    >
      {/* Pinned Header */}
      <div className="shrink-0 px-5 pt-3 pb-3 border-b border-stone-200 bg-white">
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md animate-pulse">
                <AppIcon name="siren" size={22} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-red-600 block">
                  Immediate Assistance
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#1E2B3E] font-serif">
                  National Emergency Help
                </h3>
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
          {/* Dispatcher Location Card */}
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 flex items-center justify-between gap-3 shadow-xs">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                Tell the Operator Your Location:
              </span>
              <p className="text-xs font-black text-[#1E2B3E] truncate mt-0.5">
                {locality}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyLocality}
              className="py-1 px-2.5 rounded-lg text-[11px] font-bold bg-white text-stone-800 border border-stone-300 hover:bg-stone-50 shrink-0 transition-all active:scale-95"
            >
              {copiedLoc ? '✓ Copied' : 'Copy Area'}
            </button>
          </div>

          {/* PRIMARY CALL ACTION CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 112 National Emergency */}
            <a
              href="tel:112"
              className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-white p-4 shadow-md hover:shadow-lg transition-all active:scale-95 text-center group"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 mb-1.5">
                <AppIcon name="call" size={22} className="text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight">112</span>
              <span className="text-xs font-bold mt-0.5 text-white/95">
                National Emergency (All India)
              </span>
              <span className="text-[10px] text-white/80 mt-0.5">
                Police, Medical, Fire, Disaster
              </span>
            </a>

            {/* 108 Ambulance */}
            <a
              href="tel:108"
              className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-white p-4 shadow-md hover:shadow-lg transition-all active:scale-95 text-center group"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 mb-1.5">
                <AppIcon name="heart-pulse" size={22} className="text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight">108</span>
              <span className="text-xs font-bold mt-0.5 text-white/95">
                Free Ambulance Service
              </span>
              <span className="text-[10px] text-white/80 mt-0.5">
                24x7 Emergency Medical Dispatch
              </span>
            </a>
          </div>

          {/* SECONDARY SPECIALIST HELPLINES */}
          <div>
            <h4 className="text-xs font-extrabold text-[#1E2B3E] mb-2">
              Specialist Helplines:
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <a
                href="tel:1091"
                className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-center hover:bg-stone-100 transition-all"
              >
                <span className="block text-sm font-black text-[#B34A26]">1091</span>
                <span className="block text-[10px] font-semibold text-stone-600 mt-0.5">
                  Women
                </span>
              </a>

              <a
                href="tel:1098"
                className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-center hover:bg-stone-100 transition-all"
              >
                <span className="block text-sm font-black text-[#B34A26]">1098</span>
                <span className="block text-[10px] font-semibold text-stone-600 mt-0.5">
                  Childline
                </span>
              </a>

              <a
                href="tel:14416"
                className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-center hover:bg-stone-100 transition-all"
              >
                <span className="block text-sm font-black text-[#3A757D]">14416</span>
                <span className="block text-[10px] font-semibold text-stone-600 mt-0.5">
                  Tele-MANAS
                </span>
              </a>
            </div>
          </div>

          {/* RAPID ACTION FIRST AID PROTOCOLS */}
          <div className="space-y-2 pt-1 border-t border-stone-200">
            <h4 className="text-xs font-extrabold text-[#1E2B3E]">
              Rapid Emergency Guidance:
            </h4>

            <div className="rounded-xl bg-stone-50 border border-stone-200 p-2.5 space-y-1">
              <h5 className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-600 shrink-0" />
                <span>Suspected Heart Attack / Severe Chest Pressure</span>
              </h5>
              <p className="text-[11px] text-stone-600 leading-relaxed pl-3.5">
                Stop physical activity immediately. Sit upright with back supported. Do not attempt to walk or drive. Call 108 or 112 immediately.
              </p>
            </div>

            <div className="rounded-xl bg-stone-50 border border-stone-200 p-2.5 space-y-1">
              <h5 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-600 shrink-0" />
                <span>Heatstroke & Dehydration Collapse</span>
              </h5>
              <p className="text-[11px] text-stone-600 leading-relaxed pl-3.5">
                Move to deep shade. Loosen helmet, boots, and tight clothing. Sponge neck, armpits, and forehead with tap water. Fan continuously.
              </p>
            </div>

            <div className="rounded-xl bg-stone-50 border border-stone-200 p-2.5 space-y-1">
              <h5 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-stone-600 shrink-0" />
                <span>Heavy Bleeding</span>
              </h5>
              <p className="text-[11px] text-stone-600 leading-relaxed pl-3.5">
                Apply continuous firm pressure on the wound with a clean cloth. Elevate the injured arm or leg above heart level.
              </p>
            </div>
          </div>
        </div>

        {/* Pinned Footer */}
        <div className="shrink-0 px-5 py-3 border-t border-stone-200 bg-[#FDF8F0]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-stone-200 text-stone-800 text-xs font-bold hover:bg-stone-300 transition-all active:scale-98"
          >
            Close Emergency Help
          </button>
        </div>
      </ModalPortal>
    );
  }

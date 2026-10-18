import { AppIcon } from '../../lib/icons';
import ListenButton from '../ListenButton';
import type { SpeechTrack } from '../../lib/speechSynthesisContext';

interface DoctorHeroCardProps {
  onCheckinClick?: () => void;
  onVoiceClick?: () => void;
  lang?: string;
}

export default function DoctorHeroCard({ onCheckinClick, onVoiceClick, lang = 'en' }: DoctorHeroCardProps) {
  const speechTrack: SpeechTrack = {
    id: 'health-overview-track',
    title: 'Health & Wellbeing Overview',
    subtitle: 'FairWork Setu Health',
    speech:
      'Welcome to Setu Health. Your health and wellbeing matter. You can check your symptoms, find verified nearby government hospitals and health centres, discover welfare schemes like Ayushman Bharat, or talk to Setu in your preferred language.',
    lang,
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FEF4E8] via-[#FFFDF9] to-[#FDF3EE] border border-[#F4EBDD] p-5 shadow-glass">
      {/* Decorative ambient gradient blooms */}
      <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-[#E5953E]/18 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-[#B34A26]/12 blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Column: Heading and Subtitle */}
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#B34A26] to-[#7C2D16] text-white shadow-sm border border-[#F1B96B]/40">
              <AppIcon name="heart-pulse" size={22} className="text-white drop-shadow-xs" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#B34A26] bg-white/80 px-2.5 py-0.5 rounded-full border border-[#F4EBDD] shadow-xs">
                Setu Sehat • सेहत
              </span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#7C2D16] tracking-tight leading-tight">
            Your Health,<br />Your Support
          </h2>

          <p className="text-xs sm:text-sm text-[#4A423D] leading-relaxed font-medium max-w-sm">
            Care, nearby help and welfare support — in your language.
          </p>

          <div className="pt-1 flex items-center gap-2">
            <ListenButton track={speechTrack} size="sm" />
            <button
              type="button"
              onClick={onCheckinClick}
              className="text-xs font-extrabold text-[#B34A26] hover:text-[#7C2D16] flex items-center gap-1 transition-colors"
            >
              <span>Check symptoms now</span>
              <AppIcon name="arrow-forward" size={12} />
            </button>
          </div>
        </div>

        {/* Right Column: Friendly Doctor Illustration with Speech Bubble */}
        <div className="relative shrink-0 flex items-center justify-center w-48 sm:w-56 h-44 sm:h-48">
          {/* Subtle Circular Backdrop Glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#E5953E]/20 to-[#B34A26]/15 scale-90 blur-xs" />

          {/* Hindi Speech Bubble */}
          <div className="absolute top-2 right-1 z-20 rounded-2xl bg-white/95 backdrop-blur-md px-3 py-1.5 shadow-md border border-[#F4EBDD] text-[11px] font-extrabold text-[#7C2D16] animate-fade-in">
            <span>आप कैसे महसूस कर रहे हैं?</span>
            <div className="absolute -bottom-1.5 left-4 h-3 w-3 rotate-45 bg-white border-r border-b border-[#F4EBDD]" />
          </div>

          {/* Doctor Vector Graphic */}
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full drop-shadow-md relative z-10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Soft warm background halo */}
            <circle cx="100" cy="100" r="80" fill="#FEF4E8" />
            <circle cx="100" cy="100" r="74" fill="#FDF3EE" fillOpacity="0.8" />

            {/* Doctor Shoulders / White Coat */}
            <path
              d="M36 195C36 150 64 135 100 135C136 135 164 150 164 195"
              fill="#FFFFFF"
            />
            {/* Coat collar left & right */}
            <path d="M72 138L86 170L100 148L72 138Z" fill="#FAF5ED" />
            <path d="M128 138L114 170L100 148L128 138Z" fill="#FAF5ED" />

            {/* Inner shirt / tie */}
            <path d="M92 138H108V165L100 174L92 165V138Z" fill="#B34A26" />

            {/* Stethoscope around neck */}
            <path
              d="M74 142C74 170 82 186 100 186C118 186 126 170 126 142"
              stroke="#7C2D16"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Stethoscope bell */}
            <circle cx="100" cy="186" r="6" fill="#F1B96B" stroke="#7C2D16" strokeWidth="2" />
            <circle cx="100" cy="186" r="2" fill="#B34A26" />

            {/* Neck */}
            <rect x="88" y="112" width="24" height="28" rx="6" fill="#F4B896" />

            {/* Head / Face */}
            <ellipse cx="100" cy="85" rx="30" ry="34" fill="#F8C7AB" />

            {/* Hair */}
            <path
              d="M70 78C70 54 82 46 100 46C118 46 130 54 130 78C127 70 120 62 100 62C80 62 73 70 70 78Z"
              fill="#231F20"
            />

            {/* Ears */}
            <circle cx="69" cy="85" r="6" fill="#F4B896" />
            <circle cx="131" cy="85" r="6" fill="#F4B896" />

            {/* Eyebrows */}
            <path d="M80 74C84 72 89 73 92 75" stroke="#231F20" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M108 75C111 73 116 72 120 74" stroke="#231F20" strokeWidth="2.5" strokeLinecap="round" />

            {/* Eyes */}
            <ellipse cx="86" cy="82" rx="3.5" ry="4" fill="#231F20" />
            <ellipse cx="114" cy="82" rx="3.5" ry="4" fill="#231F20" />
            <circle cx="85" cy="80.5" r="1" fill="#FFFFFF" />
            <circle cx="113" cy="80.5" r="1" fill="#FFFFFF" />

            {/* Friendly Smile */}
            <path
              d="M90 98C94 103 106 103 110 98"
              stroke="#B34A26"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Nose */}
            <path d="M99 82V90H103" stroke="#E29A78" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

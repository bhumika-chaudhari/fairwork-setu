export default function AtmosphericBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
      {/* Top Left Saffron Gold & Warm Amber Sunrise Glow */}
      <div className="absolute -top-32 -left-28 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-[#E5953E]/28 via-[#F1B96B]/20 to-transparent blur-[95px]" />

      {/* Top Right Terracotta & Warm Cocoa Brand Focal Bloom */}
      <div className="absolute -top-24 -right-32 h-[560px] w-[560px] rounded-full bg-gradient-to-bl from-[#B34A26]/20 via-[#7C2D16]/15 to-transparent blur-[100px]" />

      {/* Mid Left Warm Amber & Safety Yellow Pill Accent */}
      <div className="absolute top-[35%] -left-32 h-[460px] w-[460px] rounded-full bg-gradient-to-tr from-[#F1B96B]/25 via-[#E5A823]/15 to-transparent blur-[90px]" />

      {/* Mid Right Dusty Teal Contextual Balance */}
      <div className="absolute top-[48%] -right-24 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-[#3A757D]/18 via-[#3A757D]/10 to-transparent blur-[100px]" />

      {/* Bottom Deep Navy Structural Anchor & Terracotta Warmth */}
      <div className="absolute -bottom-24 left-[10%] h-[520px] w-[640px] rounded-full bg-gradient-to-t from-[#1E2B3E]/16 via-[#B34A26]/12 to-transparent blur-[110px]" />

      {/* Subtle warm cream sheen overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-[#FDF8F0]/30" />
    </div>
  );
}

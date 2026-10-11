export default function AtmosphericBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
      {/* Top Left Mint-Teal Luminous Bloom */}
      <div className="absolute -top-32 -left-28 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-[#72E5C2]/35 via-[#087F73]/22 to-transparent blur-[95px]" />

      {/* Top Right Oceanic Teal & Sky Cyan Pool */}
      <div className="absolute -top-24 -right-32 h-[560px] w-[560px] rounded-full bg-gradient-to-bl from-[#087F73]/25 via-[#38BDF8]/20 to-transparent blur-[100px]" />

      {/* Mid Left Saffron-Gold Sunrise Warmth */}
      <div className="absolute top-[35%] -left-32 h-[460px] w-[460px] rounded-full bg-gradient-to-tr from-[#F4B544]/22 via-[#FDE68A]/15 to-transparent blur-[90px]" />

      {/* Mid Right Pale Icy Blue & Lavender Shimmer */}
      <div className="absolute top-[48%] -right-24 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-[#C7D2FE]/30 via-[#93C5FD]/22 to-transparent blur-[100px]" />

      {/* Bottom Mint & Emerald Pool */}
      <div className="absolute -bottom-24 left-[10%] h-[520px] w-[640px] rounded-full bg-gradient-to-t from-[#72E5C2]/32 via-[#087F73]/18 to-transparent blur-[110px]" />

      {/* Subtle pearlescent sheen overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/20" />
    </div>
  );
}

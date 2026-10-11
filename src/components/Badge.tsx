const tones = {
  success: 'bg-[#E4FAF2] text-deepEmerald border border-[#72E5C2]/60',
  warning: 'bg-[#FEF3C7] text-[#92400E] border border-[#F4B544]/40',
  danger: 'bg-dangerSoft text-danger border border-danger/30',
  health: 'bg-primarySoft text-primary border border-mint/40',
  primary: 'bg-primarySoft text-deepEmerald border border-mint/30',
  accent: 'bg-accentSoft text-[#B45309] border border-saffron/40',
};

export default function Badge({
  label,
  tone = 'primary',
}: {
  label: string;
  tone?: keyof typeof tones;
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${tones[tone]}`}>
      {label}
    </span>
  );
}

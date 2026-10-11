const tones = {
  success: 'bg-[#E4FAF2]/85 text-deepEmerald border border-[#72E5C2]/60 backdrop-blur-md shadow-xs',
  warning: 'bg-[#FEF3C7]/85 text-[#92400E] border border-[#F4B544]/50 backdrop-blur-md shadow-xs',
  danger: 'bg-dangerSoft/85 text-danger border border-danger/40 backdrop-blur-md shadow-xs',
  health: 'bg-primarySoft/85 text-primary border border-mint/45 backdrop-blur-md shadow-xs',
  primary: 'bg-primarySoft/85 text-deepEmerald border border-mint/40 backdrop-blur-md shadow-xs',
  accent: 'bg-accentSoft/85 text-[#B45309] border border-saffron/45 backdrop-blur-md shadow-xs',
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

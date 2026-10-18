const tones = {
  success: 'bg-[#F1F8F3]/90 text-[#2E7D32] border border-[#2E7D32]/40 backdrop-blur-md shadow-xs',
  warning: 'bg-[#FEF9EC]/90 text-[#7C2D16] border border-[#E5A823]/50 backdrop-blur-md shadow-xs',
  danger: 'bg-[#FDF3EE]/90 text-[#B34A26] border border-[#B34A26]/40 backdrop-blur-md shadow-xs',
  health: 'bg-[#FEF4E8]/90 text-[#B34A26] border border-[#E5953E]/40 backdrop-blur-md shadow-xs',
  primary: 'bg-[#FDF3EE]/90 text-[#B34A26] border border-[#F1B96B]/50 backdrop-blur-md shadow-xs',
  accent: 'bg-[#FEF4E8]/90 text-[#7C2D16] border border-[#E5953E]/50 backdrop-blur-md shadow-xs',
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

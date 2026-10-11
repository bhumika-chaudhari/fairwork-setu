import type { ReactNode } from 'react';

export default function ScreenContainer({
  children,
  scroll = true,
  padded = true,
  header,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  header?: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-transparent">
      {header}
      <div className={`flex-1 ${scroll ? 'overflow-y-auto' : 'overflow-hidden'} ${padded ? 'px-4 pb-8 pt-4' : ''}`}>
        {children}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buttonVariants } from '@/components/ui';

export function LoginNotice() {
  const pathname = usePathname();
  return (
    <div role="alert" className="flex flex-col items-start gap-4 border-t border-line-2 py-7">
      <p className="m-0 text-[15px] leading-[23px] text-ink-2">로그인하면 업데이트 소식을 볼 수 있어요</p>
      <Link href={`/login?callbackUrl=${encodeURIComponent(pathname)}`} className={buttonVariants()}>
        로그인
      </Link>
    </div>
  );
}

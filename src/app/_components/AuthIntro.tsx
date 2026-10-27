import Link from 'next/link';

interface AuthIntroFeature {
  title: string;
  description: string;
}

interface AuthIntroProps {
  features: AuthIntroFeature[];
}

// (auth) 그룹 공용 왼쪽 패널: 워드마크 + Display 제목 + 특징 리스트 (.design-ref/Login)
export function AuthIntro({ features }: AuthIntroProps) {
  return (
    <section
      aria-label="서비스 소개"
      className="flex min-w-0 flex-[1_1_480px] flex-col gap-10 border-line px-5 pt-6 pb-10 max-[899.98px]:border-b min-[900px]:gap-16 min-[900px]:border-r min-[900px]:px-16 min-[900px]:pt-10 min-[900px]:pb-16"
    >
      <Link
        href="/"
        className="self-start py-2 text-[16px] font-bold tracking-[-0.02em] text-ink"
      >
        YU 수강 플래너
      </Link>
      <div className="flex max-w-[520px] flex-col gap-8 min-[900px]:mt-6 min-[900px]:gap-10">
        <h2 className="text-[clamp(32px,3.2vw,44px)] leading-[1.15] font-bold tracking-[-0.03em] text-balance">
          <span className="block">영남대학교 생활을</span>
          <span className="block text-primary">스마트하게 설계하다.</span>
        </h2>
        <ul className="flex flex-col">
          {features.map((feature) => (
            <li
              key={feature.title}
              className="flex flex-col gap-1 border-t border-line py-4 last:border-b"
            >
              <span className="text-[16px] leading-6 font-semibold">{feature.title}</span>
              <span className="text-[14px] leading-5 text-ink-2">{feature.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

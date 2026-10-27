import { PageHeader } from '@/components/ui';
import ZoomableImage from '@/components/ui/ZoomableImage';
import { ArrowLink, BackLink, HelpFigures, HelpSection, HelpSteps, HelpText } from '../_components/HelpParts';

interface FlowStep {
  id: string;
  badge: string;
  title: string;
  steps: string[];
  imageSrc: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
}

const flowSections: FlowStep[] = [
  {
    id: 'homepage-portal',
    badge: 'STEP 1',
    title: '홈페이지 로그인 후 포털 이동',
    steps: [
      '홈페이지 접속: https://www.yu.ac.kr/main/index.do',
      '로그인 후 상단 포털 버튼 클릭',
      '포털 페이지 진입',
    ],
    imageSrc: '/help/yu-portal-highlight.png',
    imageAlt: '영남대학교 홈페이지 포털 버튼 강조 화면',
    imageWidth: 972,
    imageHeight: 691,
  },
  {
    id: 'system-navigation',
    badge: 'STEP 2',
    title: '종합정보시스템에서 졸업모의사정 이동',
    steps: [
      '포털에서 종합정보시스템 클릭 후 접속',
      '좌측 메뉴에서 학적관리 선택',
      '학적관리 하위 메뉴의 졸업모의사정 클릭',
    ],
    imageSrc: '/help/yu-portal-system-highlight.png',
    imageAlt: '종합정보시스템 메뉴 강조 화면',
    imageWidth: 799,
    imageHeight: 575,
  },
];

const auditCheckItems = [
  {
    title: '졸업기준 학점',
    description: '총 졸업학점, 전공학점, 교양학점 등 기준값을 먼저 확인합니다.',
  },
  {
    title: '취득 학점',
    description: '현재까지 실제 이수한 학점을 확인하고 기준값과 비교합니다.',
  },
  {
    title: '전공필수 이수 현황',
    description: '전공필수 항목의 기준·취득값을 비교해 필수 이수 충족 여부를 점검합니다. 앱의 전공핵심은 전공 학점 안의 하위 요건이며 전공필수와는 별도 분류입니다. 전공핵심의 기준 학점과 기이수 학점은 졸업요건 수정에서 따로 입력합니다.',
  },
  {
    title: '구분별 학점 표',
    description: '전공, 교양, 총학점 등 구분별 표를 항목 단위로 확인합니다.',
  },
];

export default function GraduationGuidePage() {
  return (
    <div className="flex max-w-[720px] flex-col">
      <BackLink href="/help">도움말로 돌아가기</BackLink>
      <PageHeader
        title="영남대학교 졸업기준·취득학점 확인 방법"
        description="포털의 졸업모의사정 화면에서 기준 학점과 취득 학점을 확인한 뒤 졸업 요건에 입력하세요."
      />

      <div className="border-t border-line-2">
        {flowSections.map((section) => (
          <HelpSection
            key={section.id}
            id={section.id}
            title={
              <>
                <span className="mr-2 text-[13px] font-semibold tracking-normal text-primary tabular-nums">
                  {section.badge}
                </span>
                {section.title}
              </>
            }
          >
            <HelpSteps steps={section.steps} />
            <HelpFigures>
              <ZoomableImage
                src={section.imageSrc}
                alt={section.imageAlt}
                width={section.imageWidth}
                height={section.imageHeight}
              />
            </HelpFigures>
          </HelpSection>
        ))}

        <HelpSection
          id="audit-check"
          last
          title={
            <>
              <span className="mr-2 text-[13px] font-semibold tracking-normal text-primary tabular-nums">STEP 3</span>
              졸업모의사정에서 확인할 항목
            </>
          }
        >
          <HelpText>졸업모의사정 화면에서 기준값과 취득값을 동시에 보며 항목별 충족 여부를 점검하세요.</HelpText>
          <HelpFigures>
            <ZoomableImage
              src="/help/yu-graduation-audit-highlight.png"
              alt="종합정보시스템 학적관리의 졸업모의사정 화면"
              width={1425}
              height={436}
            />
          </HelpFigures>
          <dl className="m-0 mt-5 flex flex-col">
            {auditCheckItems.map((item, index) => (
              <div
                key={item.title}
                className={
                  'flex min-h-[52px] flex-col justify-center gap-0.5 border-t border-line py-2.5' +
                  (index === auditCheckItems.length - 1 ? ' border-b' : '')
                }
              >
                <dt className="text-[15px] font-semibold text-ink">{item.title}</dt>
                <dd className="m-0 text-[14px] leading-5 text-ink-2">{item.description}</dd>
              </div>
            ))}
          </dl>
          <ArrowLink href="/planner" className="mt-4">
            졸업 요건 입력하러 가기
          </ArrowLink>
        </HelpSection>
      </div>
    </div>
  );
}

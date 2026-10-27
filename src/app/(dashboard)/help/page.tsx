import Link from 'next/link';
import ZoomableImage from '@/components/ui/ZoomableImage';
import { HelpToc, type HelpTocItem } from './_components/HelpToc';
import {
  ArrowLink,
  BackLink,
  HelpDefinitionList,
  HelpFigures,
  HelpSection,
  HelpSteps,
  HelpText,
  StepText,
} from './_components/HelpParts';

const tocItems: HelpTocItem[] = [
  { id: 'h-start', label: '시작하기' },
  { id: 'h-plan', label: '수강 계획 세우기' },
  { id: 'h-req', label: '졸업요건 추적' },
  { id: 'h-stats', label: '학과 통계' },
  { id: 'h-profile', label: '프로필 관리' },
  { id: 'h-contact', label: '문의' },
];

const memberComparison = [
  { title: '비회원', rows: ['바로 사용 가능', '브라우저에만 저장', '통계 공유 불가'], mutedLast: true },
  { title: '회원', rows: ['Google 로그인', '모든 기기에서 동기화', '학과 통계에 반영 · 열람 가능'], mutedLast: false },
];

export default function HelpPage() {
  return (
    <div className="flex flex-col">
      <BackLink href="/planner">플래너로 돌아가기</BackLink>
      {/* 도움말 머리: gap 10, 설명 15/23 · 최대 560 (md 미만은 상단바가 제목을 보여준다) */}
      <div className="flex flex-col gap-2.5 pb-7">
        <h1 className="m-0 hidden text-[26px] leading-[34px] font-bold tracking-[-0.02em] text-ink md:block">
          YU 수강 플래너 사용 가이드
        </h1>
        <p className="m-0 max-w-[560px] text-[15px] leading-[23px] text-ink-2">
          처음 쓰는 분을 위한 안내예요. 궁금한 점이 남으면{' '}
          <Link href="/help/feedback" className="font-semibold text-primary hover:text-primary-hover">
            문의 및 건의
          </Link>
          로 보내주세요.
        </p>
      </div>

      <div className="flex flex-col border-t border-line-2 lg:flex-row lg:items-start">
        <HelpToc items={tocItems} />

        <div className="flex min-w-0 max-w-[720px] flex-1 flex-col">
          <HelpSection id="h-start" title="시작하기">
            <HelpText>
              비회원으로 바로 써볼 수도 있고, Google 계정으로 로그인하면 데이터가 서버에 저장돼요. 회원은 어디서든
              접속할 수 있고 학과 통계에 기여할 수 있습니다.
            </HelpText>
            <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-x-10 gap-y-4">
              {memberComparison.map((column) => (
                <div key={column.title} className="flex flex-col">
                  <h3 className="m-0 flex h-10 items-center border-b border-line-3 text-[15px] font-bold text-ink">
                    {column.title}
                  </h3>
                  <ul className="m-0 list-none p-0">
                    {column.rows.map((row, index) => (
                      <li
                        key={row}
                        className={
                          'flex min-h-11 items-center border-b border-line text-[15px] ' +
                          (column.mutedLast && index === column.rows.length - 1 ? 'text-ink-2' : 'text-ink')
                        }
                      >
                        {row}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <HelpText className="mt-5">
              처음 사용 시 학과 선택과 졸업요건 입력 과정을 안내합니다. 졸업요건은 언제든 수정할 수 있으니 정확하지
              않아도 괜찮습니다.
            </HelpText>
            <HelpFigures>
              <ZoomableImage
                src="/help/onboarding-screen.png"
                alt="온보딩 화면 - 학과 선택과 졸업요건 설정"
                width={1080}
                height={400}
              />
            </HelpFigures>
          </HelpSection>

          <HelpSection id="h-plan" title="수강 계획 세우기">
            <HelpText>
              수강 플래너에서는 학기를 추가하고, 과목을 배치하여 졸업까지의 수강 계획을 세울 수 있습니다.
            </HelpText>
            <HelpSteps
              steps={[
                <StepText key="add-semester" title="학기 추가">
                  화면 하단의 + 버튼으로 새 학기를 추가합니다.
                </StepText>,
                <StepText key="add-course" title="과목 추가">
                  학기를 눌러 선택한 뒤, 과목 리스트에서 + 버튼을 누르거나 학기로 끌어다 놓으세요.
                </StepText>,
                <StepText key="move-course" title="과목 이동">
                  과목을 다른 학기로 끌어다 옮길 수 있습니다.
                </StepText>,
                <StepText key="remove-course" title="과목 제거">
                  과목의 X 버튼을 누르거나 과목 리스트 영역으로 끌어다 놓습니다.
                </StepText>,
                <StepText key="status" title="이수 상태">
                  과목의 상태 버튼으로 예정 · 수강중 · 이수를 전환하면 졸업 요건에 바로 반영돼요.
                </StepText>,
              ]}
            />
            <HelpText className="mt-4">
              목록에 없는 과목은 커스텀 과목 추가 기능으로 직접 등록할 수 있습니다.
            </HelpText>
            <HelpFigures>
              <ZoomableImage
                src="/help/planner-semesters.png"
                alt="학기 그리드 - 학년별 학기와 과목 배치"
                width={1500}
                height={600}
              />
              <ZoomableImage
                src="/help/course-catalog.png"
                alt="과목 리스트 - 학년/학기/카테고리 필터와 추가 버튼"
                width={1500}
                height={400}
              />
            </HelpFigures>
          </HelpSection>

          <HelpSection id="h-req" title="졸업요건 추적">
            <HelpText>
              플래너 상단의 졸업요건 영역에서 카테고리별 이수 현황을 한눈에 확인할 수 있습니다. 진행률 바를 통해 각
              영역의 달성도를 실시간으로 파악하세요.
            </HelpText>
            <HelpDefinitionList
              rows={[
                { term: '전공 · 교양', detail: '카테고리별 이수 학점과 기준 학점' },
                { term: '진행률 바', detail: '이수 · 수강중 · 예정을 나눠 표시' },
                { term: '요건 수정', detail: '기이수 학점과 기준 학점을 직접 입력' },
              ]}
            />
            <ArrowLink href="/help/graduation-guide" className="mt-3">
              영남대학교 포털에서 졸업요건 조회하는 방법
            </ArrowLink>
            <HelpFigures>
              <ZoomableImage
                src="/help/requirements-widget.png"
                alt="졸업요건 위젯 - 전공/교양 카테고리별 진행률 바"
                width={1500}
                height={200}
              />
            </HelpFigures>
          </HelpSection>

          <HelpSection id="h-stats" title="학과 통계">
            <HelpText>
              학과 통계 페이지에서 같은 학과 학생들이 많이 담은 인기 과목을 확인할 수 있습니다. 학기별 필터로 특정
              학기의 인기 과목만 볼 수도 있습니다.
            </HelpText>
            <HelpText>
              회원으로 로그인하면 다른 학생들의 익명 수강계획을 열람할 수 있습니다. 내 계획도 자동으로 익명 공유되어
              학과 통계에 기여합니다. 학기별 평균 수강 현황도 확인할 수 있습니다.
            </HelpText>
            <HelpFigures>
              <ZoomableImage
                src="/help/statistics-ranking.png"
                alt="학과 통계 - 카테고리/학기 필터와 인기 과목 순위"
                width={1200}
                height={800}
              />
              <ZoomableImage
                src="/help/statistics-overview.png"
                alt="학기별 평균 수강 현황과 익명 수강계획 열람"
                width={1200}
                height={400}
              />
            </HelpFigures>
          </HelpSection>

          <HelpSection id="h-profile" title="프로필 관리">
            <HelpText>
              프로필 페이지에서 학과, 입학년도, 커리큘럼 연도, 전공 유형(단일전공 · 복수전공 · 부전공)을 변경할 수
              있습니다. 복수전공이나 부전공을 선택하면 해당 학과의 졸업요건도 함께 추적됩니다.
            </HelpText>
            <HelpText>비회원에서 회원으로 전환하려면 Google 로그인을 진행하세요.</HelpText>
          </HelpSection>

          <HelpSection id="h-contact" title="문의" last>
            <HelpText>궁금한 점이나 버그, 빠진 과목, 잘못된 졸업 요건을 발견하면 알려주세요.</HelpText>
            <ArrowLink href="/help/feedback" className="mt-3">
              문의 및 건의 보내기
            </ArrowLink>
          </HelpSection>

          <nav aria-label="다른 페이지로 이동" className="flex flex-wrap gap-x-6 pt-2">
            <BackLink href="/planner">플래너로 이동</BackLink>
            <ArrowLink href="/help/graduation-guide" className="text-[14px]">
              졸업요건 조회 가이드
            </ArrowLink>
          </nav>
        </div>
      </div>
    </div>
  );
}

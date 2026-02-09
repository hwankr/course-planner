import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '이용약관 | YU 수강 플래너',
  description: 'YU 수강 플래너 서비스 이용약관',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <Link
          href="/"
          className="inline-flex items-center text-[#153974] hover:text-[#1a4a8f] mb-8 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          돌아가기
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[#153974] mb-2">
            이용약관
          </h1>
          <p className="text-gray-500 mb-8">시행일: 2026년 2월 9일</p>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-[#153974] mb-4">
                제1조 (목적)
              </h2>
              <p>
                본 약관은 YU 수강 플래너(이하 "서비스")의 이용과 관련하여
                서비스 운영자와 이용자 간의 권리, 의무 및 책임사항, 서비스
                이용조건 및 절차 등 기본적인 사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#153974] mb-4">
                제2조 (정의)
              </h2>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  "서비스"란 영남대학교 학생들의 학기별 수강 계획 수립 및 졸업
                  요건 추적을 돕기 위해 제공되는 웹 기반 플랫폼을 의미합니다.
                </li>
                <li>
                  "회원"이란 서비스에 접속하여 본 약관에 동의하고 회원가입을
                  완료한 자를 말합니다.
                </li>
                <li>
                  "운영자"란 본 서비스를 개발 및 운영하는 개인(학생
                  프로젝트)을 의미합니다.
                </li>
                <li>
                  "수강 계획"이란 회원이 작성한 학기별 수강 과목 계획 데이터를
                  의미합니다.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#153974] mb-4">
                제3조 (약관의 효력 및 변경)
              </h2>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  본 약관은 서비스를 이용하고자 하는 모든 회원에 대하여 그
                  효력을 발생합니다.
                </li>
                <li>
                  운영자는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서
                  본 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지를
                  통해 공지됩니다.
                </li>
                <li>
                  회원이 변경된 약관에 동의하지 않을 경우, 서비스 이용을
                  중단하고 탈퇴할 수 있습니다.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#153974] mb-4">
                제4조 (서비스의 제공)
              </h2>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  서비스는 다음과 같은 기능을 제공합니다:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>학기별 수강 계획 수립 (드래그앤드롭 기반)</li>
                    <li>졸업 요건 추적 및 진행률 확인</li>
                    <li>학과별 수강 통계 조회</li>
                    <li>다른 사용자의 수강 계획 참고 기능</li>
                    <li>비회원 체험 모드 (데이터 미저장)</li>
                  </ul>
                </li>
                <li>
                  본 서비스는 무료로 제공되며, 현재 수익화 계획이 없습니다.
                </li>
                <li>
                  서비스는 24시간 제공을 원칙으로 하나, 개인 프로젝트의
                  특성상 서버 점검, 기술적 문제 등으로 인해 일시적으로 중단될
                  수 있습니다.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#153974] mb-4">
                제5조 (회원가입 및 계정)
              </h2>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  회원가입은 Google 계정 연동 또는 이메일 기반 계정 생성을
                  통해 가능합니다.
                </li>
                <li>
                  회원은 자신의 계정 정보를 안전하게 관리할 책임이 있으며,
                  타인에게 양도하거나 공유할 수 없습니다.
                </li>
                <li>
                  회원은 언제든지 계정 삭제(탈퇴)를 요청할 수 있으며, 탈퇴 시
                  모든 수강 계획 데이터가 삭제됩니다.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#153974] mb-4">
                제6조 (회원의 의무)
              </h2>
              <p className="mb-2">회원은 다음 행위를 하여서는 안 됩니다:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>타인의 개인정보를 도용하거나 부정하게 사용하는 행위</li>
                <li>서비스의 정상적인 운영을 방해하는 행위</li>
                <li>
                  서비스에서 제공하는 정보를 무단으로 복제, 배포, 상업적으로
                  이용하는 행위
                </li>
                <li>
                  허위 정보를 입력하거나 다른 회원에게 피해를 주는 행위
                </li>
                <li>관련 법령에 위배되는 행위</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#153974] mb-4">
                제7조 (서비스 이용 제한)
              </h2>
              <p>
                운영자는 회원이 본 약관을 위반하거나 서비스의 정상적인 운영을
                방해한 경우, 사전 통보 후 서비스 이용을 제한하거나 계정을
                정지시킬 수 있습니다.
              </p>
            </section>

            <section className="bg-amber-50 border-2 border-amber-300 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-red-700 mb-4">
                제8조 (학사 정보 면책) ⚠️ 중요
              </h2>
              <ol className="list-decimal list-inside space-y-3 ml-4">
                <li className="font-semibold text-gray-900">
                  본 서비스에서 제공하는 학과, 과목, 졸업 요건, 선수과목 등의
                  학사 정보는 참고용으로만 제공되며, 정확한 정보는 반드시
                  영남대학교 소속 학과 또는 학사팀에 직접 확인하시기
                  바랍니다.
                </li>
                <li className="font-semibold text-gray-900">
                  학사 정보는 수동으로 업데이트되며, 대학의 공식 커리큘럼
                  변경사항이 즉시 반영되지 않을 수 있습니다.
                </li>
                <li className="font-semibold text-red-700">
                  본 서비스의 학사 정보 부정확성으로 인해 발생하는 수강 신청
                  오류, 졸업 요건 미충족, 학점 인정 문제 등 모든 불이익에
                  대해 운영자는 어떠한 법적 책임도 지지 않습니다.
                </li>
                <li>
                  회원은 본 서비스를 참고 도구로만 활용하고, 최종 결정은 반드시
                  공식 학사 시스템 및 학과 상담을 통해 확인해야 합니다.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#153974] mb-4">
                제9조 (지적재산권)
              </h2>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  서비스 내 모든 콘텐츠(디자인, 코드, 로고 등)의 저작권은
                  운영자에게 있습니다.
                </li>
                <li>
                  회원이 작성한 수강 계획 데이터의 소유권은 해당 회원에게
                  있으며, 운영자는 서비스 제공 목적으로만 사용합니다.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#153974] mb-4">
                제10조 (서비스 변경 및 중단)
              </h2>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  본 서비스는 개인 학생 프로젝트로 운영되므로, 운영자의 사정에
                  따라 사전 고지 없이 서비스가 변경되거나 중단될 수 있습니다.
                </li>
                <li>
                  서비스 종료 시에는 최소 30일 전 공지를 원칙으로 하나, 불가피한
                  사유가 있을 경우 즉시 중단될 수 있습니다.
                </li>
                <li>
                  서비스 중단 시 회원 데이터 다운로드 기능을 제공하기 위해
                  노력하나, 이를 보장하지는 않습니다.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#153974] mb-4">
                제11조 (면책 조항)
              </h2>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  본 서비스는 영남대학교와 무관한 개인 학생 프로젝트이며, 대학의
                  공식 서비스가 아닙니다.
                </li>
                <li>
                  운영자는 천재지변, 서버 장애, 기타 불가항력적 사유로 인한
                  서비스 중단에 대해 책임을 지지 않습니다.
                </li>
                <li>
                  회원이 서비스를 이용하며 얻은 정보의 정확성, 신뢰성, 유용성에
                  대해 운영자는 어떠한 보증도 하지 않습니다.
                </li>
                <li>
                  회원 간의 분쟁, 회원과 제3자 간의 분쟁에 대해 운영자는
                  개입하지 않으며 책임을 지지 않습니다.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#153974] mb-4">
                제12조 (분쟁 해결)
              </h2>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  서비스 이용과 관련한 분쟁은 운영자와 회원 간의 상호 협의를
                  통해 해결함을 원칙으로 합니다.
                </li>
                <li>
                  협의가 이루어지지 않을 경우, 대한민국 법령에 따라 관할
                  법원에서 해결합니다.
                </li>
              </ol>
            </section>

            <section className="border-t-2 border-gray-200 pt-6">
              <h2 className="text-2xl font-bold text-[#153974] mb-4">부칙</h2>
              <p>본 약관은 2026년 2월 9일부터 시행됩니다.</p>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>문의:</strong> fabronjeon@gmail.com
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>운영자:</strong> 개인 프로젝트 (영남대학교 학생)
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

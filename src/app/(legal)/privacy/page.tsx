import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침 | YU 수강 플래너',
  description: 'YU 수강 플래너 개인정보처리방침',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <Link
          href="/"
          className="inline-flex items-center text-[#153974] hover:underline mb-8"
        >
          ← 홈으로 돌아가기
        </Link>

        <h1 className="text-3xl font-bold text-[#153974] mb-2">
          개인정보처리방침
        </h1>
        <p className="text-gray-600 mb-8">시행일자: 2026년 2월 9일</p>

        <div className="prose prose-sm max-w-none space-y-8">
          {/* 서비스 소개 */}
          <section>
            <p className="text-gray-700 leading-relaxed">
              YU 수강 플래너(이하 {'"'}본 서비스{'"'})는 영남대학교 학생들의 수강 계획 수립을 돕기 위한 개인 프로젝트입니다.
              본 서비스는 영남대학교의 공식 서비스가 아니며, 학생이 개인적으로 운영하는 서비스입니다.
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              본 서비스는 개인정보보호법 제30조에 따라 이용자의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리하기 위하여 다음과 같이 개인정보처리방침을 수립·공개합니다.
            </p>
          </section>

          {/* 1. 개인정보의 처리 목적 */}
          <section>
            <h2 className="text-xl font-semibold text-[#153974] mb-3">
              1. 개인정보의 처리 목적
            </h2>
            <p className="text-gray-700 mb-2">본 서비스는 다음의 목적을 위하여 개인정보를 처리합니다.</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>회원 가입 및 관리: 회원 식별, 서비스 부정이용 방지</li>
              <li>수강 계획 서비스 제공: 학기별 수강 과목 배치 및 졸업 요건 추적</li>
              <li>학과 및 전공 정보 기반 맞춤형 서비스 제공</li>
              <li>서비스 개선 및 통계 분석</li>
            </ul>
          </section>

          {/* 2. 수집하는 개인정보 항목 및 수집 방법 */}
          <section>
            <h2 className="text-xl font-semibold text-[#153974] mb-3">
              2. 수집하는 개인정보 항목 및 수집 방법
            </h2>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">2.1 수집 항목</h3>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">필수 수집 항목</h4>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>이메일 주소</li>
                <li>이름</li>
                <li>비밀번호 (bcryptjs 알고리즘으로 암호화하여 저장)</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">선택 수집 항목</h4>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>학과 정보</li>
                <li>입학년도</li>
                <li>전공 유형 (단일전공, 복수전공, 부전공)</li>
                <li>복수전공 학과 (복수전공 선택 시)</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">자동 수집 항목</h4>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Google 프로필 이미지 (Google OAuth 로그인 시)</li>
                <li>계정 생성 일시</li>
                <li>계정 최종 수정 일시</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">서비스 이용 데이터</h4>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>수강 계획 데이터 (학기별 과목 배치 정보)</li>
              </ul>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">2.2 수집 방법</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>회원가입 및 서비스 이용 과정에서 이용자가 직접 입력</li>
              <li>Google OAuth 2.0 소셜 로그인 과정에서 Google로부터 제공받음</li>
            </ul>
          </section>

          {/* 3. 개인정보의 처리 및 보유 기간 */}
          <section>
            <h2 className="text-xl font-semibold text-[#153974] mb-3">
              3. 개인정보의 처리 및 보유 기간
            </h2>
            <p className="text-gray-700 mb-2">
              본 서비스는 회원 탈퇴 시까지 개인정보를 보유 및 이용합니다. 단, 다음의 정보는 관계 법령에 따라 명시한 기간 동안 보존합니다.
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>회원 탈퇴 시: 모든 개인정보 즉시 파기</li>
              <li>부정 이용 기록: 1년 (서비스 부정이용 방지 목적)</li>
            </ul>
          </section>

          {/* 4. 개인정보의 제3자 제공 */}
          <section>
            <h2 className="text-xl font-semibold text-[#153974] mb-3">
              4. 개인정보의 제3자 제공
            </h2>
            <p className="text-gray-700">
              본 서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
              다만, 아래의 경우는 예외로 합니다.
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1 mt-2">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </section>

          {/* 5. 개인정보 처리의 위탁 */}
          <section>
            <h2 className="text-xl font-semibold text-[#153974] mb-3">
              5. 개인정보 처리의 위탁
            </h2>
            <p className="text-gray-700 mb-3">
              본 서비스는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 외부 전문업체에 위탁하고 있습니다.
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left">수탁업체</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">위탁 업무 내용</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Google LLC</td>
                    <td className="border border-gray-300 px-4 py-2">소셜 로그인 인증 서비스 (OAuth 2.0)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">MongoDB Inc. (MongoDB Atlas)</td>
                    <td className="border border-gray-300 px-4 py-2">데이터베이스 호스팅 및 관리</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Vercel Inc.</td>
                    <td className="border border-gray-300 px-4 py-2">웹 서비스 호스팅 및 배포</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-gray-700 mt-3">
              본 서비스는 위탁 계약 체결 시 개인정보보호법에 따라 위탁업무 수행 목적 외 개인정보 처리 금지,
              기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을
              계약서 등 문서에 명시하고 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.
            </p>
          </section>

          {/* 6. 정보주체의 권리·의무 및 행사 방법 */}
          <section>
            <h2 className="text-xl font-semibold text-[#153974] mb-3">
              6. 정보주체의 권리·의무 및 행사 방법
            </h2>
            <p className="text-gray-700 mb-2">
              이용자는 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>개인정보 열람 요구</li>
              <li>개인정보 정정 요구 (프로필 페이지에서 직접 수정 가능)</li>
              <li>개인정보 삭제 요구 (회원 탈퇴를 통해 가능)</li>
              <li>개인정보 처리 정지 요구</li>
            </ul>
            <p className="text-gray-700 mt-3">
              권리 행사는 서비스 내 프로필 페이지에서 직접 수행하거나,
              개인정보 보호책임자에게 이메일(fabronjeon@gmail.com)로 요청하실 수 있습니다.
            </p>
          </section>

          {/* 7. 개인정보의 파기 절차 및 방법 */}
          <section>
            <h2 className="text-xl font-semibold text-[#153974] mb-3">
              7. 개인정보의 파기 절차 및 방법
            </h2>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">7.1 파기 절차</h3>
            <p className="text-gray-700">
              이용자의 개인정보는 목적이 달성된 후 내부 방침 및 관련 법령에 따라 일정 기간 저장된 후 파기됩니다.
              파기 사유가 발생한 개인정보는 지체 없이 파기합니다.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">7.2 파기 방법</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>전자적 파일: 복구 불가능한 방법으로 영구 삭제</li>
              <li>데이터베이스 레코드: MongoDB의 deleteOne/deleteMany 메서드를 통한 영구 삭제</li>
            </ul>
          </section>

          {/* 8. 개인정보의 안전성 확보 조치 */}
          <section>
            <h2 className="text-xl font-semibold text-[#153974] mb-3">
              8. 개인정보의 안전성 확보 조치
            </h2>
            <p className="text-gray-700 mb-2">
              본 서비스는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적·관리적 조치를 하고 있습니다.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">8.1 기술적 조치</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>비밀번호 암호화: bcryptjs 알고리즘을 사용한 단방향 해시 암호화</li>
              <li>HTTPS 통신: SSL/TLS 암호화를 통한 안전한 데이터 전송</li>
              <li>JWT 기반 세션 관리: 30일 유효기간 설정</li>
              <li>환경변수 분리: 민감한 설정 정보의 코드 분리 관리</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">8.2 관리적 조치</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>개인정보 처리 직원의 최소화 (개인 운영자 1인)</li>
              <li>정기적인 보안 업데이트 및 패치</li>
            </ul>
          </section>

          {/* 9. 쿠키의 사용 */}
          <section>
            <h2 className="text-xl font-semibold text-[#153974] mb-3">
              9. 쿠키의 사용
            </h2>
            <p className="text-gray-700 mb-2">
              본 서비스는 이용자에게 개별적인 맞춤 서비스를 제공하기 위해 쿠키를 사용합니다.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">9.1 쿠키의 목적</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>로그인 세션 유지 (JWT 토큰 저장)</li>
              <li>사용자 인증 상태 관리</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">9.2 사용하는 쿠키</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>
                <code className="bg-gray-100 px-1 py-0.5 rounded">next-auth.session-token</code>:
                NextAuth.js 세션 쿠키 (httpOnly, secure, 30일 유효)
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">9.3 쿠키 거부 방법</h3>
            <p className="text-gray-700">
              이용자는 웹 브라우저의 설정을 통해 쿠키 저장을 거부할 수 있습니다.
              단, 쿠키 저장을 거부할 경우 로그인이 필요한 서비스 이용에 어려움이 있을 수 있습니다.
            </p>
          </section>

          {/* 10. 개인정보 보호책임자 */}
          <section>
            <h2 className="text-xl font-semibold text-[#153974] mb-3">
              10. 개인정보 보호책임자
            </h2>
            <p className="text-gray-700 mb-3">
              본 서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고,
              개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <p className="font-semibold text-gray-800 mb-2">개인정보 보호책임자</p>
              <ul className="text-gray-700 space-y-1">
                <li>담당자: 전상범 (서비스 운영자)</li>
                <li>이메일: fabronjeon@gmail.com</li>
              </ul>
            </div>

            <p className="text-gray-700 mt-3">
              정보주체는 본 서비스를 이용하면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을
              개인정보 보호책임자에게 문의하실 수 있습니다. 본 서비스는 정보주체의 문의에 대해 지체 없이 답변 및 처리해드릴 것입니다.
            </p>
          </section>

          {/* 11. 개인정보처리방침 변경 */}
          <section>
            <h2 className="text-xl font-semibold text-[#153974] mb-3">
              11. 개인정보처리방침 변경
            </h2>
            <p className="text-gray-700">
              이 개인정보처리방침은 2026년 2월 9일부터 적용되며,
              법령 및 방침에 따른 변경 내용의 추가, 삭제 및 정정이 있는 경우에는
              변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
            </p>
          </section>

          {/* 부칙 */}
          <section className="border-t pt-6 mt-8">
            <h2 className="text-xl font-semibold text-[#153974] mb-3">부칙</h2>
            <p className="text-gray-700">
              본 개인정보처리방침은 2026년 2월 9일부터 시행됩니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

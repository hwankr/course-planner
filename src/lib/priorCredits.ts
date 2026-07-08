/**
 * 기이수(prior earned) 학점 공용 헬퍼
 *
 * 기이수 학점은 성적표의 스칼라 값(총/교양/전공/핵심 …)으로 입력받아
 * 계획(Plan) 과목 합산값에 트랙별로 더해진다. 이때 필드 간 수학적 불변식이 성립해야
 * 위젯의 총 학점 바와 트랙 바가 모순되지 않는다:
 *
 * - 총 기이수 >= 교양 + 전공 (+ 복수전공/부전공)
 * - 전공핵심 기이수 <= 전공 기이수 (핵심은 전공의 부분집합)
 *
 * 순수 함수만 포함. API 분리 시 백엔드와 프론트 양쪽에서 공유(복사)한다.
 */

export interface PriorCreditFields {
  majorType?: string;
  earnedTotalCredits?: number;
  earnedGeneralCredits?: number;
  earnedPrimaryMajorCredits?: number;
  earnedPrimaryMajorRequiredCredits?: number;
  earnedSecondaryMajorCredits?: number;
  earnedSecondaryMajorRequiredCredits?: number;
  earnedMinorCredits?: number;
  earnedMinorRequiredCredits?: number;
}

const TERM_ORDER: Record<string, number> = { spring: 1, fall: 2 };

/**
 * 해당 학기가 "기이수 반영 기준 학기" 이전(포함)인지 판정.
 * 기준 학기까지의 계획 내 '이수' 과목은 성적표(기이수)에 이미 포함된 것이므로
 * 학점 합산에서 제외해 중복 계산을 막는다. 기준이 없으면 항상 false (기존 동작).
 */
export function isSemesterCoveredByPrior(
  semesterYear: number,
  semesterTerm: string,
  cutoffYear?: number | null,
  cutoffTerm?: string | null
): boolean {
  if (!cutoffYear || !cutoffTerm) return false;
  if (semesterYear !== cutoffYear) return semesterYear < cutoffYear;
  return (TERM_ORDER[semesterTerm] ?? 0) <= (TERM_ORDER[cutoffTerm] ?? 0);
}

export type PriorCreditErrorField =
  | 'earnedTotalCredits'
  | 'earnedPrimaryMajorRequiredCredits'
  | 'earnedSecondaryMajorRequiredCredits'
  | 'earnedMinorRequiredCredits';

/** majorType에 포함되는 트랙별 기이수 합계. 총 기이수의 수학적 하한. */
export function priorTrackSum(input: PriorCreditFields): number {
  const general = input.earnedGeneralCredits || 0;
  const primary = input.earnedPrimaryMajorCredits || 0;
  const secondary = input.majorType === 'double' ? input.earnedSecondaryMajorCredits || 0 : 0;
  const minor = input.majorType === 'minor' ? input.earnedMinorCredits || 0 : 0;
  return general + primary + secondary + minor;
}

/**
 * 총 기이수 학점의 유효값.
 * 저장된 총 기이수가 트랙 합계보다 작으면(트랙만 입력하고 총을 비워둔 과거 데이터 등)
 * 트랙 합계로 보정해 총 바 < 트랙 바 합 이라는 불가능한 표시를 막는다.
 */
export function effectivePriorTotal(input: PriorCreditFields): number {
  return Math.max(input.earnedTotalCredits || 0, priorTrackSum(input));
}

/** 트랙 합계 표시용 라벨 (검증 메시지에 사용) */
function trackSumLabel(majorType?: string): string {
  if (majorType === 'double') return '전공+복수전공+교양';
  if (majorType === 'minor') return '전공+부전공+교양';
  return '전공+교양';
}

/**
 * 기이수 필드 간 정합성 검증.
 * 위반한 필드별 사용자용 메시지를 반환한다 (문제 없으면 빈 객체).
 */
export function validatePriorCredits(
  input: PriorCreditFields
): Partial<Record<PriorCreditErrorField, string>> {
  const errors: Partial<Record<PriorCreditErrorField, string>> = {};

  if ((input.earnedPrimaryMajorRequiredCredits || 0) > (input.earnedPrimaryMajorCredits || 0)) {
    errors.earnedPrimaryMajorRequiredCredits = '기이수 전공핵심은 기이수 전공 학점 이하여야 합니다';
  }
  if (
    input.majorType === 'double' &&
    (input.earnedSecondaryMajorRequiredCredits || 0) > (input.earnedSecondaryMajorCredits || 0)
  ) {
    errors.earnedSecondaryMajorRequiredCredits = '기이수 복수전공핵심은 기이수 복수전공 학점 이하여야 합니다';
  }
  if (
    input.majorType === 'minor' &&
    (input.earnedMinorRequiredCredits || 0) > (input.earnedMinorCredits || 0)
  ) {
    errors.earnedMinorRequiredCredits = '기이수 부전공핵심은 기이수 부전공 학점 이하여야 합니다';
  }

  const trackSum = priorTrackSum(input);
  if ((input.earnedTotalCredits || 0) < trackSum) {
    errors.earnedTotalCredits = `기이수 졸업학점은 ${trackSumLabel(input.majorType)} 합계(${trackSum}학점) 이상이어야 합니다`;
  }

  return errors;
}

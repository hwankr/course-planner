/**
 * Korean Public Holidays Utility
 * @api-separable
 * @migration-notes 분리 시 백엔드로 이동
 */

export interface KoreanHoliday {
  name: string;
  date: string; // YYYY-MM-DD
}

/**
 * 음력 기반 공휴일 (설날, 추석, 부처님오신날) - 연도별 양력 날짜
 * 음력→양력 변환은 복잡하므로 2024-2028년 미리 계산된 값 사용
 */
const LUNAR_HOLIDAYS: Record<number, { seollal: string[]; chuseok: string[]; buddha: string }> = {
  2024: {
    seollal: ['2024-02-09', '2024-02-10', '2024-02-11'],
    chuseok: ['2024-09-16', '2024-09-17', '2024-09-18'],
    buddha: '2024-05-15',
  },
  2025: {
    seollal: ['2025-01-28', '2025-01-29', '2025-01-30'],
    chuseok: ['2025-10-05', '2025-10-06', '2025-10-07'],
    buddha: '2025-05-05',
  },
  2026: {
    seollal: ['2026-02-16', '2026-02-17', '2026-02-18'],
    chuseok: ['2026-09-24', '2026-09-25', '2026-09-26'],
    buddha: '2026-05-24',
  },
  2027: {
    seollal: ['2027-02-05', '2027-02-06', '2027-02-07'],
    chuseok: ['2027-09-14', '2027-09-15', '2027-09-16'],
    buddha: '2027-05-13',
  },
  2028: {
    seollal: ['2028-01-25', '2028-01-26', '2028-01-27'],
    chuseok: ['2028-10-02', '2028-10-03', '2028-10-04'],
    buddha: '2028-06-01',
  },
};

/**
 * 대체공휴일 - 공휴일이 주말/다른 공휴일과 겹칠 때 지정
 * 연도별 미리 계산된 값
 */
const SUBSTITUTE_HOLIDAYS: Record<number, KoreanHoliday[]> = {
  2024: [
    { name: '설날 대체공휴일', date: '2024-02-12' },
    { name: '어린이날 대체공휴일', date: '2024-05-06' },
  ],
  2025: [
    { name: '삼일절 대체공휴일', date: '2025-03-03' },
    { name: '부처님오신날 대체공휴일', date: '2025-05-06' },
    { name: '추석 대체공휴일', date: '2025-10-08' },
  ],
  2026: [
    { name: '삼일절 대체공휴일', date: '2026-03-02' },
    { name: '부처님오신날 대체공휴일', date: '2026-05-25' },
    { name: '현충일 대체공휴일', date: '2026-06-08' },
    { name: '광복절 대체공휴일', date: '2026-08-17' },
    { name: '추석 대체공휴일', date: '2026-09-28' },
    { name: '개천절 대체공휴일', date: '2026-10-05' },
  ],
  2027: [
    { name: '설날 대체공휴일', date: '2027-02-08' },
    { name: '현충일 대체공휴일', date: '2027-06-07' },
    { name: '광복절 대체공휴일', date: '2027-08-16' },
    { name: '개천절 대체공휴일', date: '2027-10-04' },
    { name: '한글날 대체공휴일', date: '2027-10-11' },
    { name: '크리스마스 대체공휴일', date: '2027-12-27' },
  ],
  2028: [
    { name: '삼일절 대체공휴일', date: '2028-03-02' },
    { name: '개천절 대체공휴일', date: '2028-10-04' },
    { name: '한글날 대체공휴일', date: '2028-10-10' },
    { name: '크리스마스 대체공휴일', date: '2028-12-26' },
  ],
};

/**
 * 양력 고정 공휴일
 */
function getFixedHolidays(year: number): KoreanHoliday[] {
  return [
    { name: '신정', date: `${year}-01-01` },
    { name: '삼일절', date: `${year}-03-01` },
    { name: '어린이날', date: `${year}-05-05` },
    { name: '현충일', date: `${year}-06-06` },
    { name: '광복절', date: `${year}-08-15` },
    { name: '개천절', date: `${year}-10-03` },
    { name: '한글날', date: `${year}-10-09` },
    { name: '크리스마스', date: `${year}-12-25` },
  ];
}

/**
 * 해당 연도의 한국 공휴일 목록 반환 (대체공휴일 포함)
 */
export function getKoreanHolidays(year: number): KoreanHoliday[] {
  const holidays: KoreanHoliday[] = getFixedHolidays(year);

  const lunar = LUNAR_HOLIDAYS[year];
  if (lunar) {
    for (const date of lunar.seollal) {
      holidays.push({ name: '설날', date });
    }
    for (const date of lunar.chuseok) {
      holidays.push({ name: '추석', date });
    }
    holidays.push({ name: '부처님오신날', date: lunar.buddha });
  }

  // 대체공휴일 추가
  const substitutes = SUBSTITUTE_HOLIDAYS[year];
  if (substitutes) {
    holidays.push(...substitutes);
  }

  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 특정 월의 공휴일만 필터링
 */
export function getKoreanHolidaysForMonth(year: number, month: number): KoreanHoliday[] {
  const monthStr = String(month).padStart(2, '0');
  const prefix = `${year}-${monthStr}`;
  return getKoreanHolidays(year).filter((h) => h.date.startsWith(prefix));
}

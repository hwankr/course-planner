/** 2026.10.12 형식 (업데이트 소식 날짜) */
export function formatPatchNoteDate(dateStr: string) {
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}.${month}.${day}`;
}

/** 본문을 줄 단위 항목으로 나눈다. 줄머리의 -, *, •, · 표식은 목록 불릿으로 대체한다. */
export function toPatchNoteItems(content: string) {
  return content
    .split('\n')
    .map((line) => line.trim().replace(/^[-*•·]\s+/, ''))
    .filter(Boolean);
}

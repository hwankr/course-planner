/**
 * CalendarGrid — documentation-only types for the academic calendar PATTERN in
 * src/app/(dashboard)/calendar/page.tsx. No component exists in the source: the page builds the
 * header, filter chips, month grid, detail Card, month list and form modal inline from these shapes.
 */
import type { AcademicEventCategory, CreateAcademicEventInput } from '@/types';

export type { AcademicEventCategory, CreateAcademicEventInput };

/** Unified display row for DB events and generated Korean holidays (page.tsx `interface CalendarEvent`). */
export interface CalendarEvent {
  /** Mongo id as a string, or `holiday-${startDate}-${i}` for a generated holiday. */
  _id: string;
  /** Chip, row and detail title text. */
  title: string;
  /** Rendered `text-sm text-gray-700` in the detail Card when present. */
  description?: string;
  /** ISO string; the grid keys cells by its local YYYY-MM-DD. */
  startDate: string;
  /** ISO string; absent = single-day. More than 7 days after startDate = "long" (italic, start/end cells only). */
  endDate?: string;
  /** Picks the color pair from `categoryColors` and the label from `categoryLabels`. */
  category: AcademicEventCategory;
  /** Custom hex stored in the DB; carried in the shape but never applied by the page. */
  color?: string;
  /** Adds the `🔴 ` prefix in chips and rows and the `🔴 공휴일` line in the detail Card. */
  isHoliday: boolean;
  /** true for auto-generated Korean holidays: not editable and left out of 이번 달 일정. */
  isSystemHoliday?: boolean;
}

/** Controlled state of the create/edit modal (page.tsx `interface EventFormData`). */
export interface EventFormData {
  /** Required; `제목과 시작일은 필수입니다.` toast when empty. */
  title: string;
  /** Optional; trimmed, empty → undefined on submit. */
  description: string;
  /** YYYY-MM-DD from <input type="date">; required. */
  startDate: string;
  /** YYYY-MM-DD; `min` is startDate; empty → undefined on submit. */
  endDate: string;
  /** Default 'academic'. */
  category: AcademicEventCategory;
  /** The 공휴일로 표시 checkbox; default false. */
  isHoliday: boolean;
}

/** Value of the filter chip row: 전체 or one category. */
export type CalendarCategoryFilter = AcademicEventCategory | 'all';

/** Visual state of one day cell. */
export type CalendarDayState = 'default' | 'today' | 'selected' | 'today-selected';

/** Korean label per category: 학사 · 수강신청 · 시험 · 공휴일 · 기타. */
export type CategoryLabels = Record<AcademicEventCategory, '학사' | '수강신청' | '시험' | '공휴일' | '기타'>;

/** Tailwind class string per category, e.g. 'bg-blue-100 text-blue-700 border-blue-200'. */
export type CategoryColors = Record<AcademicEventCategory, string>;

/** What the page computes and hands to its inline markup, listed as if it were props. */
export interface CalendarGridProps {
  /** First day of the displayed month; renders `{month + 1}월` and `{year}년`. */
  currentDate: Date;
  /** `new Date()` at render; marks the today cell. */
  today: Date;
  /** Toggled by clicking a cell; drives the amber selected state and the mobile day panel. Default null. */
  selectedDate: Date | null;
  /** Event clicked in a chip or row; renders the border-l-4 detail Card. Default null. */
  selectedEvent: CalendarEvent | null;
  /** Active filter chip. Default 'all'. */
  selectedCategory: CalendarCategoryFilter;
  /** Local YYYY-MM-DD → events on that day (long events only on their start and end day). */
  eventsByDate: Map<string, CalendarEvent[]>;
  /** Leading nulls for the empty cells before day 1, then one Date per day of the month. */
  calendarDays: (Date | null)[];
  /** Non-system events of the month sorted by startDate; feeds 이번 달 일정. */
  sortedEvents: CalendarEvent[];
  /** From useAuth(); shows 일정 추가 and edit/delete, makes a cell click open the prefilled form (any width) and adds md:cursor-pointer. */
  isAdmin: boolean;
  /** TanStack isLoading; swaps the grid for 35 pulsing cells and the list for five h-16 rows. */
  isLoading: boolean;
  /** Modal visibility. */
  showEventForm: boolean;
  /** Event being edited, or null for 일정 추가. */
  editingEvent: CalendarEvent | null;
  /** Controlled form values. */
  formData: EventFormData;
  /** create or update mutation pending; disables submit and shows 저장 중... */
  isSaving: boolean;
  /** Prev/next chevron; also clears selectedEvent and selectedDate. */
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  /** 오늘 button; jumps to the current month and clears both selections. */
  onGoToToday: () => void;
  /** Filter chip click. */
  onSelectCategory: (category: CalendarCategoryFilter) => void;
  /** Day cell click; toggles selectedDate, and for admins opens the form prefilled with that date. */
  onDateClick: (date: Date) => void;
  /** Chip or row click; sets selectedEvent (stopPropagation on chips). */
  onEventClick: (event: CalendarEvent) => void;
  /** 일정 추가; opens the empty form. */
  onCreateEvent: () => void;
  /** Pencil; ignored for system holidays. */
  onEditEvent: (event: CalendarEvent) => void;
  /** Trash2; native confirm('이 일정을 삭제하시겠습니까?') then the delete mutation. */
  onDeleteEvent: (id: string) => Promise<void>;
  /** Form submit; validates title and startDate, then create or update. */
  onSubmitEvent: (e: React.FormEvent) => Promise<void>;
  /** Modal X and 취소; setShowEventForm(false). */
  onCloseForm: () => void;
  /** Detail Card X; setSelectedEvent(null). */
  onCloseDetail: () => void;
  /** Mobile day panel X; setSelectedDate(null). */
  onClearSelectedDate: () => void;
  /** Every form field's onChange; setFormData({ ...formData, [field]: value }). */
  onFormChange: (data: EventFormData) => void;
}

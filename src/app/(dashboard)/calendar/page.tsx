'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  useAcademicEvents,
  useCreateAcademicEvent,
  useUpdateAcademicEvent,
  useDeleteAcademicEvent,
} from '@/hooks/useAcademicEvents';
import { useToastStore } from '@/stores/toastStore';
import { Button, PageHeader } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import type { AcademicEventCategory, CreateAcademicEventInput } from '@/types';
import { EventFormDialog, type EventFormData } from './_components/EventFormDialog';

// Unified display type for both DB events and holidays
interface CalendarEvent {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  category: AcademicEventCategory;
  color?: string;
  isHoliday: boolean;
  isSystemHoliday?: boolean; // true for auto-generated Korean holidays
}

interface CalendarCell {
  date: Date;
  inMonth: boolean;
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

// Helper functions
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

/** "10.05" 형식 (디자인: 월은 그대로, 일은 두 자리) */
const formatShortDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`;
};

const formatDateRange = (startDate: string, endDate?: string) => {
  if (!endDate) return formatShortDate(startDate);
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start.toDateString() === end.toDateString()) return formatShortDate(start);
  return `${formatShortDate(start)} – ${formatShortDate(end)}`;
};

/** 로컬 타임존 기준 YYYY-MM-DD 키 반환 (toISOString은 UTC라 KST에서 하루 밀림 방지) */
const toDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isSameDay = (date1: Date, date2: Date) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/** 날짜가 일정의 [시작, 종료] 구간 안에 있는지 (장기 일정의 중간 날짜 포함) */
const isEventOnDate = (event: CalendarEvent, date: Date) => {
  const key = toDateKey(date);
  const startKey = toDateKey(new Date(event.startDate));
  const endKey = event.endDate ? toDateKey(new Date(event.endDate)) : startKey;
  return startKey <= key && key <= endKey;
};

const getDiffDays = (event: CalendarEvent) => {
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : start;
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

/** 보고 있는 달이 속한 학기 (3–8월 1학기, 9–2월 2학기) */
const getSemesterLabel = (year: number, month: number) => {
  const m = month + 1;
  if (m >= 3 && m <= 8) return `${year}학년도 1학기`;
  if (m >= 9) return `${year}학년도 2학기`;
  return `${year - 1}학년도 2학기`;
};

const categoryLabels: Record<AcademicEventCategory, string> = {
  academic: '학사',
  registration: '수강신청',
  exam: '시험',
  holiday: '공휴일',
  other: '기타',
};

// 분류는 6px 점으로만 구분한다 (.design-ref/Calendar)
const categoryDotClass: Record<AcademicEventCategory, string> = {
  academic: 'bg-primary',
  registration: 'bg-[#E07B1F]',
  exam: 'bg-[#7C5CD6]',
  holiday: 'bg-negative',
  other: 'bg-placeholder',
};

function EventDot({ category }: { category: AcademicEventCategory }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block h-1.5 w-1.5 shrink-0 rounded-full', categoryDotClass[category])}
    />
  );
}

const EMPTY_FORM: EventFormData = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  category: 'academic',
  isHoliday: false,
};

export default function CalendarPage() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AcademicEventCategory | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate())
  );
  const [formData, setFormData] = useState<EventFormData>(EMPTY_FORM);

  const { isAdmin } = useAuth();
  const addToast = useToastStore((state) => state.addToast);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { data, isLoading, isError, isFetching, refetch } = useAcademicEvents(year, month + 1);
  const createMutation = useCreateAcademicEvent();
  const updateMutation = useUpdateAcademicEvent();
  const deleteMutation = useDeleteAcademicEvent();

  const allEvents = useMemo((): CalendarEvent[] => {
    if (!data) return [];

    const dbEvents: CalendarEvent[] = data.events.map((e) => ({
      _id: String(e._id),
      title: e.title,
      description: e.description,
      startDate: typeof e.startDate === 'string' ? e.startDate : new Date(e.startDate).toISOString(),
      endDate: e.endDate ? (typeof e.endDate === 'string' ? e.endDate : new Date(e.endDate).toISOString()) : undefined,
      category: e.category,
      color: e.color,
      isHoliday: e.isHoliday,
    }));

    const holidayEvents: CalendarEvent[] = data.holidays.map((h, i) => ({
      _id: `holiday-${h.startDate}-${i}`,
      title: h.title,
      startDate: h.startDate,
      category: 'holiday',
      isHoliday: true,
      isSystemHoliday: true,
    }));

    const combined = [...dbEvents, ...holidayEvents];
    if (selectedCategory === 'all') return combined;
    return combined.filter((e) => e.category === selectedCategory);
  }, [data, selectedCategory]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    const addToDate = (key: string, event: CalendarEvent) => {
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    };

    allEvents.forEach((event) => {
      const start = new Date(event.startDate);
      const end = event.endDate ? new Date(event.endDate) : start;
      const diffDays = getDiffDays(event);

      if (diffDays > 7) {
        // 장기 일정(7일 초과): 시작일과 종료일에만 표시
        addToDate(toDateKey(start), event);
        if (diffDays > 0) {
          addToDate(toDateKey(end), event);
        }
      } else {
        // 단기 일정(7일 이하): 모든 날짜에 표시
        const current = new Date(start);
        while (current <= end) {
          addToDate(toDateKey(current), event);
          current.setDate(current.getDate() + 1);
        }
      }
    });
    return map;
  }, [allEvents]);

  // 앞뒤 달의 날짜로 주를 채운다 (흐린 숫자)
  const calendarCells = useMemo((): CalendarCell[] => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const rows = Math.ceil((firstDay + daysInMonth) / 7);
    const cells: CalendarCell[] = [];

    for (let i = 0; i < rows * 7; i++) {
      const date = new Date(year, month, i - firstDay + 1);
      cells.push({ date, inMonth: date.getMonth() === month });
    }

    return cells;
  }, [year, month]);

  // 이번 달 목록은 시스템 공휴일도 포함한다 (수정·삭제는 선택일 목록에서 계속 막힘)
  const sortedEvents = useMemo(() => {
    return [...allEvents]
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [allEvents]);

  // 달력 칸은 장기 일정을 시작·종료일에만 그리지만, 선택한 날 목록은 구간 안의 모든 일정을 보여준다
  const getEventsOnDate = (date: Date) => allEvents.filter((e) => isEventOnDate(e, date));
  const selectedDayEvents = selectedDate ? getEventsOnDate(selectedDate) : [];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
    setSelectedEventId(null);
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedEventId(null);
    setSelectedDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  const handleAddOnDate = (date: Date) => {
    if (!isAdmin) return;
    setFormData({ ...EMPTY_FORM, startDate: toDateKey(date) });
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const clearSelectedDate = () => {
    setSelectedDate(null);
    setSelectedEventId(null);
  };

  const handleCellClick = ({ date, inMonth }: CalendarCell) => {
    // 일반 사용자: 선택된 날짜를 다시 누르면 선택 해제
    if (!isAdmin && selectedDate && isSameDay(date, selectedDate)) {
      clearSelectedDate();
      return;
    }
    if (!inMonth) {
      setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
    }
    setSelectedEventId(null);
    setSelectedDate(date);
    // 관리자: 일정 유무와 무관하게 그 날짜로 추가 폼을 바로 연다
    if (isAdmin) {
      handleAddOnDate(date);
    }
  };

  const handleCellEventClick = (date: Date, event: CalendarEvent) => {
    setSelectedDate(date);
    setSelectedEventId(event._id);
  };

  const handleMonthEventClick = (event: CalendarEvent) => {
    const start = new Date(event.startDate);
    const monthStart = new Date(year, month, 1);
    const day = start < monthStart ? monthStart : start;
    setSelectedDate(new Date(day.getFullYear(), day.getMonth(), day.getDate()));
    setSelectedEventId(event._id);
  };

  const handleCreateEvent = () => {
    setFormData(EMPTY_FORM);
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    if (event.isSystemHoliday) return; // 시스템 공휴일은 수정 불가
    setFormData({
      title: event.title,
      description: event.description || '',
      startDate: event.startDate.split('T')[0],
      endDate: event.endDate ? event.endDate.split('T')[0] : '',
      category: event.category,
      isHoliday: event.isHoliday || false,
    });
    setEditingEvent(event);
    setShowEventForm(true);
    setSelectedEventId(null);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      addToast({ type: 'success', message: '일정이 삭제되었습니다.' });
      setSelectedEventId(null);
    } catch {
      addToast({ type: 'warning', message: '일정 삭제에 실패했습니다.' });
    }
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.startDate) {
      addToast({ type: 'warning', message: '제목과 시작일은 필수입니다.' });
      return;
    }

    const input: CreateAcademicEventInput = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      category: formData.category,
      isHoliday: formData.isHoliday,
    };

    try {
      if (editingEvent) {
        await updateMutation.mutateAsync({ id: editingEvent._id, data: input });
        addToast({ type: 'success', message: '일정이 수정되었습니다.' });
      } else {
        await createMutation.mutateAsync(input);
        addToast({ type: 'success', message: '일정이 추가되었습니다.' });
      }
      setShowEventForm(false);
    } catch {
      addToast({ type: 'warning', message: '일정 저장에 실패했습니다.' });
    }
  };

  const toggleCategory = (cat: AcademicEventCategory) => {
    setSelectedCategory((prev) => (prev === cat ? 'all' : cat));
  };

  return (
    <div>
      <PageHeader
        title="학사 일정"
        description={`${getSemesterLabel(year, month)} · 날짜를 누르면 그날의 일정을 볼 수 있어요`}
        actions={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {/* 범례 겸 분류 필터: '전체' 또는 분류를 누르면 해당 분류만, 다시 누르면 전체 */}
            <div role="group" aria-label="분류 필터" className="flex flex-wrap items-center gap-x-4">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                aria-pressed={selectedCategory === 'all'}
                className={cn(
                  'inline-flex h-11 items-center text-[13px] transition-colors duration-150 ease-out',
                  selectedCategory === 'all' ? 'font-semibold text-ink' : 'font-medium text-ink-2 hover:text-ink'
                )}
              >
                전체
              </button>
              {(Object.keys(categoryLabels) as AcademicEventCategory[]).map((cat) => {
                const active = selectedCategory === cat;
                const dimmed = selectedCategory !== 'all' && !active;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    aria-pressed={active}
                    className={cn(
                      'inline-flex h-11 items-center gap-1.5 text-[13px] transition-colors duration-150 ease-out',
                      active ? 'font-semibold text-ink' : 'font-medium text-ink-2 hover:text-ink',
                      dimmed && 'opacity-50 hover:opacity-100'
                    )}
                  >
                    <EventDot category={cat} />
                    {categoryLabels[cat]}
                  </button>
                );
              })}
            </div>
            {isAdmin && (
              <Button onClick={handleCreateEvent}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                일정 추가
              </Button>
            )}
          </div>
        }
      />

      {isError && (
        <div role="alert" className="flex flex-wrap items-center gap-3 border-t border-line-2 py-4">
          <p className="m-0 text-[14px] text-negative">일정을 불러오지 못했습니다</p>
          <Button variant="textPrimary" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? '다시 불러오는 중...' : '다시 시도'}
          </Button>
        </div>
      )}

      <div className="border-t border-line-2 xl:flex xl:items-start">
        <section aria-label="월간 달력" className="flex min-w-0 flex-1 flex-col gap-4 pt-6 xl:pr-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => navigateMonth('prev')}
                aria-label="이전 달"
                className="inline-flex h-11 w-11 items-center justify-center rounded-[8px] text-ink transition-colors duration-150 hover:bg-fill md:h-9 md:w-9"
              >
                <ChevronLeft className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
              <h2 className="m-0 min-w-[132px] text-center text-[20px] leading-7 font-bold tracking-[-0.02em] tabular-nums text-ink">
                {year}년 {month + 1}월
              </h2>
              <button
                type="button"
                onClick={() => navigateMonth('next')}
                aria-label="다음 달"
                className="inline-flex h-11 w-11 items-center justify-center rounded-[8px] text-ink transition-colors duration-150 hover:bg-fill md:h-9 md:w-9"
              >
                <ChevronRight className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              onClick={goToToday}
              className="h-11 rounded-[8px] px-2.5 text-[14px] font-semibold text-ink transition-colors duration-150 hover:text-primary md:h-9"
            >
              오늘
            </button>
          </div>

          <div
            aria-label={`${year}년 ${month + 1}월 달력`}
            aria-busy={isLoading || undefined}
            className="grid grid-cols-7 border-b border-line"
          >
            {DAY_NAMES.map((day, i) => (
              <span
                key={day}
                aria-hidden="true"
                className={cn(
                  'flex h-8 items-center justify-center px-2 text-[12px] font-semibold md:justify-start',
                  i === 0 ? 'text-negative' : 'text-ink-2'
                )}
              >
                {day}
              </span>
            ))}
            {calendarCells.map((cell) => {
              const { date, inMonth } = cell;
              const dateStr = toDateKey(date);
              const dayEvents = inMonth ? eventsByDate.get(dateStr) || [] : [];
              const isToday = isSameDay(date, today);
              const isSelected = !!selectedDate && isSameDay(date, selectedDate);
              const isHoliday = dayEvents.some((e) => e.isHoliday);
              const isSunday = date.getDay() === 0;

              // 셀은 div, 날짜 숫자가 버튼(::before로 셀 전체를 덮어 클릭 영역 유지), 일정 제목은 그 위의 개별 버튼
              return (
                <div
                  key={dateStr}
                  className={cn(
                    'relative flex min-h-[56px] min-w-0 flex-col items-center gap-1 border-t border-line p-1 transition-colors duration-150 ease-out md:min-h-24 md:items-start md:p-2',
                    isSelected ? 'bg-fill' : 'hover:bg-fill/60'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleCellClick(cell)}
                    aria-label={`${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일, 일정 ${dayEvents.length}개`}
                    aria-pressed={isSelected}
                    aria-current={isToday ? 'date' : undefined}
                    className={cn(
                      'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums',
                      'before:absolute before:inset-0 focus-visible:outline-none focus-visible:before:outline-2 focus-visible:before:-outline-offset-2 focus-visible:before:outline-primary',
                      isToday
                        ? 'bg-primary text-white'
                        : !inMonth
                        ? 'text-[#C9CFD9]'
                        : isHoliday || isSunday
                        ? 'text-negative'
                        : 'text-ink'
                    )}
                  >
                    {date.getDate()}
                  </button>

                  {/* Desktop: 6px 점 + 12px 한 줄 제목 */}
                  <div className="hidden w-full min-w-0 flex-col gap-1 md:flex">
                    {dayEvents.slice(0, 2).map((event, i) => {
                      const start = new Date(event.startDate);
                      const end = event.endDate ? new Date(event.endDate) : start;
                      const isLong = getDiffDays(event) > 7;

                      // 장기 일정 라벨: 시작일엔 "~M.DD", 종료일엔 "M.DD~"
                      let label = event.title;
                      if (isLong && event.endDate) {
                        if (isSameDay(date, start)) label = `${event.title} ~${formatShortDate(end)}`;
                        else if (isSameDay(date, end)) label = `${formatShortDate(start)}~ ${event.title}`;
                      }

                      return (
                        <button
                          key={`${event._id}-${i}`}
                          type="button"
                          onClick={() => handleCellEventClick(date, event)}
                          aria-label={`${event.title} 상세 보기`}
                          title={event.title}
                          className="relative z-[1] flex max-w-full items-center gap-[5px] text-left text-[12px] leading-4 text-ink transition-colors duration-150 ease-out hover:text-primary"
                        >
                          <EventDot category={event.category} />
                          <span className="min-w-0 truncate">{label}</span>
                        </button>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <span className="text-[12px] leading-4 text-ink-2">+{dayEvents.length - 2}</span>
                    )}
                  </div>

                  {/* Mobile: 점만 */}
                  {dayEvents.length > 0 && (
                    <span aria-hidden="true" className="flex items-center gap-[3px] md:hidden">
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <EventDot key={`m-${event._id}-${i}`} category={event.category} />
                      ))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 모바일 섹션 구분 띠 */}
        <div aria-hidden="true" className="-mx-5 mt-6 h-2.5 bg-fill md:hidden" />

        <aside
          aria-label="선택한 날과 이번 달 일정"
          className="flex min-w-0 flex-col gap-8 pt-2 md:mt-8 md:border-t md:border-line-2 md:pt-6 xl:mt-0 xl:w-[340px] xl:shrink-0 xl:border-t-0 xl:border-l xl:border-line xl:pl-8"
        >
          <section aria-labelledby="selected-day-title" className="flex flex-col">
            <div className="flex min-h-12 items-center justify-between gap-3 md:min-h-0">
              <h2 id="selected-day-title" className="m-0 text-[16px] leading-6 font-bold text-ink">
                {selectedDate
                  ? `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 (${DAY_NAMES[selectedDate.getDay()]})`
                  : '날짜를 선택하세요'}
              </h2>
              {selectedDate && (
                <div className="-mr-2 flex items-center">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleAddOnDate(selectedDate)}
                      className="h-11 px-2 text-[13px] font-semibold text-primary transition-colors duration-150 hover:text-primary-hover md:h-8"
                    >
                      이 날에 추가
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={clearSelectedDate}
                    aria-label="날짜 선택 해제"
                    className="inline-flex h-11 w-11 items-center justify-center text-ink-2 transition-colors duration-150 hover:text-ink md:h-8 md:w-8"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
            {!selectedDate ? (
              <p className="m-0 border-b border-line py-3.5 text-[14px] leading-5 text-ink-2">
                달력에서 날짜를 누르면 그날의 일정이 보여요.
              </p>
            ) : isLoading ? (
              <div className="border-b border-line py-3.5">
                <div className="h-5 w-2/3 animate-pulse rounded-[4px] bg-fill" />
              </div>
            ) : isError && !data ? null : selectedDayEvents.length === 0 ? (
              <p className="m-0 border-b border-line py-3.5 text-[14px] leading-5 text-ink-2">
                이 날의 일정이 없습니다.
              </p>
            ) : (
              <ul className="m-0 list-none p-0">
                {selectedDayEvents.map((event, i) => {
                  const expanded = selectedEventId === event._id;
                  const canManage = isAdmin && !event.isSystemHoliday;
                  return (
                    <li key={`sel-${event._id}-${i}`} className="border-b border-line">
                      <button
                        type="button"
                        onClick={() => setSelectedEventId(expanded ? null : event._id)}
                        aria-expanded={expanded}
                        className="flex min-w-0 w-full flex-col gap-1 py-3.5 text-left"
                      >
                        <span className="min-w-0 break-words [overflow-wrap:anywhere] text-[15px] leading-5 font-medium text-ink">{event.title}</span>
                        <span className="inline-flex items-center gap-[5px] text-[12px] leading-4 text-ink-2">
                          <EventDot category={event.category} />
                          {categoryLabels[event.category]} · {formatDateRange(event.startDate, event.endDate)}
                          {event.isHoliday && event.category !== 'holiday' && ' · 공휴일'}
                        </span>
                      </button>
                      {expanded && (event.description || canManage) && (
                        <div className="flex min-w-0 flex-col gap-2 pb-3.5 [overflow-wrap:anywhere]">
                          {event.description && (
                            <p className="m-0 min-w-0 break-words text-[14px] leading-5 whitespace-pre-line text-ink-2">
                              {event.description}
                            </p>
                          )}
                          {canManage && (
                            <div className="-ml-2.5 flex items-center gap-1">
                              <Button variant="text" size="sm" onClick={() => handleEditEvent(event)}>
                                수정
                              </Button>
                              <Button
                                variant="textDanger"
                                size="sm"
                                onClick={() => handleDeleteEvent(event._id)}
                              >
                                삭제
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="month-events-title" className="flex flex-col">
            <h2 id="month-events-title" className="m-0 flex min-h-12 items-center text-[16px] leading-6 font-bold text-ink md:min-h-0">
              이번 달 일정
            </h2>
            {isLoading ? (
              <div className="flex flex-col">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex min-h-[52px] items-center gap-3 border-b border-line py-1.5">
                    <div className="h-4 w-[72px] animate-pulse rounded-[4px] bg-fill" />
                    <div className="h-4 flex-1 animate-pulse rounded-[4px] bg-fill" />
                  </div>
                ))}
              </div>
            ) : isError && !data ? null : sortedEvents.length === 0 ? (
              <p className="m-0 py-3.5 text-[14px] leading-5 text-ink-2">등록된 일정이 없습니다.</p>
            ) : (
              <ul className="m-0 list-none p-0">
                {sortedEvents.map((event) => (
                  <li key={event._id}>
                    <button
                      type="button"
                      onClick={() => handleMonthEventClick(event)}
                      className="flex min-h-[52px] w-full items-center gap-3 border-b border-line py-1.5 text-left transition-colors duration-150 hover:bg-fill/60"
                    >
                      <span className="w-[92px] shrink-0 text-[13px] leading-[18px] tabular-nums text-ink-2">
                        {formatDateRange(event.startDate, event.endDate)}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="min-w-0 break-words [overflow-wrap:anywhere] text-[15px] leading-5 font-medium text-ink">{event.title}</span>
                        <span className="inline-flex items-center gap-[5px] text-[12px] leading-4 text-ink-2">
                          <EventDot category={event.category} />
                          {categoryLabels[event.category]}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {showEventForm && (
        <EventFormDialog
          isEditing={!!editingEvent}
          formData={formData}
          onChange={setFormData}
          onSubmit={handleSubmitEvent}
          onClose={() => setShowEventForm(false)}
          isPending={createMutation.isPending || updateMutation.isPending}
          categoryLabels={categoryLabels}
        />
      )}
    </div>
  );
}

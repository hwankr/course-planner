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
import { Card, CardContent } from '@/components/ui';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  X,
  CalendarDays,
} from 'lucide-react';
import type { AcademicEventCategory, CreateAcademicEventInput } from '@/types';

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

// Helper functions
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = dayNames[d.getDay()];
  return `${month}.${day} (${dayName})`;
};

const formatDateRange = (startDate: string, endDate?: string) => {
  if (!endDate) return formatDate(startDate);
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start.toDateString() === end.toDateString()) return formatDate(start);
  return `${formatDate(start)} ~ ${formatDate(end)}`;
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

const categoryLabels: Record<AcademicEventCategory, string> = {
  academic: '학사',
  registration: '수강신청',
  exam: '시험',
  holiday: '공휴일',
  other: '기타',
};

const categoryColors: Record<AcademicEventCategory, string> = {
  academic: 'bg-blue-100 text-blue-700 border-blue-200',
  registration: 'bg-green-100 text-green-700 border-green-200',
  exam: 'bg-red-100 text-red-700 border-red-200',
  holiday: 'bg-rose-100 text-rose-700 border-rose-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
};

interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  category: AcademicEventCategory;
  isHoliday: boolean;
}

export default function CalendarPage() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AcademicEventCategory | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    category: 'academic',
    isHoliday: false,
  });

  const { isAdmin } = useAuth();
  const addToast = useToastStore((state) => state.addToast);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { data, isLoading } = useAcademicEvents(year, month + 1);
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
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

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

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [year, month]);

  const sortedEvents = useMemo(() => {
    return [...allEvents]
      .filter((e) => !e.isSystemHoliday)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [allEvents]);

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
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  const handleDateClick = (date: Date) => {
    if (!isAdmin) return;
    const dateStr = toDateKey(date);
    setFormData({
      title: '',
      description: '',
      startDate: dateStr,
      endDate: '',
      category: 'academic',
      isHoliday: false,
    });
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleCreateEvent = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      category: 'academic',
      isHoliday: false,
    });
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
    setSelectedEvent(null);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      addToast({ type: 'success', message: '일정이 삭제되었습니다.' });
      setSelectedEvent(null);
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

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-8 h-8" style={{ color: '#153974' }} />
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#153974' }}>
              학사일정
            </h1>
          </div>
          {isAdmin && (
            <button
              onClick={handleCreateEvent}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors"
              style={{ backgroundColor: '#153974' }}
            >
              <Plus className="w-4 h-4" />
              일정 추가
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            전체
          </button>
          {(Object.keys(categoryLabels) as AcademicEventCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? categoryColors[cat]
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        {/* Calendar Card */}
        <Card className="mb-6">
          <CardContent className="px-1 py-4 md:p-6">
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg md:text-xl font-semibold min-w-[3rem] text-center">
                  {month + 1}월
                </h2>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={goToToday}
                  className="px-3 py-1 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors ml-1"
                >
                  오늘
                </button>
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-500 mr-2">
                {year}년
              </h2>
            </div>

            {/* Calendar Grid */}
            {isLoading ? (
              <div className="grid grid-cols-7 gap-0 md:gap-1">
                {dayNames.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="min-h-[90px] md:aspect-square bg-gray-100 animate-pulse border border-gray-200 md:rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-0 md:gap-1">
                {dayNames.map((day, i) => (
                  <div
                    key={day}
                    className={`text-center text-xs md:text-sm font-medium py-2 border-b border-gray-200 md:border-b-0 ${
                      i === 0 ? 'text-red-600' : i === 6 ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    {day}
                  </div>
                ))}
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="min-h-[90px] md:aspect-square border border-gray-100 md:border-0" />;
                  }

                  const dateStr = toDateKey(date);
                  const dayEvents = eventsByDate.get(dateStr) || [];
                  const isToday = isSameDay(date, today);
                  const dayOfWeek = date.getDay();
                  const isSelected = selectedDate && isSameDay(date, selectedDate);

                  return (
                    <div
                      key={dateStr}
                      onClick={() => {
                        setSelectedDate((prev) =>
                          prev && isSameDay(prev, date) ? null : date
                        );
                        handleDateClick(date);
                      }}
                      className={`min-h-[90px] md:aspect-square p-0.5 md:p-2 border border-gray-200 md:rounded-lg ${
                        isToday && isSelected
                          ? 'bg-blue-100 md:bg-blue-50 border-amber-400 md:border-2 md:border-blue-500 md:ring-2 md:ring-amber-400 md:ring-offset-0'
                          : isToday
                          ? 'bg-blue-50 border-blue-400 md:border-2 md:border-blue-500'
                          : isSelected
                          ? 'bg-amber-50/50 border-amber-300 md:border-2 md:border-amber-400 md:bg-white md:hover:bg-gray-50'
                          : 'bg-white hover:bg-gray-50'
                      } cursor-pointer md:cursor-default ${isAdmin ? 'md:cursor-pointer' : ''} transition-colors overflow-hidden`}
                    >
                      <div
                        className={`text-[10px] md:text-sm font-medium mb-0.5 md:mb-1 ${
                          dayOfWeek === 0
                            ? 'text-red-600'
                            : dayOfWeek === 6
                            ? 'text-blue-600'
                            : 'text-gray-700'
                        }`}
                      >
                        {date.getDate()}
                      </div>
                      {/* Desktop: existing event text (hidden on mobile) */}
                      <div className="hidden md:block space-y-0.5">
                        {dayEvents.slice(0, 3).map((event, i) => {
                          const start = new Date(event.startDate);
                          const end = event.endDate ? new Date(event.endDate) : start;
                          const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                          const isLong = diffDays > 7;
                          const isStartDay = date && isSameDay(date, start);
                          const isEndDay = date && event.endDate && isSameDay(date, end);

                          // 장기 일정 라벨: 시작일엔 "~MM.DD", 종료일엔 "MM.DD~"
                          let label = event.title;
                          if (isLong && event.endDate) {
                            const endM = String(end.getMonth() + 1).padStart(2, '0');
                            const endD = String(end.getDate()).padStart(2, '0');
                            const startM = String(start.getMonth() + 1).padStart(2, '0');
                            const startD = String(start.getDate()).padStart(2, '0');
                            if (isStartDay) label = `${event.title} ~${endM}.${endD}`;
                            else if (isEndDay) label = `${startM}.${startD}~ ${event.title}`;
                          }

                          return (
                            <div
                              key={`${event._id}-${i}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEventClick(event);
                              }}
                              className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer ${
                                categoryColors[event.category]
                              } ${diffDays > 0 ? 'font-medium' : ''} ${isLong ? 'italic' : ''}`}
                              title={`${event.title}${event.endDate ? ` (${formatDateRange(event.startDate, event.endDate)})` : ''}`}
                            >
                              {event.isHoliday && '🔴 '}
                              {label}
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 px-1">
                            +{dayEvents.length - 3}
                          </div>
                        )}
                      </div>

                      {/* Mobile: tiny text events */}
                      <div className="md:hidden space-y-px pointer-events-none">
                        {dayEvents.slice(0, 3).map((event, i) => (
                          <div
                            key={`m-${event._id}-${i}`}
                            className={`text-[10px] leading-tight px-0.5 rounded truncate ${
                              event.category === 'academic' ? 'text-blue-700 bg-blue-50' :
                              event.category === 'registration' ? 'text-green-700 bg-green-50' :
                              event.category === 'exam' ? 'text-red-700 bg-red-50' :
                              event.category === 'holiday' ? 'text-rose-700 bg-rose-50' :
                              'text-gray-600 bg-gray-50'
                            }`}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[9px] text-gray-400 px-0.5 leading-tight">
                            +{dayEvents.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mobile: Selected Day Events */}
        {selectedDate && (
          <div className="md:hidden mb-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-base" style={{ color: '#153974' }}>
                    {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
                    ({['일','월','화','수','목','금','토'][selectedDate.getDay()]})
                  </h3>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                {(() => {
                  const dateStr = toDateKey(selectedDate);
                  const dayEvents = eventsByDate.get(dateStr) || [];
                  if (dayEvents.length === 0) {
                    return (
                      <p className="text-sm text-gray-400 text-center py-4">
                        이 날의 일정이 없습니다.
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      {dayEvents.map((event, i) => (
                        <div
                          key={`mobile-${event._id}-${i}`}
                          onClick={() => handleEventClick(event)}
                          className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100"
                        >
                          <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                            categoryColors[event.category]
                          }`}>
                            {categoryLabels[event.category]}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {event.isHoliday && <span className="text-red-600 text-xs">🔴</span>}
                              <span className="text-sm font-medium truncate">
                                {event.title}
                              </span>
                            </div>
                            {event.endDate && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {formatDateRange(event.startDate, event.endDate)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Selected Event Detail */}
        {selectedEvent && (
          <Card className="mb-6 border-l-4" style={{ borderLeftColor: '#00AACA' }}>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        categoryColors[selectedEvent.category]
                      }`}
                    >
                      {categoryLabels[selectedEvent.category]}
                    </span>
                    {selectedEvent.isHoliday && (
                      <span className="text-red-600 text-sm">🔴 공휴일</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{selectedEvent.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {formatDateRange(selectedEvent.startDate, selectedEvent.endDate)}
                  </p>
                  {selectedEvent.description && (
                    <p className="text-sm text-gray-700">{selectedEvent.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {isAdmin && !selectedEvent.isSystemHoliday && (
                    <>
                      <button
                        onClick={() => handleEditEvent(selectedEvent)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(selectedEvent._id)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Event List */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#153974' }}>
              이번 달 일정
            </h3>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : sortedEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">등록된 일정이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {sortedEvents.map((event) => (
                  <div
                    key={event._id}
                    onClick={() => handleEventClick(event)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200"
                  >
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                        categoryColors[event.category]
                      }`}
                    >
                      {categoryLabels[event.category]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {event.isHoliday && <span className="text-red-600">🔴</span>}
                        <span className="font-medium">{event.title}</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {formatDateRange(event.startDate, event.endDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Form Modal */}
        {showEventForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold" style={{ color: '#153974' }}>
                    {editingEvent ? '일정 수정' : '일정 추가'}
                  </h3>
                  <button
                    onClick={() => setShowEventForm(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmitEvent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      제목 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        시작일 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        종료일
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        min={formData.startDate}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">분류</label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as AcademicEventCategory,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {(Object.keys(categoryLabels) as AcademicEventCategory[]).map((cat) => (
                        <option key={cat} value={cat}>
                          {categoryLabels[cat]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isHoliday"
                      checked={formData.isHoliday}
                      onChange={(e) => setFormData({ ...formData, isHoliday: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isHoliday" className="text-sm font-medium text-gray-700">
                      공휴일로 표시
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEventForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="flex-1 px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50"
                      style={{ backgroundColor: '#153974' }}
                    >
                      {createMutation.isPending || updateMutation.isPending
                        ? '저장 중...'
                        : editingEvent
                        ? '수정'
                        : '추가'}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

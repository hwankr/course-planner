import { create } from 'zustand';

export interface PreviewCourse {
  id: string;
  code: string;
  name: string;
  credits: number;
  category: 'major_required' | 'major_compulsory' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective' | 'teaching';
  departmentId?: string;  // 트랙 판별용
}

export type PreviewAction = 'add' | 'remove';

export interface PreviewSemesterTarget {
  year: number;
  term: string;
}

interface GraduationPreviewState {
  // State
  previewCourse: PreviewCourse | null;
  previewAction: PreviewAction;
  previewSemesterTarget: PreviewSemesterTarget | null;
  highlightTrigger: number;

  // Actions
  setPreview: (course: PreviewCourse | null, action?: PreviewAction, semesterTarget?: PreviewSemesterTarget | null) => void;
  clearPreview: () => void;
  triggerHighlight: () => void;
}

export const useGraduationPreviewStore = create<GraduationPreviewState>()((set) => ({
  previewCourse: null,
  previewAction: 'add',
  previewSemesterTarget: null,
  highlightTrigger: 0,

  setPreview: (course, action = 'add', semesterTarget = null) =>
    set({ previewCourse: course, previewAction: action, previewSemesterTarget: semesterTarget }),

  clearPreview: () =>
    set({ previewCourse: null, previewAction: 'add', previewSemesterTarget: null }),

  triggerHighlight: () =>
    set((state) => ({ highlightTrigger: state.highlightTrigger + 1 })),
}));

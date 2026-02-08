export interface TourStep {
  id: string;
  target: string; // data-tour attribute value to find element
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export const tourSteps: TourStep[] = [
  {
    id: 'requirements-summary',
    target: 'requirements-summary',
    title: '졸업 요건 확인',
    description: '여기서 졸업까지 필요한 학점을 한눈에 확인할 수 있어요. 전공, 교양 등 카테고리별 진행률이 표시됩니다.',
    position: 'bottom',
  },
  {
    id: 'course-catalog',
    target: 'course-catalog',
    title: '과목 검색',
    description: '학과 커리큘럼에서 과목을 검색하고 필터링할 수 있어요. 학년, 학기, 이수구분별로 필터링해보세요.',
    position: 'bottom',
  },
  {
    id: 'semester-column',
    target: 'semester-column',
    title: '학기에 과목 배치',
    description: '학기를 클릭하면 포커스 상태가 됩니다. 포커스된 학기에 과목을 드래그하거나 + 버튼으로 추가할 수 있어요.',
    position: 'top',
  },
  {
    id: 'add-semester',
    target: 'add-semester',
    title: '학기 추가',
    description: '새로운 학기를 추가하여 수강 계획을 확장할 수 있어요. 이제 자유롭게 계획을 세워보세요!',
    position: 'top',
  },
];

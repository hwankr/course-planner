/**
 * Seed Data Script for Course Planner
 * 영남대학교 컴퓨터학부 소프트웨어융합전공 기반 샘플 데이터
 *
 * Usage: npm run seed
 */

// dotenv를 먼저 로드해야 mongoose.ts의 MONGODB_URI 체크를 통과함
import './env';
import mongoose from 'mongoose';

// Import models using relative paths (tsx runs outside Next.js)
import { connectDB } from '../src/lib/db/mongoose';
import Department from '../src/models/Department';
import Course from '../src/models/Course';
import Requirement from '../src/models/Requirement';

// Type helpers
type CourseRef = mongoose.Types.ObjectId;
type DeptRef = mongoose.Types.ObjectId;

interface CourseData {
  code: string;
  name: string;
  credits: number;
  department: string; // department code
  prerequisites?: string[]; // course codes
  description: string;
  semesters: ('spring' | 'summer' | 'fall' | 'winter')[];
  category: string;
}

interface DepartmentData {
  code: string;
  name: string;
  college: string;
}

interface RequirementData {
  name: string;
  category: 'major_required' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective';
  requiredCredits: number;
  description: string;
  allowedCourses: string[]; // course codes or 'ALL'
}

// ============================================
// Data Definitions
// ============================================

const departments: DepartmentData[] = [
  {
    code: 'SWE',
    name: '소프트웨어융합전공',
    college: '공과대학',
  },
  {
    code: 'GEN',
    name: '교양학부',
    college: '기초교육원',
  },
];

const courses: CourseData[] = [
  // ============================================
  // 1학년 1학기 - 교양필수
  // ============================================
  {
    code: 'GEN1101',
    name: '소프트웨어와인공지능',
    credits: 3,
    department: 'GEN',
    prerequisites: [],
    description: 'SW와 AI의 기초 개념 및 사회적 영향 이해',
    semesters: ['spring'],
    category: 'general_required',
  },
  {
    code: 'GEN1102',
    name: '대학생활설계',
    credits: 1,
    department: 'GEN',
    prerequisites: [],
    description: '대학 생활 적응 및 진로 설계',
    semesters: ['spring'],
    category: 'general_required',
  },
  {
    code: 'GEN1103',
    name: '실용영어',
    credits: 3,
    department: 'GEN',
    prerequisites: [],
    description: '영어 의사소통 능력 향상',
    semesters: ['spring'],
    category: 'general_required',
  },
  {
    code: 'GEN1104',
    name: '행렬및행렬식',
    credits: 3,
    department: 'GEN',
    prerequisites: [],
    description: '행렬의 기본 연산 및 행렬식의 성질',
    semesters: ['spring'],
    category: 'general_required',
  },

  // ============================================
  // 1학년 2학기 - 교양필수 + 전공
  // ============================================
  {
    code: 'GEN1201',
    name: '사회공헌과봉사',
    credits: 1,
    department: 'GEN',
    prerequisites: [],
    description: '사회 봉사를 통한 공동체 의식 함양',
    semesters: ['fall'],
    category: 'general_required',
  },
  {
    code: 'SWE1201',
    name: 'C프로그래밍',
    credits: 3,
    department: 'SWE',
    prerequisites: [],
    description: 'C언어 기초 문법 및 프로그래밍 실습',
    semesters: ['fall'],
    category: 'major_required',
  },
  {
    code: 'SWE1202',
    name: '미분적분학(1)',
    credits: 3,
    department: 'SWE',
    prerequisites: [],
    description: '함수의 극한, 미분, 적분의 기초',
    semesters: ['fall'],
    category: 'major_required',
  },
  {
    code: 'SWE1203',
    name: '통계학(1)',
    credits: 3,
    department: 'SWE',
    prerequisites: [],
    description: '확률 및 통계의 기본 개념과 응용',
    semesters: ['fall'],
    category: 'major_required',
  },

  // ============================================
  // 2학년 1학기
  // ============================================
  {
    code: 'SWE2101',
    name: '보안기초',
    credits: 3,
    department: 'SWE',
    prerequisites: [],
    description: '정보보안의 기본 개념 및 암호학 입문',
    semesters: ['spring'],
    category: 'major_required',
  },
  {
    code: 'SWE2102',
    name: '자바프로그래밍및실습',
    credits: 3,
    department: 'SWE',
    prerequisites: ['SWE1201'],
    description: 'Java 언어를 이용한 객체지향 프로그래밍',
    semesters: ['spring'],
    category: 'major_required',
  },
  {
    code: 'SWE2103',
    name: '공학입문설계',
    credits: 2,
    department: 'SWE',
    prerequisites: [],
    description: '소프트웨어 설계의 기초 및 팀 프로젝트',
    semesters: ['spring'],
    category: 'major_elective',
  },
  {
    code: 'SWE2104',
    name: '논리회로',
    credits: 3,
    department: 'SWE',
    prerequisites: [],
    description: '디지털 논리 회로의 설계 및 분석',
    semesters: ['spring'],
    category: 'major_elective',
  },
  {
    code: 'SWE2105',
    name: '이산수학',
    credits: 3,
    department: 'SWE',
    prerequisites: [],
    description: '집합, 논리, 그래프 등 이산 수학의 기초',
    semesters: ['spring'],
    category: 'major_elective',
  },
  {
    code: 'SWE2106',
    name: '통계분석및모델링',
    credits: 3,
    department: 'SWE',
    prerequisites: [],
    description: '통계 분석 기법 및 데이터 모델링',
    semesters: ['spring'],
    category: 'major_elective',
  },

  // ============================================
  // 2학년 2학기
  // ============================================
  {
    code: 'SWE2201',
    name: '오픈소스SW의이해',
    credits: 2,
    department: 'SWE',
    prerequisites: [],
    description: '오픈소스 소프트웨어 개발 방법론 및 협업',
    semesters: ['fall'],
    category: 'major_required',
  },
  {
    code: 'SWE2202',
    name: '인공지능기초',
    credits: 3,
    department: 'SWE',
    prerequisites: [],
    description: 'AI의 기본 개념 및 기계학습 입문',
    semesters: ['fall'],
    category: 'major_required',
  },
  {
    code: 'SWE2203',
    name: '자료구조',
    credits: 3,
    department: 'SWE',
    prerequisites: ['SWE2102'],
    description: '스택, 큐, 트리, 그래프 등 자료구조 학습',
    semesters: ['fall'],
    category: 'major_required',
  },
  {
    code: 'SWE2204',
    name: '시스템프로그래밍및보안',
    credits: 3,
    department: 'SWE',
    prerequisites: [],
    description: 'Linux 시스템 프로그래밍 및 보안 기법',
    semesters: ['fall'],
    category: 'major_elective',
  },
  {
    code: 'SWE2205',
    name: '컴퓨터구조',
    credits: 3,
    department: 'SWE',
    prerequisites: [],
    description: 'CPU, 메모리 등 컴퓨터 하드웨어 구조',
    semesters: ['fall'],
    category: 'major_elective',
  },
  {
    code: 'SWE2206',
    name: '컴퓨터네트워크',
    credits: 3,
    department: 'SWE',
    prerequisites: [],
    description: 'TCP/IP 프로토콜 및 네트워크 설계',
    semesters: ['fall'],
    category: 'major_elective',
  },

  // ============================================
  // 3학년 1학기
  // ============================================
  {
    code: 'SWE3101',
    name: '딥러닝',
    credits: 3,
    department: 'SWE',
    prerequisites: ['SWE2202'],
    description: '신경망 및 딥러닝 알고리즘 학습',
    semesters: ['spring'],
    category: 'major_required',
  },
  {
    code: 'SWE3102',
    name: '알고리즘',
    credits: 3,
    department: 'SWE',
    prerequisites: ['SWE2203'],
    description: '정렬, 탐색, 동적 계획법 등 알고리즘 설계',
    semesters: ['spring'],
    category: 'major_required',
  },
  {
    code: 'SWE3103',
    name: '오픈소스SW설계',
    credits: 2,
    department: 'SWE',
    prerequisites: [],
    description: '오픈소스 프로젝트 설계 및 기여 실습',
    semesters: ['spring'],
    category: 'major_required',
  },
  {
    code: 'SWE3104',
    name: '운영체제',
    credits: 3,
    department: 'SWE',
    prerequisites: ['SWE2205'],
    description: '프로세스, 메모리, 파일 시스템 관리',
    semesters: ['spring'],
    category: 'major_required',
  },
  {
    code: 'SWE3105',
    name: '인공지능과컴퓨터비전',
    credits: 3,
    department: 'SWE',
    prerequisites: ['SWE2202'],
    description: '영상 처리 및 컴퓨터 비전 기술',
    semesters: ['spring'],
    category: 'major_required',
  },
  {
    code: 'SWE3106',
    name: '빅데이터개론',
    credits: 3,
    department: 'SWE',
    prerequisites: [],
    description: '대용량 데이터 처리 및 분산 시스템',
    semesters: ['spring'],
    category: 'major_elective',
  },
  {
    code: 'SWE3107',
    name: '웹프로그래밍',
    credits: 3,
    department: 'SWE',
    prerequisites: ['SWE2102'],
    description: 'HTML, CSS, JavaScript 기반 웹 개발',
    semesters: ['spring'],
    category: 'major_elective',
  },

  // ============================================
  // 3학년 2학기
  // ============================================
  {
    code: 'SWE3201',
    name: '강화학습',
    credits: 3,
    department: 'SWE',
    prerequisites: ['SWE3101'],
    description: 'Q-learning 등 강화학습 알고리즘',
    semesters: ['fall'],
    category: 'major_required',
  },
  {
    code: 'SWE3202',
    name: '데이터마이닝',
    credits: 3,
    department: 'SWE',
    prerequisites: ['SWE2203'],
    description: '데이터에서 패턴 추출 및 분석 기법',
    semesters: ['fall'],
    category: 'major_required',
  },
  {
    code: 'SWE3203',
    name: '블록체인',
    credits: 3,
    department: 'SWE',
    prerequisites: [],
    description: '블록체인 기술 및 암호화폐의 원리',
    semesters: ['fall'],
    category: 'major_required',
  },
  {
    code: 'SWE3204',
    name: '소프트웨어공학',
    credits: 3,
    department: 'SWE',
    prerequisites: ['SWE2102'],
    description: 'SW 개발 방법론 및 프로젝트 관리',
    semesters: ['fall'],
    category: 'major_required',
  },
  {
    code: 'SWE3205',
    name: '데이터베이스',
    credits: 3,
    department: 'SWE',
    prerequisites: ['SWE2203'],
    description: 'SQL 및 관계형 데이터베이스 설계',
    semesters: ['fall'],
    category: 'major_elective',
  },
  {
    code: 'SWE3206',
    name: '모바일프로그래밍',
    credits: 3,
    department: 'SWE',
    prerequisites: ['SWE2102'],
    description: 'Android/iOS 앱 개발 실습',
    semesters: ['fall'],
    category: 'major_elective',
  },
  {
    code: 'SWE3207',
    name: '소프트웨어프로젝트',
    credits: 2,
    department: 'SWE',
    prerequisites: [],
    description: '팀 단위 소프트웨어 개발 프로젝트',
    semesters: ['fall'],
    category: 'major_elective',
  },
  {
    code: 'SWE3208',
    name: '현장실습(소프트웨어)',
    credits: 3,
    department: 'SWE',
    prerequisites: [],
    description: '산업 현장 실습을 통한 실무 경험',
    semesters: ['fall'],
    category: 'major_elective',
  },

  // ============================================
  // 4학년 1학기
  // ============================================
  {
    code: 'SWE4101',
    name: '자연어처리',
    credits: 3,
    department: 'SWE',
    prerequisites: ['SWE3101'],
    description: 'NLP 기초 및 언어 모델 학습',
    semesters: ['spring'],
    category: 'major_required',
  },
  {
    code: 'SWE4102',
    name: 'MIDAS종합설계(1)',
    credits: 2,
    department: 'SWE',
    prerequisites: [],
    description: '산학 협력 종합 설계 프로젝트 1단계',
    semesters: ['spring'],
    category: 'major_elective',
  },
  {
    code: 'SWE4103',
    name: '네트워크보안및관제',
    credits: 3,
    department: 'SWE',
    prerequisites: [],
    description: '네트워크 보안 기술 및 모니터링',
    semesters: ['spring'],
    category: 'major_elective',
  },
  {
    code: 'SWE4104',
    name: '빅데이터응용',
    credits: 3,
    department: 'SWE',
    prerequisites: ['SWE3106'],
    description: 'Hadoop, Spark 등 빅데이터 프레임워크',
    semesters: ['spring'],
    category: 'major_elective',
  },
  {
    code: 'SWE4105',
    name: '산업체요구문제분석',
    credits: 3,
    department: 'SWE',
    prerequisites: [],
    description: '기업 요구사항 분석 및 솔루션 설계',
    semesters: ['spring'],
    category: 'major_elective',
  },
  {
    code: 'SWE4106',
    name: '현장실습(소프트웨어)',
    credits: 3,
    department: 'SWE',
    prerequisites: [],
    description: '산업 현장 실습을 통한 실무 경험',
    semesters: ['spring'],
    category: 'major_elective',
  },

  // ============================================
  // 4학년 2학기
  // ============================================
  {
    code: 'SWE4201',
    name: '4차산업혁명과취업세미나',
    credits: 1,
    department: 'SWE',
    prerequisites: [],
    description: '4차 산업혁명 트렌드 및 취업 전략',
    semesters: ['fall'],
    category: 'major_elective',
  },
  {
    code: 'SWE4202',
    name: 'MIDAS종합설계(2)',
    credits: 2,
    department: 'SWE',
    prerequisites: [],
    description: '산학 협력 종합 설계 프로젝트 2단계',
    semesters: ['fall'],
    category: 'major_elective',
  },
  {
    code: 'SWE4203',
    name: '산학과제공동연구',
    credits: 2,
    department: 'SWE',
    prerequisites: [],
    description: '기업과의 공동 연구 프로젝트 수행',
    semesters: ['fall'],
    category: 'major_elective',
  },
  {
    code: 'SWE4204',
    name: '인공지능및보안',
    credits: 3,
    department: 'SWE',
    prerequisites: ['SWE2202'],
    description: 'AI 보안 및 적대적 공격 방어 기법',
    semesters: ['fall'],
    category: 'major_elective',
  },
  {
    code: 'SWE4205',
    name: '컴퓨터그래픽스',
    credits: 3,
    department: 'SWE',
    prerequisites: [],
    description: '2D/3D 그래픽스 렌더링 기술',
    semesters: ['fall'],
    category: 'major_elective',
  },
];

const requirements: RequirementData[] = [
  {
    name: '전공필수',
    category: 'major_required',
    requiredCredits: 50,
    description: '소프트웨어융합전공 필수 과목 (50학점)',
    allowedCourses: [
      'SWE1201',
      'SWE1202',
      'SWE1203',
      'SWE2101',
      'SWE2102',
      'SWE2201',
      'SWE2202',
      'SWE2203',
      'SWE3101',
      'SWE3102',
      'SWE3103',
      'SWE3104',
      'SWE3105',
      'SWE3201',
      'SWE3202',
      'SWE3203',
      'SWE3204',
      'SWE4101',
    ],
  },
  {
    name: '전공선택',
    category: 'major_elective',
    requiredCredits: 21,
    description: '소프트웨어융합전공 선택 과목 (최소 21학점)',
    allowedCourses: [
      'SWE2103',
      'SWE2104',
      'SWE2105',
      'SWE2106',
      'SWE2204',
      'SWE2205',
      'SWE2206',
      'SWE3106',
      'SWE3107',
      'SWE3205',
      'SWE3206',
      'SWE3207',
      'SWE3208',
      'SWE4102',
      'SWE4103',
      'SWE4104',
      'SWE4105',
      'SWE4106',
      'SWE4201',
      'SWE4202',
      'SWE4203',
      'SWE4204',
      'SWE4205',
    ],
  },
  {
    name: '교양필수',
    category: 'general_required',
    requiredCredits: 11,
    description: '교양 필수 과목 (11학점)',
    allowedCourses: ['GEN1101', 'GEN1102', 'GEN1103', 'GEN1104', 'GEN1201'],
  },
  {
    name: '자유선택',
    category: 'free_elective',
    requiredCredits: 12,
    description: '자유선택 (모든 과목 가능)',
    allowedCourses: ['ALL'], // Special marker for all courses
  },
];

// ============================================
// Seed Functions
// ============================================

async function clearDatabase() {
  console.log('\n⚠️  경고: 시드 대상 데이터를 삭제합니다...');
  const db = mongoose.connection.db!;
  // users, plans 등 사용자 데이터는 유지하고 시드 대상만 삭제
  const seedCollections = ['departments', 'courses', 'requirements'];
  for (const name of seedCollections) {
    try {
      await db.dropCollection(name);
      console.log(`  ✓ ${name} 컬렉션 삭제`);
    } catch {
      // 컬렉션이 없으면 무시
      console.log(`  - ${name} 컬렉션 없음 (건너뜀)`);
    }
  }
  console.log('✅ 시드 대상 데이터 삭제 완료\n');
}

async function seedDepartments(): Promise<Map<string, DeptRef>> {
  console.log('📚 학과 데이터 생성 중...');
  const deptMap = new Map<string, DeptRef>();

  for (const dept of departments) {
    const created = await Department.create(dept);
    deptMap.set(dept.code, created._id);
    console.log(`  ✓ ${dept.code} - ${dept.name}`);
  }

  console.log(`✅ 총 ${departments.length}개 학과 생성 완료\n`);
  return deptMap;
}

async function seedCourses(
  deptMap: Map<string, DeptRef>
): Promise<Map<string, CourseRef>> {
  console.log('📖 과목 데이터 생성 중...');
  const courseMap = new Map<string, CourseRef>();

  // Sort courses to ensure prerequisites are created first
  const sortedCourses = [...courses].sort((a, b) => {
    // Courses with no prerequisites come first
    if (a.prerequisites.length === 0 && b.prerequisites.length > 0) return -1;
    if (a.prerequisites.length > 0 && b.prerequisites.length === 0) return 1;
    // Then sort by code
    return a.code.localeCompare(b.code);
  });

  for (const course of sortedCourses) {
    const deptId = deptMap.get(course.department);
    if (!deptId) {
      console.error(`  ✗ 학과를 찾을 수 없음: ${course.department}`);
      continue;
    }

    // Resolve prerequisite IDs
    const prerequisiteIds: CourseRef[] = [];
    for (const prereqCode of course.prerequisites || []) {
      const prereqId = courseMap.get(prereqCode);
      if (prereqId) {
        prerequisiteIds.push(prereqId);
      } else {
        console.warn(`  ⚠ 선수과목을 찾을 수 없음: ${prereqCode} (${course.code})`);
      }
    }

    const created = await Course.create({
      code: course.code,
      name: course.name,
      credits: course.credits,
      department: deptId,
      prerequisites: prerequisiteIds,
      description: course.description,
      semesters: course.semesters,
      category: course.category,
      isActive: true,
    });

    courseMap.set(course.code, created._id);
    console.log(`  ✓ ${course.code} - ${course.name} (${course.category})`);
  }

  console.log(`✅ 총 ${courses.length}개 과목 생성 완료\n`);
  return courseMap;
}

async function seedRequirements(
  deptMap: Map<string, DeptRef>,
  courseMap: Map<string, CourseRef>
): Promise<void> {
  console.log('📋 졸업요건 데이터 생성 중...');

  // All requirements are for SWE department
  const sweDeptId = deptMap.get('SWE');
  if (!sweDeptId) {
    console.error('  ✗ 소프트웨어융합전공을 찾을 수 없음');
    return;
  }

  for (const req of requirements) {
    // Resolve course IDs
    let allowedCourseIds: CourseRef[];

    if (req.allowedCourses.includes('ALL')) {
      // Free elective: all courses allowed
      allowedCourseIds = Array.from(courseMap.values());
    } else {
      allowedCourseIds = req.allowedCourses
        .map((code) => courseMap.get(code))
        .filter((id): id is CourseRef => id !== undefined);
    }

    await Requirement.create({
      department: sweDeptId,
      name: req.name,
      category: req.category,
      requiredCredits: req.requiredCredits,
      description: req.description,
      allowedCourses: allowedCourseIds,
    });

    console.log(`  ✓ ${req.name} (${req.category}) - ${req.requiredCredits}학점`);
  }

  console.log(`✅ 총 ${requirements.length}개 졸업요건 생성 완료\n`);
}

// ============================================
// Main
// ============================================

async function main() {
  try {
    console.log('🚀 Seed 스크립트 시작\n');
    console.log('📍 영남대학교 소프트웨어융합전공 실제 커리큘럼 데이터\n');

    // Connect to database
    await connectDB();

    // Clear existing data
    await clearDatabase();

    // Seed data in order
    const deptMap = await seedDepartments();
    const courseMap = await seedCourses(deptMap);
    await seedRequirements(deptMap, courseMap);

    console.log('🎉 모든 Seed 데이터 생성 완료!');
    console.log('\n📊 생성된 데이터:');
    console.log(`  - 학과: ${departments.length}개`);
    console.log(`  - 과목: ${courses.length}개`);
    console.log(`  - 졸업요건: ${requirements.length}개`);
  } catch (error) {
    console.error('\n❌ Seed 실행 중 오류 발생:', error);
    process.exit(1);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB 연결 종료');
  }
}

// Run the seed script
main();

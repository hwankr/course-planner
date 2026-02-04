# Course Planner - Development Guidelines

## Project Overview

학생들이 학기별 수강 계획을 세우고 졸업 요건을 추적하는 Next.js 풀스택 애플리케이션.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB + Mongoose
- **Authentication**: NextAuth.js (Google OAuth + Credentials)
- **Styling**: TailwindCSS
- **State**: Zustand + TanStack Query
- **Drag & Drop**: @hello-pangea/dnd

---

## CRITICAL: API Separation Preparation

### Why This Matters

이 프로젝트는 나중에 Capacitor를 통한 모바일 앱 변환을 고려하고 있습니다.
모바일화 시 Next.js API Routes는 사용할 수 없으므로, **API를 별도 서버로 분리**해야 합니다.

### Architecture Rules (MUST FOLLOW)

```
┌─────────────────────────────────────────────────────────────┐
│  API Route (app/api/*)                                      │
│  - HTTP 요청/응답 처리만 담당                                │
│  - 비즈니스 로직 절대 금지                                   │
│  - services/ 함수 호출만 수행                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Service Layer (services/*)                                 │
│  - 모든 비즈니스 로직 여기에 작성                            │
│  - HTTP에 의존하지 않는 순수 함수                            │
│  - 분리 시 이 폴더만 백엔드로 이동                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Model Layer (models/*)                                     │
│  - Mongoose 스키마 정의                                      │
│  - 분리 시 이 폴더도 백엔드로 이동                           │
└─────────────────────────────────────────────────────────────┘
```

### Code Pattern Examples

#### CORRECT - API Route는 얇게 유지

```typescript
// app/api/courses/route.ts
import { courseService } from '@/services/course.service';

// [API-SEPARABLE] 이 라우트는 분리 시 Express/Hono로 변환 가능
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get('departmentId');

  // Service 호출만 수행
  const courses = await courseService.findAll({ departmentId });

  return Response.json(courses);
}
```

#### WRONG - API Route에 로직 작성 금지

```typescript
// app/api/courses/route.ts - 이렇게 하지 마세요!
export async function GET(request: Request) {
  // ❌ 비즈니스 로직이 API Route에 있음
  await connectDB();
  const courses = await Course.find({ active: true })
    .populate('department')
    .sort({ code: 1 });

  // ❌ 데이터 변환도 여기서 하면 안됨
  const formatted = courses.map(c => ({...}));

  return Response.json(formatted);
}
```

### Marker Comments (REQUIRED)

모든 API Route 파일 상단에 다음 주석 필수:

```typescript
/**
 * @api-separable
 * @endpoint GET /api/courses
 * @service courseService.findAll
 * @migration-notes Express 변환 시: app.get('/api/courses', ...)
 */
```

### Folder Structure for Separation

```
src/
├── app/api/           # API Routes - 분리 시 삭제됨
├── services/          # ⭐ 분리 시 백엔드로 이동
├── models/            # ⭐ 분리 시 백엔드로 이동
├── lib/db/            # ⭐ 분리 시 백엔드로 이동
├── types/             # 공유 타입 - 양쪽에서 사용
├── components/        # 프론트엔드 전용
├── hooks/             # 프론트엔드 전용
└── stores/            # 프론트엔드 전용
```

### Migration Checklist (Future Reference)

API 분리 작업 시 체크리스트:

1. [ ] 새 백엔드 프로젝트 생성 (Express/Hono)
2. [ ] `services/`, `models/`, `lib/db/` 폴더 복사
3. [ ] API Routes를 Express 라우트로 변환
4. [ ] 환경변수 분리 (NEXT_PUBLIC_ → 백엔드용)
5. [ ] CORS 설정 추가
6. [ ] NextAuth를 별도 JWT 인증으로 변환
7. [ ] 프론트엔드 API 호출 URL 변경
8. [ ] Next.js를 Static Export로 변경

---

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes [분리 대상]
│   │   ├── auth/            # NextAuth.js 엔드포인트
│   │   ├── courses/         # 과목 CRUD
│   │   ├── plans/           # 수강계획 CRUD
│   │   ├── departments/     # 학과 관리
│   │   ├── requirements/    # 졸업요건
│   │   └── admin/           # 관리자 기능
│   ├── (auth)/              # 인증 페이지 그룹
│   │   ├── login/
│   │   └── register/
│   └── (dashboard)/         # 대시보드 페이지 그룹
│       ├── dashboard/
│       ├── planner/
│       ├── requirements/
│       ├── profile/
│       └── admin/
│
├── components/
│   ├── ui/                  # 기본 UI (Button, Input, Card 등)
│   └── features/            # 기능별 (CourseCard, SemesterColumn 등)
│
├── lib/
│   ├── db/                  # MongoDB 연결 [분리 대상]
│   │   └── mongoose.ts
│   ├── auth/                # 인증 설정
│   │   └── options.ts
│   └── utils.ts             # cn() 등 유틸리티
│
├── models/                  # Mongoose 스키마 [분리 대상]
│   ├── User.ts
│   ├── Course.ts
│   ├── Plan.ts
│   ├── Department.ts
│   └── Requirement.ts
│
├── services/                # 비즈니스 로직 [분리 대상] ⭐핵심
│   ├── user.service.ts
│   ├── course.service.ts
│   ├── plan.service.ts
│   ├── department.service.ts
│   └── requirement.service.ts
│
├── types/                   # TypeScript 타입 정의
│   ├── user.ts
│   ├── course.ts
│   ├── plan.ts
│   └── index.ts
│
├── hooks/                   # React 커스텀 훅
│   ├── useAuth.ts
│   ├── useCourses.ts
│   └── usePlan.ts
│
└── stores/                  # Zustand 스토어
    ├── authStore.ts
    └── planStore.ts
```

## Database Models

### User
- email, password (hashed), name
- department (ref), enrollmentYear
- role: 'student' | 'admin'

### Course
- code, name, credits
- department (ref)
- prerequisites (ref[])
- description, semester availability

### Plan
- user (ref)
- semesters: [{ year, term, courses[] }]
- status: 'draft' | 'active'

### Department
- code, name
- requirements (ref[])

### Requirement
- department (ref)
- category, name
- requiredCredits
- allowedCourses (ref[])

## Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/course-planner

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Commands

```bash
npm run dev      # 개발 서버 (Turbopack)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버
npm run lint     # ESLint 검사
```

---

**Last Updated**: 2026-02-05
**Version**: 2.0.0 (Next.js Rewrite)

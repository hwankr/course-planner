# P2 Data Integrity Design

## Goal

과목을 계획에 추가할 때 클라이언트가 전달한 `category`를 권위 값으로 사용하지 않고, 서버가 사용자의 학과와 교육과정을 기준으로 결정한다. 복수전공·부전공 게스트 계획에는 선택 학과를 끝까지 보존하고, 보조전공 탭에서 만든 커스텀 과목은 그 보조학과 소속으로 저장한다.

## Root Causes

1. 계획 추가 API가 클라이언트의 `category`를 받고, 서비스가 값이 있으면 `DepartmentCurriculum`을 조회하지 않는다.
2. 현재 fallback 교육과정 조회에는 `department` 조건이 없어, 같은 과목이 여러 학과에서 서로 다른 이수구분을 가지는 경우 결과가 비결정적이다.
3. 카탈로그는 `activeDepartment`를 알고 있지만 클릭·드래그 추가 DTO와 `CustomCourseForm`에 전달하지 않는다.
4. 게스트 졸업 계산기는 `departmentId`를 사용하지만 `GuestPlannedCourse`와 계획 동기화 경로가 그 값을 저장하지 않는다.
5. 사용자 커스텀 과목 조회가 현재 학과로 제한되지 않아 다른 학과 탭에 섞일 수 있다.

## Architecture

### Authoritative server classification

클라이언트는 분류가 아니라 선택한 카탈로그 학과를 `departmentId`로 전달한다. 이 값은 결정에 필요한 문맥일 뿐 권위 값이 아니다. `planService`가 `actorId`로 사용자를 조회하고, 전달된 학과가 사용자의 주전공 또는 현재 복수전공·부전공 학과인지 검증한다.

공식 학과 과목은 다음 키로 `DepartmentCurriculum`을 조회한다.

```text
course + validated department + user.curriculumYear (or DEFAULT_CURRICULUM_YEAR)
```

조회된 `DepartmentCurriculum.category`만 계획에 저장한다. 매칭 항목이 없으면 잘못된 fallback 대신 도메인 오류를 반환한다. 학과 독립 공식 공통 과목과 사용자 커스텀 과목은 교육과정 조인 항목이 없으므로 DB에 이미 저장된 `Course.category`를 사용한다. 요청 본문의 `category`는 API와 공유 입력 타입에서 제거한다.

### Department context propagation

`CourseCatalog.activeDepartment`를 단일 출처로 삼는다.

- 클릭 추가 DTO에 `departmentId`를 포함한다.
- 드래그 데이터에 `departmentId`를 포함하고, 드롭 시 전체 React Query 캐시의 첫 일치 항목을 찾는 대신 실제 드래그 데이터를 우선 사용한다.
- `CustomCourseForm`에 대상 학과를 prop으로 전달한다.
- `GuestPlannedCourse`, 낙관적 계획 상태, localStorage 계획, 계획 재동기화, 졸업 미리보기 변환에 `departmentId`를 보존한다.

기존 게스트 localStorage 항목에는 해당 값이 없을 수 있다. 필드는 optional로 유지해 기존 데이터를 깨뜨리지 않으며, 새로 추가되는 과목부터 정확한 학과를 저장한다. 과거 항목을 추측해 잘못 분류하지 않는다.

### Custom-course scoping

보조전공 탭의 폼은 세션이나 게스트 프로필의 주전공을 다시 읽지 않고 전달받은 대상 학과를 `Course.department`로 저장한다. 로그인 사용자와 게스트 모두 같은 prop을 사용한다. 학과별 카탈로그 조회 시 사용자 커스텀 과목도 현재 `departmentId`와 일치하는 항목만 합친다.

## Data Flow

```text
CourseCatalog(activeDepartment)
  -> click/drag/custom form departmentId
  -> guest: GuestPlannedCourse.departmentId
  -> member: POST /api/plans/:id/courses { departmentId }
       -> planService validates department against User
       -> DepartmentCurriculum(course, department, year)
       -> Plan.semesters[].courses[].category
```

## Error Handling

- 요청 학과가 사용자의 허용 학과가 아니면 계획 추가를 거부한다.
- 공식 학과 과목에 해당 학과·연도의 교육과정 항목이 없으면 계획 추가를 거부한다.
- 서버 저장 과목에도 이수구분이 없으면 계획 추가를 거부한다.
- 기존 API route의 인증, 계획 소유권, ObjectId 검증은 유지한다.

## Testing

- 조작된 요청 `category`가 서버 저장 결과에 영향을 주지 않음을 검증한다.
- 동일 과목의 주전공·보조전공 분류가 다를 때 선택한 허용 학과의 분류를 저장함을 검증한다.
- 사용자 소속이 아닌 학과를 거부하고, 사용자 DB의 교육과정 연도 및 기본 연도를 사용함을 검증한다.
- 커스텀·공통 과목은 요청값이 아닌 DB의 `Course.category`를 사용함을 검증한다.
- 게스트 복수전공·부전공 계획에서 `departmentId`가 보존되어 올바른 트랙으로 집계됨을 검증한다.
- 클릭·드래그·커스텀 폼·계획 동기화의 학과 전달 계약을 검증한다.
- 학과별 사용자 커스텀 과목 필터링을 검증한다.

## Scope

이번 변경은 새로 추가되는 계획 과목의 분류 정합성과 게스트 학과 문맥을 고친다. 기존 DB 계획의 잘못된 `category`를 일괄 마이그레이션하거나, 회원 `Plan` 하위 문서에 별도 학과 필드를 추가하는 작업은 포함하지 않는다.

# TeamSphere Client

TeamSphere는 팀 협업을 위한 완전한 워크스페이스 관리 플랫폼입니다. 이 클라이언트 애플리케이션은 React와 TypeScript로 구축되었으며, 팀, 작업, 메시징을 통합 관리할 수 있습니다.

## 주요 기능

### 🔐 인증 시스템
- JWT 기반 회원가입/로그인
- 보안 쿠키를 통한 세션 관리
- 프로필 관리

### 🏢 워크스페이스 관리
- 워크스페이스 생성 및 관리
- 멤버 초대 및 역할 관리 (Admin, Manager, Member, Viewer)
- 활동 로그 추적

### 👥 팀 관리
- 워크스페이스 내 팀 생성
- 팀 멤버 관리
- 팀별 작업 할당

### ✅ 작업 관리
- MySQL 기반 기본 작업 관리
- MongoDB 기반 상세 작업 정보
- 댓글 시스템
- 작업 상태 및 우선순위 관리

### 💬 메시징 시스템
- DM (Direct Message)
- 팀 채팅
- 워크스페이스 채팅
- 실시간 메시지 교환

## 기술 스택

- **Frontend**: React 19, TypeScript
- **상태 관리**: Zustand
- **라우팅**: React Router v7
- **HTTP 클라이언트**: Axios
- **스타일링**: CSS Modules
- **빌드 도구**: Create React App

## 프로젝트 구조

```
client/
├── public/
│   └── index.html
├── src/
│   ├── api/              # API 서비스 레이어
│   │   ├── authAPI.ts
│   │   ├── workspaceAPI.ts
│   │   ├── teamAPI.ts
│   │   ├── taskAPI.ts
│   │   ├── messageAPI.ts
│   │   ├── profileAPI.ts
│   │   └── activityAPI.ts
│   ├── components/       # 재사용 가능한 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── LoadingSpinner.tsx
│   ├── pages/           # 페이지 컴포넌트
│   │   ├── Dashboard.tsx
│   │   ├── WorkspaceList.tsx
│   │   ├── WorkspaceDetail.tsx
│   │   ├── TeamDetail.tsx
│   │   ├── TaskDetail.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── MessagesPage.tsx
│   │   └── NotFound.tsx
│   ├── routes/          # 라우팅 관련
│   │   └── ProtectedRoute.tsx
│   ├── store/           # Zustand 상태 관리
│   │   ├── authStore.ts
│   │   ├── workspaceStore.ts
│   │   ├── teamStore.ts
│   │   ├── taskStore.ts
│   │   └── messageStore.ts
│   ├── styles/          # CSS 모듈
│   │   ├── global.css
│   │   └── *.module.css
│   ├── types/           # TypeScript 타입 정의
│   │   └── api.ts
│   └── App.tsx
├── package.json
└── README.md
```

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env` 파일을 생성하고 다음 변수를 설정하세요:

```env
REACT_APP_API_BASE_URL=http://localhost:3001
```

### 3. 개발 서버 실행
```bash
npm start
```

애플리케이션이 `http://localhost:3000`에서 실행됩니다.

### 4. 빌드
```bash
npm run build
```

## API 연동

이 클라이언트는 TeamSphere 서버 API와 연동됩니다. 서버가 실행 중이어야 모든 기능이 정상 작동합니다.

### 주요 API 엔드포인트
- `/v1/auth/*` - 인증 관련
- `/v1/workspace/*` - 워크스페이스 관리
- `/v1/workspace/:id/teams/*` - 팀 관리
- `/v1/workspace/:id/members/*` - 멤버 관리
- `/v1/user/message/*` - DM 메시지
- `/v1/workspace/:id/Teams/:teamId/message/*` - 팀 메시지

## 상태 관리

Zustand를 사용하여 다음과 같은 전역 상태를 관리합니다:

- **authStore**: 사용자 인증 상태
- **workspaceStore**: 워크스페이스 및 멤버 정보
- **teamStore**: 팀 및 팀 멤버 정보
- **taskStore**: 작업 및 댓글 정보
- **messageStore**: 메시지 및 채팅방 정보

## 라우팅

React Router를 사용한 주요 라우트:

- `/` - 대시보드로 리다이렉트
- `/login` - 로그인 페이지
- `/register` - 회원가입 페이지
- `/dashboard` - 대시보드
- `/workspaces` - 워크스페이스 목록
- `/workspace/:id` - 워크스페이스 상세
- `/workspace/:id/team/:teamId` - 팀 상세
- `/workspace/:id/team/:teamId/task/:taskId` - 작업 상세
- `/profile` - 프로필 페이지
- `/messages` - 메시지 페이지

모든 보호된 라우트는 `ProtectedRoute` 컴포넌트로 래핑되어 인증된 사용자만 접근할 수 있습니다.

## 개발 가이드

### 새로운 페이지 추가
1. `src/pages/` 에 컴포넌트 생성
2. `src/App.tsx` 에 라우트 추가
3. 필요시 `src/components/Header.tsx` 에 네비게이션 링크 추가

### 새로운 API 추가
1. `src/types/api.ts` 에 타입 정의 추가
2. `src/api/` 에 API 서비스 함수 추가
3. 해당 Zustand 스토어에 액션 추가

### 스타일링
- CSS Modules 사용
- 전역 스타일은 `src/styles/global.css`
- 컴포넌트별 스타일은 `*.module.css`

## 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

# TeamSphere Client 🚀

> **Complete Team Collaboration & Task Management Frontend**  
> React 19 + TypeScript + Socket.IO + Zustand + CSS Modules

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=flat&logo=socket.io&logoColor=white)](https://socket.io/)
[![Zustand](https://img.shields.io/badge/Zustand-FF6B6B?style=flat)](https://zustand-demo.pmnd.rs/)
[![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat&logo=react-router&logoColor=white)](https://reactrouter.com/)

TeamSphere는 팀 협업을 위한 완전한 워크스페이스 관리 플랫폼입니다. 이 클라이언트 애플리케이션은 React 19와 TypeScript로 구축되었으며, 실시간 메시징, 하이브리드 데이터베이스, 그리고 포괄적인 팀 관리 기능을 제공합니다.

## ✨ 주요 기능

### 🔐 **완전한 인증 시스템**
- JWT 기반 회원가입/로그인/로그아웃
- 보안 쿠키를 통한 자동 세션 관리
- 사용자 프로필 생성 및 관리 (이름, 프로필 이미지, 연락처)
- Protected Routes로 인증된 사용자만 접근 가능
- 비밀번호 변경 기능

### 🏢 **워크스페이스 관리**
- 워크스페이스 생성, 조회, 수정
- 멤버 초대 및 역할 관리 (Admin, Manager, Member, Viewer)
- 워크스페이스 대시보드 (멤버, 팀, 활동 현황)
- 활동 로그 실시간 추적
- 워크스페이스별 권한 관리

### 👥 **팀 관리**
- 워크스페이스 내 팀 생성 및 관리
- 팀 멤버 추가/제거 및 역할 관리 (Leader, Member)
- 팀별 작업 할당 및 진행 상황 추적
- 팀 상세 페이지 (작업, 멤버, 채팅 탭)
- 팀별 통계 및 분석

### ✅ **하이브리드 작업 관리**
- **MySQL 기반**: 기본 작업 정보 (상태, 우선순위, 할당자)
- **MongoDB 기반**: 상세 작업 정보 (제목, 내용, 태그, 첨부파일)
- **댓글 시스템**: 대댓글, 멘션, 편집 이력 지원
- **작업 상태**: TODO, IN_PROGRESS, DONE, CANCELLED
- **우선순위**: LOW, MEDIUM, HIGH, URGENT
- 작업 필터링 및 검색 기능

### 💬 **실시간 메시징 시스템**
- **Socket.IO 기반 실시간 통신**
- **다중 채팅방**: DM, 팀 채팅, 워크스페이스 채팅
- **메시지 기능**: 텍스트, 이미지, 파일 메시지 지원
- **고급 기능**: 메시지 수정/삭제, 편집 이력, 실시간 알림
- **자동 정렬**: 마지막 메시지 시간 기준 채팅방 정렬
- **온라인 상태**: 실시간 사용자 온라인 상태 표시
- **타이핑 상태**: 실시간 타이핑 알림

### 📊 **대시보드 & 분석**
- 개인 대시보드 (참여 워크스페이스, 최근 활동, 출석 현황)
- 워크스페이스 대시보드 (팀 현황, 멤버 활동, 작업 진행률)
- 실시간 활동 로그 및 알림
- 출석 관리 시스템
- Chart.js 기반 데이터 시각화

## 🛠️ 기술 스택

### **Frontend Framework**
- **React 19** - 최신 React 기능 활용
- **TypeScript** - 정적 타입 검사 및 개발 생산성 향상

### **상태 관리 & 라우팅**
- **Zustand** - 경량 상태 관리 라이브러리
- **React Router v7** - 클라이언트 사이드 라우팅

### **통신 & 데이터**
- **Axios** - HTTP 클라이언트 (API 통신)
- **Socket.IO Client** - 실시간 양방향 통신
- **JWT 토큰** - 쿠키 기반 인증 시스템
- **React Query** - 서버 상태 관리 및 캐싱

### **UI & 스타일링**
- **CSS Modules** - 컴포넌트 스코프 스타일링
- **Tailwind CSS** - 유틸리티 기반 CSS 프레임워크
- **반응형 디자인** - 모바일/데스크톱 지원
- **Chart.js** - 데이터 시각화 라이브러리
- **Lucide React** - 아이콘 라이브러리
- **React Icons** - 다양한 아이콘 세트

### **개발 도구**
- **Create React App** - 빌드 도구 및 개발 환경
- **ESLint & Prettier** - 코드 품질 및 포맷팅
- **Jest & Testing Library** - 테스트 프레임워크

## 📁 프로젝트 구조

```
client/
├── public/
│   ├── iconTitle.png          # 앱 아이콘
│   └── index.html             # HTML 템플릿
├── src/
│   ├── api/                   # API 서비스 레이어
│   │   ├── auth/              # 인증 관련 API
│   │   │   ├── auth.ts        # 로그인/회원가입
│   │   │   └── Changepassword.ts # 비밀번호 변경
│   │   ├── dashboard/         # 대시보드 API
│   │   ├── task/              # 작업 관리 API
│   │   ├── user/              # 사용자 관련 API
│   │   │   ├── Attendance.ts  # 출석 관리
│   │   │   ├── Profile.ts     # 프로필 관리
│   │   │   ├── profile/       # 프로필 상세 API
│   │   │   └── rooms/         # 채팅방 API
│   │   ├── workspace/         # 워크스페이스 API
│   │   └── Api.ts             # API 기본 설정
│   ├── components/            # 재사용 가능한 UI 컴포넌트
│   │   ├── Footer.tsx         # 푸터 컴포넌트
│   │   └── Footer.module.css  # 푸터 스타일
│   ├── config/                # 설정 파일
│   ├── hooks/                 # 커스텀 훅
│   │   └── useSocket.ts       # Socket.IO 훅
│   ├── interface/             # TypeScript 인터페이스
│   │   ├── Dashboard.ts       # 대시보드 타입
│   │   ├── Member.ts          # 멤버 타입
│   │   ├── Message.ts         # 메시지 타입
│   │   ├── Profile.ts         # 프로필 타입
│   │   ├── Room.ts            # 채팅방 타입
│   │   ├── User.ts            # 사용자 타입
│   │   ├── Workspace.ts       # 워크스페이스 타입
│   │   ├── task.ts            # 작업 타입
│   │   └── teamDashboard.ts   # 팀 대시보드 타입
│   ├── pages/                 # 페이지 컴포넌트
│   │   ├── auth/              # 인증 페이지
│   │   │   ├── Login.tsx      # 로그인 페이지
│   │   │   ├── Signup.tsx     # 회원가입 페이지
│   │   │   ├── Logout.tsx     # 로그아웃 페이지
│   │   │   └── Auth.module.css # 인증 페이지 스타일
│   │   ├── dashboard/         # 대시보드 페이지
│   │   │   ├── Dashboard.tsx  # 메인 대시보드
│   │   │   └── Dashboard.css  # 대시보드 스타일
│   │   ├── user/              # 사용자 관련 페이지
│   │   └── workspace/         # 워크스페이스 관련 페이지
│   ├── router/                # 라우팅 설정
│   ├── services/              # 서비스 레이어
│   ├── stores/                # 상태 관리 (Zustand)
│   ├── styles/                # 전역 스타일
│   ├── utils/                 # 유틸리티 함수
│   ├── App.tsx                # 메인 앱 컴포넌트
│   ├── App.dashboard.tsx      # 대시보드 앱 컴포넌트
│   ├── App.css                # 앱 전역 스타일
│   ├── index.css              # 인덱스 스타일
│   └── index.tsx              # 앱 진입점
├── .env                       # 환경 변수
├── .env.example               # 환경 변수 예시
├── package.json               # 의존성 및 스크립트
├── tsconfig.json              # TypeScript 설정
├── tailwind.config.js         # Tailwind CSS 설정
├── postcss.config.cjs         # PostCSS 설정
├── .eslintrc.js               # ESLint 설정
├── apiRouter.json             # API 라우팅 설정
└── README.md                  # 프로젝트 문서
```

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env` 파일을 생성하고 다음 변수를 설정하세요:

```env
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_SOCKET_URL=http://localhost:8080
```

### 3. 개발 서버 실행
```bash
npm run dev
```

애플리케이션이 `http://localhost:3000`에서 실행됩니다.

**주의**: 서버가 `http://localhost:8080`에서 실행 중이어야 합니다.

### 4. 프로덕션 빌드
```bash
npm run build
```

### 5. 프로덕션 서버 실행
```bash
npm start
```

## API 연동

이 클라이언트는 TeamSphere 서버 API와 연동됩니다. 서버가 실행 중이어야 모든 기능이 정상 작동합니다.

### 🔗 API 연동 현황

**서버 API 문서**: `http://localhost:8080/docs` (Swagger UI)

#### **완전 연동된 API 카테고리**
- **인증 API** (`/v1/auth/*`) - 회원가입/로그인/로그아웃
- **대시보드 API** (`/v1/dashboard`) - 종합 대시보드 데이터
- **사용자 API** (`/v1/user/*`) - 사용자 정보 및 출석 관리
- **프로필 API** (`/v1/user/profile/*`) - 프로필 생성/조회/수정
- **워크스페이스 API** (`/v1/workspace/*`) - 워크스페이스 관리
- **팀 API** (`/v1/workspace/:id/teams/*`) - 팀 생성/관리
- **멤버 API** (`/v1/workspace/:id/members/*`) - 멤버 초대/역할 관리
- **작업 API** (`/v1/workspace/:id/teams/:id/member/:id/tasks/*`) - MySQL 작업
- **MongoDB 작업 API** - 상세 작업 정보 및 댓글 시스템
- **메시징 API** (`/v1/workspace/:id/message/*`) - 실시간 메시징
- **DM API** (`/v1/user/rooms/*`) - 개인 메시징
- **활동 로그 API** (`/v1/workspace/:id/activityLog/*`) - 활동 추적

#### **실시간 통신 (Socket.IO)**
- `join_room` - 채팅방 입장
- `leave_room` - 채팅방 퇴장  
- `send_message` - 메시지 전송
- `room_updated` - 실시간 방 업데이트
- `typing_start` - 타이핑 시작 알림
- `typing_stop` - 타이핑 종료 알림
- `user_joined` - 사용자 입장 알림
- `user_left` - 사용자 퇴장 알림
- `user_online` - 사용자 온라인 상태
- `user_offline` - 사용자 오프라인 상태

## 상태 관리

Zustand를 사용하여 다음과 같은 전역 상태를 관리합니다:

- **authStore**: 사용자 인증 상태 (JWT 토큰, 사용자 정보)
- **roomStore**: 채팅방 목록 및 메시지 상태
- **socketStore**: Socket.IO 연결 상태 및 실시간 이벤트
- **workspaceStore**: 워크스페이스 및 멤버 정보
- **teamStore**: 팀 및 팀 멤버 정보
- **taskStore**: 작업 및 댓글 정보 (MySQL + MongoDB 하이브리드)

## 라우팅

React Router를 사용한 주요 라우트:

- `/` - 대시보드로 리다이렉트
- `/login` - 로그인 페이지
- `/register` - 회원가입 페이지
- `/dashboard` - 대시보드
- `/rooms` - 채팅방 목록 (실시간 메시징)
- `/rooms/:roomId` - 채팅방 상세 (실시간 채팅)
- `/workspaces` - 워크스페이스 목록
- `/workspace/:id` - 워크스페이스 상세
- `/workspace/:id/team/:teamId` - 팀 상세
- `/workspace/:id/team/:teamId/task/:taskId` - 작업 상세
- `/profile` - 프로필 페이지

모든 보호된 라우트는 인증된 사용자만 접근할 수 있습니다.

## 개발 가이드

### 새로운 페이지 추가
1. `src/pages/` 에 컴포넌트 생성
2. `src/App.tsx` 에 라우트 추가
3. 필요시 네비게이션 링크 추가

### 새로운 API 추가
1. `src/interface/` 에 타입 정의 추가
2. `src/api/` 에 API 서비스 함수 추가
3. 해당 Zustand 스토어에 액션 추가
4. Socket.IO 이벤트가 필요한 경우 `useSocket` 훅 확장

### 스타일링
- **CSS Modules** 사용
- **Tailwind CSS** 유틸리티 클래스 활용
- 전역 스타일은 `src/index.css`
- 컴포넌트별 스타일은 `*.module.css`
- 반응형 디자인 지원
- 실시간 UI 업데이트 (Socket.IO 연동)

### 커스텀 훅
- **useSocket**: Socket.IO 연결 및 이벤트 관리
- 토큰 자동 갱신 및 쿠키 관리
- 실시간 메시징 기능 제공
- 온라인 상태 추적

### 테스트
```bash
npm test
```

Jest와 React Testing Library를 사용한 컴포넌트 테스트가 지원됩니다.

## 배포

### Railway 배포
- `Procfile`을 사용한 Railway 배포 설정
- 자동 빌드 및 배포 파이프라인
- 환경 변수 관리

### 정적 호스팅
```bash
npm run build
npm start
```

## 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

## 🤝 기여

기여를 환영합니다! 다음 단계를 따라주세요:

1. 이 저장소를 포크합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. 풀 리퀘스트를 엽니다

## 📞 지원

문제가 있거나 도움이 필요한 경우:
- 이슈를 생성해 주세요
- 팀 슬랙 채널에 문의해 주세요

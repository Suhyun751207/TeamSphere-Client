# TeamSphere Client 🚀

> **Complete Team Collaboration & Task Management Frontend**  
> React 19 + TypeScript + Socket.IO + Zustand + CSS Modules

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=flat&logo=socket.io&logoColor=white)](https://socket.io/)
[![Zustand](https://img.shields.io/badge/Zustand-FF6B6B?style=flat)](https://zustand-demo.pmnd.rs/)

TeamSphere는 팀 협업을 위한 완전한 워크스페이스 관리 플랫폼입니다. 이 클라이언트 애플리케이션은 React 19와 TypeScript로 구축되었으며, 실시간 메시징, 하이브리드 데이터베이스, 그리고 포괄적인 팀 관리 기능을 제공합니다.

## ✨ 주요 기능

### 🔐 **완전한 인증 시스템**
- JWT 기반 회원가입/로그인/로그아웃
- 보안 쿠키를 통한 자동 세션 관리
- 사용자 프로필 생성 및 관리 (이름, 프로필 이미지, 연락처)
- Protected Routes로 인증된 사용자만 접근 가능

### 🏢 **워크스페이스 관리**
- 워크스페이스 생성, 조회, 수정
- 멤버 초대 및 역할 관리 (Admin, Manager, Member, Viewer)
- 워크스페이스 대시보드 (멤버, 팀, 활동 현황)
- 활동 로그 실시간 추적

### 👥 **팀 관리**
- 워크스페이스 내 팀 생성 및 관리
- 팀 멤버 추가/제거 및 역할 관리 (Leader, Member)
- 팀별 작업 할당 및 진행 상황 추적
- 팀 상세 페이지 (작업, 멤버, 채팅 탭)

### ✅ **하이브리드 작업 관리**
- **MySQL 기반**: 기본 작업 정보 (상태, 우선순위, 할당자)
- **MongoDB 기반**: 상세 작업 정보 (제목, 내용, 태그, 첨부파일)
- **댓글 시스템**: 대댓글, 멘션, 편집 이력 지원
- **작업 상태**: TODO, IN_PROGRESS, DONE, CANCELLED
- **우선순위**: LOW, MEDIUM, HIGH, URGENT

### 💬 **실시간 메시징 시스템**
- **Socket.IO 기반 실시간 통신**
- **다중 채팅방**: DM, 팀 채팅, 워크스페이스 채팅
- **메시지 기능**: 텍스트, 이미지, 파일 메시지 지원
- **고급 기능**: 메시지 수정/삭제, 편집 이력, 실시간 알림
- **자동 정렬**: 마지막 메시지 시간 기준 채팅방 정렬
- **온라인 상태**: 실시간 사용자 온라인 상태 표시

### 📊 **대시보드 & 분석**
- 개인 대시보드 (참여 워크스페이스, 최근 활동, 출석 현황)
- 워크스페이스 대시보드 (팀 현황, 멤버 활동, 작업 진행률)
- 실시간 활동 로그 및 알림
- 출석 관리 시스템

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

### **UI & 스타일링**
- **CSS Modules** - 컴포넌트 스코프 스타일링
- **반응형 디자인** - 모바일/데스크톱 지원
- **모던 UI/UX** - 직관적이고 깔끔한 인터페이스

### **개발 도구**
- **Create React App** - 빌드 도구 및 개발 환경
- **ESLint & Prettier** - 코드 품질 및 포맷팅

## 📁 프로젝트 구조

```
client/
├── public/
│   ├── iconTitle.png          # 앱 아이콘
│   └── index.html             # HTML 템플릿
├── src/
│   ├── api/                   # API 서비스 레이어 (7개 파일)
│   │   ├── authAPI.ts         # 인증 관련 API
│   │   ├── workspaceAPI.ts    # 워크스페이스 관리 API
│   │   ├── teamAPI.ts         # 팀 관리 API
│   │   ├── taskAPI.ts         # 작업 및 MongoDB 작업, 댓글 API
│   │   ├── messageAPI.ts      # DM, 팀, 워크스페이스 메시징 API
│   │   ├── profileAPI.ts      # 프로필 관리 API
│   │   └── activityAPI.ts     # 활동 로그 API
│   ├── components/            # 재사용 가능한 UI 컴포넌트
│   │   ├── Button.tsx         # 다양한 variant 지원 버튼
│   │   └── LoadingSpinner.tsx # 로딩 스피너
│   ├── config/                # 설정 파일
│   │   └── api.ts             # Axios 기본 설정 및 인터셉터
│   ├── pages/                 # 페이지 컴포넌트 (8개 파일)
│   │   ├── Dashboard.tsx      # 개인 대시보드
│   │   ├── WorkspaceList.tsx  # 워크스페이스 목록
│   │   ├── WorkspaceDetail.tsx# 워크스페이스 상세 (개요, 팀, 멤버 탭)
│   │   ├── TeamDetail.tsx     # 팀 상세 (작업, 멤버, 채팅 탭)
│   │   ├── TaskDetail.tsx     # 작업 상세 (MongoDB 작업, 댓글)
│   │   ├── ProfilePage.tsx    # 프로필 관리
│   │   ├── MessagesPage.tsx   # DM 메시징 시스템
│   │   └── NotFound.tsx       # 404 페이지
│   ├── store/                 # Zustand 상태 관리 (5개 파일)
│   │   ├── authStore.ts       # 사용자 인증 상태
│   │   ├── workspaceStore.ts  # 워크스페이스 및 멤버 관리
│   │   ├── teamStore.ts       # 팀 및 팀 멤버 관리
│   │   ├── taskStore.ts       # 작업, MongoDB 작업, 댓글 관리
│   │   └── messageStore.ts    # 메시지 및 채팅방 관리
│   ├── styles/                # CSS Modules 스타일
│   │   ├── global.css         # 전역 스타일
│   │   └── *.module.css       # 컴포넌트별 스타일 (반응형)
│   ├── types/                 # TypeScript 타입 정의
│   │   └── api.ts             # 모든 API 타입 정의
│   ├── utils/                 # 유틸리티 함수
│   │   └── ProtectedRoute.tsx # 인증 보호 라우트
│   ├── App.tsx                # 메인 앱 컴포넌트 (라우팅)
│   └── index.tsx              # 앱 진입점
├── package.json               # 의존성 및 스크립트
├── tsconfig.json              # TypeScript 설정
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
npm start
```

애플리케이션이 `http://localhost:3000`에서 실행됩니다.

**주의**: 서버가 `http://localhost:8080`에서 실행 중이어야 합니다.

### 4. 빌드
```bash
npm run build
```

## API 연동

이 클라이언트는 TeamSphere 서버 API와 연동됩니다. 서버가 실행 중이어야 모든 기능이 정상 작동합니다.

### 🔗 API 연동 현황

**서버 API 문서**: `http://localhost:8080/docs` (Swagger UI)

#### **완전 연동된 API 카테고리 (80+ 엔드포인트)**
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

모든 보호된 라우트는 `ProtectedRoute` 컴포넌트로 래핑되어 인증된 사용자만 접근할 수 있습니다.

## 개발 가이드

### 새로운 페이지 추가
1. `src/pages/` 에 컴포넌트 생성
2. `src/App.tsx` 에 라우트 추가
3. 필요시 `src/components/Header.tsx` 에 네비게이션 링크 추가

### 새로운 API 추가
1. `src/types/` 에 타입 정의 추가
2. `src/api/` 에 API 서비스 함수 추가
3. 해당 Zustand 스토어에 액션 추가
4. Socket.IO 이벤트가 필요한 경우 `useSocket` 훅 확장

### 스타일링
- **CSS Modules** 사용
- 전역 스타일은 `src/styles/global.css`
- 컴포넌트별 스타일은 `*.module.css`
- 반응형 디자인 지원
- 실시간 UI 업데이트 (Socket.IO 연동)

## 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

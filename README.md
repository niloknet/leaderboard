# 스코어 랭킹 대시보드

게임 점수를 실시간 랭킹으로 반영하는 웹 대시보드. Firebase Emulator Suite로 로컬 개발, Devcontainer로 npm 미설치 개발 가능.

## 로컬 개발 (Devcontainer 권장)

### 1. Devcontainer로 열기

1. Cursor에서 **Reopen in Container** (Dev Containers 확장 필요)
2. 컨테이너 빌드 후 터미널 열기

### 2. Firebase 에뮬레이터 실행

```bash
cd functions && npm install && npm run build
cd .. && firebase emulators:start --only functions,database,hosting
```

### 3. 접속

에뮬레이터 실행 후 대시보드는 **http://localhost:5000** (Hosting 에뮬레이터)에서 접속합니다.

- **대시보드**: http://localhost:5000
- **Emulator UI**: http://localhost:4000

### 4. 테스트

1. 대시보드에서 사용자 ID, 닉네임, 점수 입력 후 점수 제출
2. 랭킹 테이블 실시간 갱신 확인
3. Emulator UI에서 Realtime Database 데이터 확인

## 프로젝트 구조

```
├── .devcontainer/     # Devcontainer 설정
├── docs/              # 정적 프론트엔드 (GitHub Pages 배포 소스)
├── functions/         # Cloud Functions
├── firebase.json
├── database.rules.json
└── Firebase 연결 명세.md   # 프로덕션 배포 가이드
```

## 프로덕션 배포

`Firebase 연결 명세.md` 참고.

<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# 로컬에 npm 안 깔고 도커에서 개발한다고 하면 도커 - 도커가 되지 않아요? 그래도 가능한가요?

네, **도커 안에서 개발하면서 Firebase Emulator Suite도 도커로 돌리는 것은 완전히 가능합니다!**

다만 말씀하신 것처럼 **"도커 ↔ 도커" 통신**이 발생하므로, 네트워크 설정에 신경을 써야 합니다. 크게 두 가지 방법이 있습니다.

***

## 방법 1: 한 컨테이너에서 모두 실행 (간단)

**개념**: 하나의 도커 컨테이너 안에 개발 환경(Node.js + 에디터) + Firebase Emulator를 함께 설치합니다.

### Dockerfile 예시

```dockerfile
FROM node:18

# Firebase CLI 설치
RUN npm install -g firebase-tools

# 작업 디렉토리 설정
WORKDIR /workspace

# Java 설치 (Emulator Suite는 Java 필요)
RUN apt-get update && apt-get install -y openjdk-17-jre-headless

# 포트 노출 (Emulator UI: 4000, Functions: 5001, Realtime DB: 9000 등)
EXPOSE 4000 5001 9000 9099

CMD ["bash"]
```


### 실행

```bash
# 이미지 빌드
docker build -t firebase-dev .

# 컨테이너 실행 (프로젝트 폴더를 마운트)
docker run -it --rm \
  -v $(pwd):/workspace \
  -p 4000:4000 -p 5001:5001 -p 9000:9000 -p 9099:9099 \
  firebase-dev

# 컨테이너 안에서
firebase emulators:start
```

**장점**:

- 설정이 단순하고 `localhost`로 그대로 접근 가능합니다.
- 호스트 머신(로컬 PC)에서 `http://localhost:4000`으로 Emulator UI를 열 수 있습니다.

**단점**:

- 하나의 컨테이너가 여러 역할을 하므로 Docker 철학상 완벽하진 않습니다.

***

## 방법 2: Docker Compose로 멀티 컨테이너 구성 (권장)

**개념**:

- **개발용 컨테이너**: 코드 작성 및 npm 스크립트 실행
- **Firebase Emulator 컨테이너**: Firebase 서비스들을 구동

두 컨테이너를 같은 Docker 네트워크에 연결해서 통신하게 만듭니다.

### 프로젝트 구조

```
leaderboard/
├── docker-compose.yml
├── Dockerfile.dev          # 개발 컨테이너용
├── Dockerfile.emulator     # Firebase Emulator용
├── docs/
├── functions/
└── firebase.json
```


### docker-compose.yml

```yaml
version: '3.8'

services:
  dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/workspace
    working_dir: /workspace
    stdin_open: true
    tty: true
    networks:
      - firebase-net
    depends_on:
      - firebase-emulator

  firebase-emulator:
    build:
      context: .
      dockerfile: Dockerfile.emulator
    ports:
      - "4000:4000"  # Emulator UI
      - "5001:5001"  # Functions
      - "9000:9000"  # Realtime DB
      - "9099:9099"  # Auth
    networks:
      - firebase-net
    command: firebase emulators:start --project demo-project

networks:
  firebase-net:
    driver: bridge
```


### Dockerfile.dev (개발용)

```dockerfile
FROM node:18
RUN npm install -g typescript ts-node nodemon
WORKDIR /workspace
CMD ["bash"]
```


### Dockerfile.emulator (Firebase Emulator 전용)

```dockerfile
FROM node:18

# Firebase CLI 설치
RUN npm install -g firebase-tools

# Java 설치 (Emulator 필수)
RUN apt-get update && apt-get install -y openjdk-17-jre-headless

WORKDIR /app

# Firebase 설정 파일 복사
COPY firebase.json .
COPY .firebaserc .
COPY functions/ ./functions/

# Emulator가 0.0.0.0에서 Listen하도록 설정
ENV FIREBASE_EMULATOR_HOST=0.0.0.0

EXPOSE 4000 5001 9000 9099

CMD ["firebase", "emulators:start", "--project", "demo-project"]
```


### 실행 방법

```bash
# 모든 컨테이너 시작
docker-compose up -d

# 개발 컨테이너에 접속
docker-compose exec dev bash

# 이제 dev 컨테이너 안에서
cd functions
npm install
npm run build
```


### 클라이언트 코드에서 에뮬레이터 연결

```javascript
// docs/js/config.js
if (location.hostname === "localhost") {
  // 도커 네트워크 안에서 통신
  firebase.functions().useFunctionsEmulator("http://firebase-emulator:5001");
  firebase.database().useEmulator("firebase-emulator", 9000);
}
```

**단, 브라우저는 호스트 머신에서 실행되므로:**

```javascript
// 호스트 머신(로컬 PC)의 브라우저에서 접속할 때
firebase.functions().useFunctionsEmulator("http://localhost:5001");
firebase.database().useEmulator("localhost", 9000);
```


***

## 방법 3: 공식 Firebase Emulator 도커 이미지 사용

Firebase 팀이 제공하는 공식 이미지는 없지만, 커뮤니티에서 만든 이미지들이 있습니다.

예: `androidsdk/firebase-emulator`

```bash
docker run -it --rm \
  -p 4000:4000 -p 5001:5001 -p 9000:9000 \
  -v $(pwd):/workspace \
  androidsdk/firebase-emulator
```

**단점**: 공식 이미지가 아니므로 버전 관리나 보안 측면에서 주의가 필요합니다.

***

## 네트워크 통신 주의사항

**도커 ↔ 도커 통신 시 주의할 점:**

1. **서비스 이름으로 연결**: Docker Compose 사용 시 컨테이너끼리는 `localhost`가 아니라 **서비스 이름**(예: `firebase-emulator`)으로 통신해야 합니다.
2. **포트 매핑 확인**:
    - 컨테이너 → 컨테이너: 내부 포트 사용 (예: `firebase-emulator:9000`)
    - 호스트 → 컨테이너: 매핑된 포트 사용 (예: `localhost:9000`)
3. **방화벽/바인딩**: Firebase Emulator가 `0.0.0.0`에 바인딩되도록 환경변수 설정이 필요할 수 있습니다.

***

## 최종 권장

**초기 개발 단계**: **방법 1 (단일 컨테이너)**이 가장 간단하고 빠릅니다.
**프로덕션 수준 개발**: **방법 2 (Docker Compose)**가 각 서비스를 분리해서 관리하기 좋습니다.

둘 다 완전히 가능하니 편하신 방법을 선택하시면 됩니다!
<span style="display:none">[^1][^2]</span>

<div align="center">⁂</div>

[^1]: seukoeo-raengking-daesibodeu-siseutem-myeongseseo.md

[^2]: seukoeo-raengking-daesibodeu-siseutem-myeongseseo.md


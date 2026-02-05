<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# firebase 도 aws쪽의 localstack과 같은 게 있을까요?

네, AWS의 **LocalStack**처럼 Firebase에도 로컬에서 전체 기능을 시뮬레이션할 수 있는 **Firebase Local Emulator Suite**가 있습니다.

이 도구를 사용하면 **클라우드 비용을 걱정하거나 실제 데이터를 오염시킬 위험 없이** 로컬 환경에서 Functions, Firestore, Realtime DB, Hosting 등을 모두 테스트할 수 있습니다.

### Firebase Local Emulator Suite 개요

**1. 지원하는 서비스**
다음 서비스들을 로컬호스트(localhost)에서 실행할 수 있습니다.

- **Authentication**: 사용자 가입/로그인 시뮬레이션
- **Firestore / Realtime Database**: 데이터베이스 읽기/쓰기/트리거
- **Cloud Functions**: 백엔드 함수 실행 및 로그 확인
- **Hosting**: 정적 컨텐츠 서빙
- **Cloud Storage**: 파일 업로드/다운로드

**2. 주요 특징**

- **UI 대시보드 제공**: 브라우저(`localhost:4000`)에서 DB 데이터를 직접 수정하거나, Functions 로그를 실시간으로 확인하고, 트리거를 강제로 실행해볼 수 있습니다.[^6]
- **실제와 동일한 환경**: 프로덕션 환경과 거의 동일하게 동작하므로 배포 전 버그를 잡기에 최적입니다.
- **CI/CD 통합**: 테스트 스크립트 실행 시 에뮬레이터를 띄우고 테스트 후 종료하는 자동화가 가능합니다.


### 사용 방법 (간단 요약)

**1. 설치 및 초기화**

```bash
# Firebase CLI 설치 (없을 경우)
npm install -g firebase-tools

# 프로젝트 폴더에서 초기화
firebase init emulators
```

이 과정에서 어떤 서비스를 에뮬레이션할지 선택하고 포트를 설정합니다.

**2. 에뮬레이터 실행**

```bash
firebase emulators:start
```

이 명령어를 실행하면 각 서비스가 로컬 포트(예: Functions는 5001, DB는 9000 등)에서 실행되며, **Emulator UI**(보통 4000번 포트)가 열립니다.

**3. 앱에서 에뮬레이터 연결 (코드 수정)**
클라이언트 코드(`config.js` 등)에서 개발 환경일 때만 에뮬레이터를 바라보도록 설정합니다.

```javascript
// 예: 개발 환경일 때만 로컬 에뮬레이터 연결
if (location.hostname === "localhost") {
  // Auth
  firebase.auth().useEmulator("http://localhost:9099");
  
  // Functions
  firebase.functions().useFunctionsEmulator("http://localhost:5001");
  
  // Realtime DB
  firebase.database().useEmulator("localhost", 9000);
}
```


### 요약

AWS에 LocalStack이 있다면, Firebase에는 **Emulator Suite**가 있습니다.
작성자님의 프로젝트(정적 페이지 + Functions + Realtime DB)의 **모든 구성요소를 로컬에서 완벽하게 시뮬레이션**할 수 있으므로, 배포 전에 로컬에서 안전하게 개발하시면 됩니다.
<span style="display:none">[^1][^10][^11][^12][^2][^3][^4][^5][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: seukoeo-raengking-daesibodeu-siseutem-myeongseseo.md

[^2]: seukoeo-raengking-daesibodeu-siseutem-myeongseseo.md

[^3]: https://supertokens.com/blog/firebase-alternatives

[^4]: https://www.nocobase.com/en/blog/open-source-firebase-alternatives

[^5]: https://dev.to/riteshkokam/firebase-alternatives-to-consider-in-2025-456g

[^6]: https://opensourcealternative.to/alternativesto/firebase

[^7]: https://www.reddit.com/r/degoogle/comments/1pafdlj/firebase_alternatives_and_how_to_convince_my/

[^8]: https://blog.back4app.com/firebase-alternatives/

[^9]: https://signoz.io/comparisons/firebase-alternatives/

[^10]: https://kinsta.com/blog/firebase-alternatives/

[^11]: https://deployapps.dev/blog/firebase-alternatives/

[^12]: https://www.reddit.com/r/opensource/comments/og5kdd/self_hosted_firebase_alternative_and_its/


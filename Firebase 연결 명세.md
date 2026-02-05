# Firebase 연결 명세 (추후 적용용)

이 문서는 로컬 Emulator 개발을 마친 후 **Firebase 프로덕션 환경**에 연결하고 배포할 때 참조하는 명세입니다.

---

## 1. Firebase 프로젝트 생성 및 콘솔 설정

### 1.1 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. **프로젝트 추가** 클릭
3. 프로젝트 ID, 리전 설정

### 1.2 서비스 활성화

- **Realtime Database**: Build → Realtime Database → 데이터베이스 만들기
- **Cloud Functions**: Build → Functions → 시작하기 (Blaze 플랜 필요)

### 1.3 Firebase 초기화

```bash
firebase login
firebase init
```

선택 항목: **Functions**, **Realtime Database**

---

## 2. Realtime Database 보안 규칙

클라이언트 직접 쓰기 차단, Cloud Functions(Admin SDK)만 쓰기 허용.

`database.rules.json`:

```json
{
  "rules": {
    "scores": {
      ".read": true,
      ".write": false
    }
  }
}
```

- **읽기**: 공개 허용 (랭킹 공개)
- **쓰기**: false (Cloud Functions의 Admin SDK만 bypass 가능)

---

## 3. 클라이언트 Firebase SDK 프로덕션 설정

### 3.1 Firebase Console에서 설정 값 확보

1. 프로젝트 설정 (톱니바퀴) → 일반
2. **웹 앱** 추가 또는 기존 앱의 `apiKey`, `authDomain`, `databaseURL`, `projectId` 복사

### 3.2 config.js 설정

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 프로덕션: useEmulator 호출하지 않음
// localhost가 아니면 자동으로 프로덕션 Firebase 연결
```

### 3.3 localhost 분기 (에뮬레이터 vs 프로덕션)

```javascript
if (location.hostname === "localhost") {
  firebase.functions().useFunctionsEmulator("http://localhost:5001");
  firebase.database().useEmulator("localhost", 9000);
}
// else: 프로덕션 Firebase 사용
```

---

## 4. Cloud Functions 배포 절차

### 4.1 배포 명령

```bash
firebase deploy --only functions
```

### 4.2 submitScore URL 확보

배포 후 출력 예:

```
✔  functions[submitScore(us-central1)]: Successful create operation.
Function URL (submitScore): https://us-central1-YOUR_PROJECT.cloudfunctions.net/submitScore
```

### 4.3 config.js에 URL 반영

```javascript
const SUBMIT_SCORE_URL = location.hostname === "localhost"
  ? "http://localhost:5001/YOUR_PROJECT/us-central1/submitScore"
  : "https://us-central1-YOUR_PROJECT.cloudfunctions.net/submitScore";
```

---

## 5. GitHub Pages 배포

### 5.1 배포 소스 설정

1. GitHub Repository → Settings → Pages
2. Source: **Deploy from a branch**
3. Branch: `main`, Folder: **/docs**

### 5.2 배포 주소

`https://<username>.github.io/<repo-name>/`

### 5.3 배포 후 확인

- `config.js`에 프로덕션 Firebase 설정 적용 확인
- `location.hostname === "localhost"`가 아니므로 프로덕션 Firebase/Cloud Functions 사용

---

## 6. Firebase 인증 (추후 적용)

점수 제출 시 사용자 인증이 필요한 경우:

```javascript
if (location.hostname === "localhost") {
  firebase.auth().useEmulator("http://localhost:9099");
}
```

- Firebase Console → Authentication → Sign-in method 활성화
- Cloud Functions에서 `context.auth` 검증

---

## 7. 배포 체크리스트

- [ ] Firebase 프로젝트 생성 및 Realtime DB, Functions 활성화
- [ ] `database.rules.json` 배포: `firebase deploy --only database`
- [ ] `config.js` 프로덕션 값 반영
- [ ] `firebase deploy --only functions` 실행
- [ ] GitHub Pages `docs/` 폴더 배포 소스 지정
- [ ] 프로덕션 URL에서 점수 제출 및 랭킹 확인

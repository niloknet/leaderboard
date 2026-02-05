/**
 * Firebase 및 API 설정
 * - localhost: 에뮬레이터 사용
 * - 그 외: 프로덕션 Firebase (Firebase 연결 명세.md 참고)
 */
const CONFIG = window.CONFIG = {
  firebase: {
    apiKey: "demo-api-key",
    authDomain: "demo-leaderboard.firebaseapp.com",
    databaseURL: "https://demo-leaderboard-default-rtdb.firebaseio.com",
    projectId: "demo-leaderboard",
    storageBucket: "demo-leaderboard.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:0000000000000000000000",
  },
  isLocal: () => location.hostname === "localhost" || location.hostname === "127.0.0.1",
  getSubmitScoreUrl: () => {
    if (CONFIG.isLocal()) {
      return "http://localhost:5001/demo-leaderboard/us-central1/submitScore";
    }
    return "https://us-central1-demo-leaderboard.cloudfunctions.net/submitScore";
  },
};

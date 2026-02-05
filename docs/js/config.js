// Firebase SDK (CDN 사용 - 브라우저에서 bare specifier 해석 불가 대응)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhn9prZR56YtKoiWbTckEaU2cCRtrr2KA",
  authDomain: "leaderboard-b29d3.firebaseapp.com",
  databaseURL: "https://leaderboard-b29d3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "leaderboard-b29d3",
  storageBucket: "leaderboard-b29d3.firebasestorage.app",
  messagingSenderId: "416608262234",
  appId: "1:416608262234:web:05149dfe7f9f1840212063"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
window.firebaseApp = app;

// 로컬/에뮬레이터 여부 (firebase.js에서 사용)
window.CONFIG = {
  isLocal() {
    return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  }
};
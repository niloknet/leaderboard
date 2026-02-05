/**
 * Firebase SDK 초기화 및 에뮬레이터 연결
 * - Realtime Database: 랭킹 실시간 구독
 * - submitScore: fetch로 HTTP API 호출 (config.js의 getSubmitScoreUrl)
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getDatabase, connectDatabaseEmulator } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

const app = initializeApp(window.CONFIG.firebase);
const database = getDatabase(app);

if (window.CONFIG.isLocal()) {
  connectDatabaseEmulator(database, "localhost", 9000);
}

window.firebaseApp = app;
window.firebaseDatabase = database;

export { database as firebaseDatabase };

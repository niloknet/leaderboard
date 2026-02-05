/**
 * Firebase 초기화: Database (읽기 전용)
 * - 로컬: DB 에뮬레이터 연결
 */
import { getDatabase, connectDatabaseEmulator } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

const app = window.firebaseApp;
if (!app) throw new Error("config.js must load first");

const database = getDatabase(app);

if (window.CONFIG.isLocal()) {
  connectDatabaseEmulator(database, "localhost", 9000);
}

window.firebaseApp = app;
window.firebaseDatabase = database;

export { database as firebaseDatabase };

/**
 * 랭킹 대시보드: Realtime DB 구독 (읽기 전용)
 */
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { firebaseDatabase } from "./firebase.js";

const dbRef = ref(firebaseDatabase, "leaderboard");

onValue(dbRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) {
    renderLeaderboard([]);
    return;
  }

  const list = Array.isArray(data) ? data : Object.values(data);
  const ranking = [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  renderLeaderboard(ranking);
});

function renderLeaderboard(ranking) {
  const listElement = document.getElementById("ranking-list");
  if (!listElement) return;
  listElement.innerHTML = "";

  ranking.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}위: ${item.username ?? ""} - ${item.score ?? 0}점`;
    listElement.appendChild(li);
  });

  if (ranking.length === 0) {
    const li = document.createElement("li");
    li.textContent = "등록된 점수가 없습니다.";
    listElement.appendChild(li);
  }
}

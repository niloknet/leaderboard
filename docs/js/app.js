/**
 * 랭킹 대시보드: leaderboard 한 번만 구독 후 byScore / byPassengers 로 나눠 표시
 */
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { firebaseDatabase } from "./firebase.js";

const dbRef = ref(firebaseDatabase, "leaderboard");

onValue(dbRef, (snapshot) => {
  const data = snapshot.val();
  const byScore = (data?.byScore && Array.isArray(data.byScore)) ? [...data.byScore] : [];
  const byPassengers = (data?.byPassengers && Array.isArray(data.byPassengers)) ? [...data.byPassengers] : [];

  renderLeaderboard("ranking-list", byScore, "score");
  renderLeaderboard("ranking-list-passengers", byPassengers, "passengers");
});

function renderLeaderboard(listId, ranking, mode) {
  const listElement = document.getElementById(listId);
  if (!listElement) return;
  listElement.innerHTML = "";

  const displayName = (name) => (name && String(name).trim()) ? String(name).trim() : "익명의 강화학습러";

  ranking.forEach((item, index) => {
    const li = document.createElement("li");
    const name = displayName(item.username);
    const scoreText = `${item.score ?? 0}점`;
    const passengersText = ` · 승객 ${item.passengers ?? 0}명`;
    if (mode === "score") {
      li.textContent = `${index + 1}위: ${name} - ${scoreText}${passengersText}`;
    } else {
      li.textContent = `${index + 1}위: ${name} - 승객 ${item.passengers ?? 0}명 (${item.score ?? 0}점)`;
    }
    listElement.appendChild(li);
  });

  if (ranking.length === 0) {
    const li = document.createElement("li");
    li.textContent = mode === "score" ? "등록된 점수가 없습니다." : "등록된 승객 기록이 없습니다.";
    listElement.appendChild(li);
  }
}

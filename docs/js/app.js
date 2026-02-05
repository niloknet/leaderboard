/**
 * 랭킹 대시보드 메인 로직
 * - Realtime DB scores 구독 및 렌더링
 * - 점수 제출 폼 처리
 */
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { firebaseDatabase } from "./firebase.js";

const scoresRef = ref(firebaseDatabase, "scores");
const leaderboardEl = document.getElementById("leaderboard-body");
const formEl = document.getElementById("submit-form");
const messageEl = document.getElementById("message");

// 랭킹 테이블 렌더링
function renderLeaderboard(scoresData) {
  if (!leaderboardEl) return;

  const entries = scoresData
    ? Object.entries(scoresData).map(([userId, data]) => ({
        userId,
        username: data.username || "",
        score: data.score ?? 0,
        updatedAt: data.updatedAt ?? 0,
      }))
    : [];

  entries.sort((a, b) => b.score - a.score);

  leaderboardEl.innerHTML = entries
    .map(
      (entry, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(entry.username)}</td>
      <td>${entry.score.toLocaleString()}</td>
    </tr>
  `
    )
    .join("") || "<tr><td colspan='3'>등록된 점수가 없습니다.</td></tr>";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Realtime DB 구독
onValue(scoresRef, (snapshot) => {
  renderLeaderboard(snapshot.val());
});

// 점수 제출 폼 처리
if (formEl) {
  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userId = formEl.userId?.value?.trim();
    const username = formEl.username?.value?.trim();
    const score = parseInt(formEl.score?.value, 10);
    const timestamp = Math.floor(Date.now() / 1000);

    if (!userId || !username || isNaN(score)) {
      showMessage("모든 필드를 입력해 주세요.", "error");
      return;
    }

    const submitBtn = formEl.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
    }

    try {
      const url = window.CONFIG.getSubmitScoreUrl();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, username, score, timestamp }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showMessage(`점수가 등록되었습니다! 순위: ${data.rank}위`, "success");
        formEl.reset();
      } else {
        showMessage(data.error || "점수 등록에 실패했습니다.", "error");
      }
    } catch (err) {
      showMessage("네트워크 오류가 발생했습니다. 에뮬레이터가 실행 중인지 확인해 주세요.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
      }
    }
  });
}

function showMessage(text, type) {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.className = `message message-${type}`;
  messageEl.hidden = false;
  setTimeout(() => {
    messageEl.hidden = true;
  }, 4000);
}

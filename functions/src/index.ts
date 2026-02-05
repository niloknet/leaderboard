import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const MAX_ENTRIES = 20;

interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  timestamp: number;
}

function setCors(res: functions.Response) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

/**
 * 점수 제출 (HTTP) - leaderboard 트랜잭션으로 상위 20명만 유지
 * Body: { userId: string, username?: string, score: number }
 */
export const submitScore = functions.https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { userId, username, score } = req.body as {
    userId?: string;
    username?: string;
    score?: number;
  };

  if (!userId || typeof score !== "number") {
    res.status(400).json({ error: "Invalid parameters" });
    return;
  }

  const db = admin.database();
  const leaderboardRef = db.ref("leaderboard");

  try {
    await leaderboardRef.transaction((currentLeaderboard) => {
      let list: LeaderboardEntry[];

      if (!currentLeaderboard) {
        list = [];
      } else if (Array.isArray(currentLeaderboard)) {
        list = [...currentLeaderboard];
      } else {
        list = Object.values(currentLeaderboard) as LeaderboardEntry[];
      }

      const existingIndex = list.findIndex((item) => item.userId === userId);

      if (existingIndex !== -1) {
        if (score > list[existingIndex].score) {
          list[existingIndex] = {
            ...list[existingIndex],
            score,
            username: username ?? list[existingIndex].username,
            timestamp: Date.now(),
          };
        } else {
          return undefined; // 변경 없음
        }
      } else {
        if (list.length < MAX_ENTRIES) {
          list.push({
            userId,
            username: username ?? "Anonymous",
            score,
            timestamp: Date.now(),
          });
        } else {
          const minScore = Math.min(...list.map((i) => i.score));
          if (score > minScore) {
            // 꼴등 동점이 여러 명이면 timestamp가 가장 큰(가장 늦게 들어온) 사람 제거
            const minScoreCandidates = list
              .map((item, index) => ({ item, index }))
              .filter(({ item }) => item.score === minScore);
            const toRemove = minScoreCandidates.reduce((a, b) =>
              a.item.timestamp >= b.item.timestamp ? a : b
            );
            const minIndex = toRemove.index;
            if (minIndex !== -1) {
              list.splice(minIndex, 1);
              list.push({
                userId,
                username: username ?? "Anonymous",
                score,
                timestamp: Date.now(),
              });
            }
          } else {
            return undefined;
          }
        }
      }

      list.sort((a, b) => b.score - a.score);
      return list;
    });

    res.status(200).json({ success: true, message: "Leaderboard updated" });
  } catch (error) {
    console.error("Error updating leaderboard:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

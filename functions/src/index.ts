import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();

const MAX_ENTRIES = 20;

interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  passengers: number;
  timestamp: number;
}

function setCors(res: functions.Response) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

/**
 * 점수 제출 (HTTP) - leaderboard 트랜잭션으로 상위 20명만 유지
 * Body: { userId: string, username?: string, score: number, passengers: number }
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

  const { userId, username, score, passengers } = req.body as {
    userId?: string;
    username?: string;
    score?: number;
    passengers?: number;
  };

  if (!userId || typeof score !== "number" || typeof passengers !== "number") {
    res.status(400).json({ error: "Invalid parameters (userId, score, passengers required)" });
    return;
  }

  const db = admin.database();
  const leaderboardRef = db.ref("leaderboard");

  try {
    await leaderboardRef.transaction((current) => {
      type LeaderboardData = { byScore: LeaderboardEntry[]; byPassengers: LeaderboardEntry[] };

      let byScore: LeaderboardEntry[];
      let byPassengers: LeaderboardEntry[];

      if (!current || !(current as LeaderboardData).byScore) {
        byScore = [];
        byPassengers = [];
      } else {
        const data = current as LeaderboardData;
        byScore = [...(data.byScore || [])];
        byPassengers = [...(data.byPassengers || [])];
      }

      const entry: LeaderboardEntry = {
        userId,
        username: username ?? "Anonymous",
        score,
        passengers,
        timestamp: Date.now(),
      };

      // byScore 갱신
      const scoreIdx = byScore.findIndex((item) => item.userId === userId);
      if (scoreIdx !== -1) {
        if (score > byScore[scoreIdx].score) {
          byScore[scoreIdx] = { ...byScore[scoreIdx], ...entry, username: username ?? byScore[scoreIdx].username };
        } else {
          return undefined;
        }
      } else {
        if (byScore.length < MAX_ENTRIES) {
          byScore.push(entry);
        } else {
          const minScore = Math.min(...byScore.map((i) => i.score));
          if (score <= minScore) return undefined;
          const minCandidates = byScore
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => item.score === minScore);
          const toRemove = minCandidates.reduce((a, b) =>
            a.item.timestamp >= b.item.timestamp ? a : b
          );
          byScore.splice(toRemove.index, 1);
          byScore.push(entry);
        }
      }
      byScore.sort((a, b) => b.score - a.score);

      const getP = (item: LeaderboardEntry) => item.passengers;
      const passIdx = byPassengers.findIndex((item) => item.userId === userId);
      if (passIdx !== -1) {
        if (passengers > getP(byPassengers[passIdx])) {
          byPassengers[passIdx] = { ...byPassengers[passIdx], ...entry, username: username ?? byPassengers[passIdx].username };
        }
      } else {
        if (byPassengers.length < MAX_ENTRIES) {
          byPassengers.push(entry);
        } else {
          const minP = Math.min(...byPassengers.map(getP));
          if (passengers > minP) {
            const minCandidates = byPassengers
              .map((item, index) => ({ item, index }))
              .filter(({ item }) => getP(item) === minP);
            const toRemove = minCandidates.reduce((a, b) =>
              a.item.timestamp >= b.item.timestamp ? a : b
            );
            byPassengers.splice(toRemove.index, 1);
            byPassengers.push(entry);
          }
        }
      }
      byPassengers.sort((a, b) => b.passengers - a.passengers);

      return { byScore, byPassengers };
    });

    res.status(200).json({ success: true, message: "Leaderboard updated" });
  } catch (error) {
    console.error("Error updating leaderboard:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.database();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const MAX_SCORE = 999999999;
const MIN_SCORE = 0;

interface SubmitScoreRequest {
  userId?: string;
  username?: string;
  score?: number;
  timestamp?: number;
}

/**
 * 점수 등록 API
 * - 유효성 검사, 어뷰징 방지, Realtime DB 업데이트
 */
export const submitScore = functions.https.onRequest(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.set(CORS_HEADERS).status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.set(CORS_HEADERS).status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = req.body as SubmitScoreRequest;
  const { userId, username, score, timestamp } = body;

  // 1. 필수 파라미터 검증
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    res.set(CORS_HEADERS).status(400).json({ error: "userId is required" });
    return;
  }
  if (!username || typeof username !== "string" || username.trim() === "") {
    res.set(CORS_HEADERS).status(400).json({ error: "username is required" });
    return;
  }
  if (score === undefined || score === null || typeof score !== "number") {
    res.set(CORS_HEADERS).status(400).json({ error: "score is required and must be a number" });
    return;
  }
  if (!timestamp || typeof timestamp !== "number") {
    res.set(CORS_HEADERS).status(400).json({ error: "timestamp is required" });
    return;
  }

  // 2. 어뷰징 방지: score 범위 검사
  if (score < MIN_SCORE || score > MAX_SCORE || !Number.isFinite(score)) {
    res.set(CORS_HEADERS).status(403).json({ error: "Invalid score range" });
    return;
  }

  // 3. DB 업데이트
  const scoresRef = db.ref("scores");
  const userScoreRef = scoresRef.child(userId);

  const scoreData = {
    username: username.trim().slice(0, 50),
    score: Math.floor(score),
    updatedAt: timestamp,
  };

  await userScoreRef.set(scoreData);

  // 4. Rank 계산: 전체 scores 조회 후 정렬
  const snapshot = await scoresRef.once("value");
  const scoresData = snapshot.val() || {};
  const entries = Object.entries(scoresData).map(([id, data]: [string, unknown]) => {
    const d = data as { score?: number };
    return { userId: id, score: d.score ?? 0 };
  });
  entries.sort((a, b) => b.score - a.score);
  const rank = entries.findIndex((e) => e.userId === userId) + 1;

  res.set(CORS_HEADERS).status(200).json({ success: true, rank });
});

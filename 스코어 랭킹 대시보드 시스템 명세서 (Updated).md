<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# 스코어 랭킹 대시보드 시스템 명세서 (Updated)

요청하신 대로 **정적 페이지는 GitHub Pages**로, **백엔드는 Firebase Cloud Functions**로 통합하여 관리 포인트를 최소화한 수정된 명세서입니다.

***

## 1. 시스템 개요

본 프로젝트는 게임 점수를 실시간으로 랭킹에 반영하고 대시보드 형태로 시각화하는 웹 애플리케이션입니다. 관리 복잡도를 낮추기 위해 **Serverless 아키텍처**를 채택했습니다.

* **Frontend**: 별도의 빌드 과정 없는 정적 웹페이지로 구현하며, **GitHub Pages**를 통해 호스팅합니다.
* **Backend**: **Firebase Cloud Functions**를 사용하여 별도의 서버 관리 없이 비즈니스 로직을 처리합니다.
* **Database**: **Firebase Realtime Database**를 사용하여 랭킹 데이터의 실시간 동기화를 처리합니다.

***

## 2. 시스템 아키텍처 (System Architecture)

기존 AWS 기반 구성요소를 제거하고 Firebase 생태계로 통합했습니다.

### 2.1 데이터 흐름도

```mermaid
graph LR
    User[Client / Browser] -- HTTPS --> GH[GitHub Pages (Frontend)]
    User -- API Call (POST) --> CF[Firebase Cloud Functions]
    User -- Socket (Subscribe) --> RDB[Firebase Realtime DB]
    
    CF -- Update Score --> RDB
    RDB -- Push Updates --> User
```


### 2.2 구성 요소 설명

| 구분 | 구성 요소 | 역할 | 비고 |
| :-- | :-- | :-- | :-- |
| **Hosting** | **GitHub Pages** | HTML, CSS, JS 정적 리소스 서빙 | `git push`로 배포 |
| **Backend** | **Firebase Cloud Functions** | 점수 등록/검증, 어뷰징 방지 로직 수행 | AWS Lambda 대체 |
| **Database** | **Firebase Realtime DB** | 랭킹 데이터 저장 및 클라이언트 실시간 전송 | WebSocket 기반 |


***

## 3. 기술 스택 (Tech Stack)

### Frontend

* **Language**: HTML5, CSS3, JavaScript (ES6+)
* **Library**: Alpine.js (가벼운 반응형 UI 구현, 선택 사항)
* **Hosting**: GitHub Pages


### Backend

* **Platform**: Firebase Cloud Functions
* **Runtime**: Node.js (JavaScript/TypeScript)
* **Framework**: Firebase Admin SDK


### Database

* **NoSQL**: Firebase Realtime Database

***

## 4. API 명세 (Firebase Functions)

기존 AWS API Gateway 엔드포인트가 Firebase Functions URL로 변경됩니다.

### 4.1 점수 등록 API

* **Endpoint**: `https://<REGION>-<PROJECT_ID>.cloudfunctions.net/submitScore`
* **Method**: `POST`
* **Content-Type**: `application/json`

**Request Body**

```json
{
  "userId": "user_12345",
  "username": "PlayerOne",
  "score": 1500,
  "timestamp": 1707033000
}
```

**Response**

* `200 OK`: `{"success": true, "rank": 5}`
* `400 Bad Request`: 필수 파라미터 누락
* `403 Forbidden`: 비정상적인 점수 감지

**Backend Logic (Node.js)**

1. 요청 데이터 유효성 검사.
2. Firebase Realtime DB의 `scores/{userId}` 경로에 데이터 업데이트.
3. (Optional) 트리거를 이용해 전체 랭킹 재계산 또는 집계.

***

## 5. 데이터베이스 설계 (Firebase Realtime DB)

### 5.1 데이터 구조 (JSON Tree)

```json
{
  "scores": {
    "user_A": {
      "username": "Alpha",
      "score": 2500,
      "updatedAt": 1707033100
    },
    "user_B": {
      "username": "Bravo",
      "score": 1200,
      "updatedAt": 1707033200
    }
  },
  "leaderboard": [
    // Cloud Functions가 주기적으로 정렬하여 갱신하거나,
    // 클라이언트에서 scores를 받아 정렬 (데이터 양에 따라 결정)
  ]
}
```


***

## 6. 배포 파이프라인 (Deployment)

### 6.1 Frontend (GitHub Pages)

1. 코드를 GitHub 저장소의 `main` (또는 `gh-pages`) 브랜치에 푸시합니다.
2. GitHub Repository Settings -> Pages 메뉴에서 배포 소스 브랜치를 설정합니다.
3. 자동으로 `https://<username>.github.io/<repo-name>` 주소에 배포됩니다.

### 6.2 Backend (Firebase Functions)

1. 로컬 환경에서 `firebase-tools` 설치: `npm install -g firebase-tools`
2. 로그인 및 초기화: `firebase login`, `firebase init functions`
3. 코드 작성 후 배포:

```bash
firebase deploy --only functions
```

4. 배포 완료 후 생성된 Endpoint URL을 프론트엔드 코드(`config.js` 등)에 반영합니다.

***

## 7. 주요 변경 사항 (vs 이전 버전)

1. **인프라 간소화**: AWS IAM, API Gateway, Lambda 설정이 제거되고 Firebase Console 하나로 통합되었습니다.
2. **비용 효율성**: 트래픽이 적은 초기 단계에서 GitHub Pages(무료)와 Firebase Spark Plan(무료)을 활용하여 운영 비용이 '0원'에 가깝습니다.
3. **개발 속도**: 백엔드 언어를 Go에서 Node.js로 변경하여, 프론트엔드와 언어를 통일(JavaScript)했습니다.
<span style="display:none">[^1][^2]</span>

<div align="center">⁂</div>

[^1]: seukoeo-raengking-daesibodeu-siseutem-myeongseseo.md

[^2]: seukoeo-raengking-daesibodeu-siseutem-myeongseseo.md


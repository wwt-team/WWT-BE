# 중고거래 API 명세서

## 1. 개요

- 기술 스택: NestJS, TypeORM, PostgreSQL
- API 스타일: REST API
- Base URL: `/api`
- 인증 방식: JWT Bearer 인증
- 토큰 방식: RFR 방식의 `accessToken + refreshToken`
- 실시간 채팅 WebSocket은 v1 범위에서 제외하고, REST 기반 메시지 API로 구현한다.

인증이 필요한 API는 아래 헤더를 사용한다.

```http
Authorization: Bearer {accessToken}
```

### 인증 토큰 정책

RFR은 refreshToken을 한 번 사용할 때마다 새 refreshToken으로 교체하는 방식으로 정의한다.

- 로그인 시 `accessToken`과 `refreshToken`을 함께 발급한다.
- accessToken은 API 인증에 사용한다.
- refreshToken은 accessToken 재발급에만 사용한다.
- `POST /api/auth/refresh` 성공 시 기존 refreshToken은 즉시 폐기하고 새 refreshToken을 발급한다.
- RFR 재발급으로 교체되어 폐기된 refreshToken이 다시 사용되면 탈취 가능성으로 보고 해당 refreshToken 패밀리를 모두 폐기한다.
- 서버에는 refreshToken 원문을 저장하지 않고 해시값만 저장한다.
- 로그아웃 시 전달받은 refreshToken을 폐기한다.

## 2. 공통 응답 및 상태 코드

### 성공 상태 코드

|           Status | 의미            |
| ---------------: | --------------- |
|         `200 OK` | 조회, 수정 성공 |
|    `201 Created` | 생성 성공       |
| `204 No Content` | 삭제 성공       |

### 에러 상태 코드

|                      Status | 의미                                      |
| --------------------------: | ----------------------------------------- |
|           `400 Bad Request` | 요청값 검증 실패                          |
|          `401 Unauthorized` | 인증 실패                                 |
|             `403 Forbidden` | 권한 없음                                 |
|             `404 Not Found` | 리소스 없음                               |
|              `409 Conflict` | 중복 데이터 또는 상태 충돌                |
| `500 Internal Server Error` | 서버 내부 오류                            |
|           `502 Bad Gateway` | 게이트웨이 또는 프록시 upstream 응답 오류 |
|   `503 Service Unavailable` | 서비스 일시 사용 불가                     |
|       `504 Gateway Timeout` | 게이트웨이 또는 프록시 응답 시간 초과     |

### 공통 에러 응답 형식

```json
{
  "statusCode": 400,
  "code": "INVALID_SIGNUP_EMAIL",
  "message": "이메일 형식이 올바르지 않습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/auth/signup"
}
```

필드 단위로 구분 가능한 검증 실패는 기능별 에러 코드로 분리한다.

### 에러 메시지 정책

에러 응답 형식은 공통으로 유지하지만 `message`는 기능별로 다르게 내려간다. `code`는 프론트엔드 분기 처리용 고정값이고, `message`는 사용자 또는 QA가 상황을 바로 이해할 수 있는 문장으로 설정한다.

예시:

| 기능             | code                              | message 예시                                    |
| ---------------- | --------------------------------- | ----------------------------------------------- |
| 회원가입         | `INVALID_SIGNUP_EMAIL`            | 이메일 형식이 올바르지 않습니다.                |
| 로그인           | `INVALID_CREDENTIALS`             | 이메일 또는 비밀번호가 올바르지 않습니다.       |
| 토큰 재발급      | `REFRESH_TOKEN_REUSE_DETECTED`    | 폐기된 refreshToken입니다. 다시 로그인해주세요. |
| 상품 등록        | `MISSING_PRODUCT_TITLE`           | 상품 제목은 필수입니다.                         |
| 상품 수정        | `FORBIDDEN`                       | 상품을 수정할 권한이 없습니다.                  |
| 상품 삭제        | `FORBIDDEN`                       | 상품을 삭제할 권한이 없습니다.                  |
| 거래 요청        | `DUPLICATE_PENDING_TRADE_REQUEST` | 이미 대기 중인 거래 요청이 있습니다.            |
| 거래 수락        | `INVALID_TRADE_REQUEST_STATUS`    | PENDING 상태의 거래 요청만 수락할 수 있습니다.  |
| 채팅 메시지 등록 | `INVALID_CHAT_MESSAGE`            | 메시지 내용이 올바르지 않습니다.                |
| 채팅 메시지 삭제 | `FORBIDDEN`                       | 메시지를 삭제할 권한이 없습니다.                |

### 에러 코드 기준

아래 표의 `message 예시`는 기본 문구다. 실제 API 응답에서는 기능별 상황에 맞게 더 구체적인 문구를 사용한다.

| HTTP Status | code                                | message 예시                                                 |
| ----------: | ----------------------------------- | ------------------------------------------------------------ |
|       `400` | `INVALID_EMAIL_CODE_REQUEST_EMAIL`  | 이메일 형식이 올바르지 않습니다.                             |
|       `400` | `INVALID_SIGNUP_EMAIL`              | 이메일 형식이 올바르지 않습니다.                             |
|       `400` | `INVALID_SIGNUP_PASSWORD`           | 비밀번호는 최소 8자 이상이어야 합니다.                       |
|       `400` | `INVALID_SIGNUP_NICKNAME`           | 닉네임은 필수입니다.                                         |
|       `400` | `INVALID_LOGIN_EMAIL`               | 이메일 형식이 올바르지 않습니다.                             |
|       `400` | `MISSING_LOGIN_PASSWORD`            | 비밀번호는 필수입니다.                                       |
|       `400` | `MISSING_EMAIL_VERIFICATION_TOKEN`  | 이메일 인증 토큰은 필수입니다.                               |
|       `400` | `INVALID_EMAIL_CODE`                | 이메일 인증 코드가 올바르지 않습니다.                        |
|       `400` | `EXPIRED_EMAIL_CODE`                | 이메일 인증 코드가 만료되었습니다.                           |
|       `400` | `INVALID_EMAIL_VERIFICATION_TOKEN`  | 이메일 인증 토큰이 올바르지 않습니다.                        |
|       `400` | `EXPIRED_EMAIL_VERIFICATION_TOKEN`  | 이메일 인증 토큰이 만료되었습니다.                           |
|       `400` | `USED_EMAIL_VERIFICATION_TOKEN`     | 이미 사용된 이메일 인증 토큰입니다.                          |
|       `400` | `EMAIL_VERIFICATION_EMAIL_MISMATCH` | 이메일 인증 토큰의 이메일과 요청 이메일이 일치하지 않습니다. |
|       `400` | `INVALID_PRODUCTS_PAGE`             | page는 1 이상의 숫자여야 합니다.                             |
|       `400` | `INVALID_PRODUCTS_LIMIT`            | 상품 개수는 1 이상 100 이하의 숫자여야 합니다.               |
|       `400` | `INVALID_SEARCH_STATUS`             | 상품의 상태는 판매중, 예약중, 거래완료 중 하나여야 합니다.   |
|       `400` | `INVALID_SEARCH_MIN_PRICE`          | minPrice는 0 이상의 정수여야 합니다.                         |
|       `400` | `INVALID_SEARCH_MAX_PRICE`          | maxPrice는 0 이상의 정수여야 합니다.                         |
|       `400` | `INVALID_SEARCH_PRICE_RANGE`        | minPrice는 maxPrice보다 클 수 없습니다.                      |
|       `400` | `MISSING_PRODUCT_TITLE`             | 상품 제목은 필수입니다.                                      |
|       `400` | `INVALID_PRODUCT_PRICE`             | 상품 가격은 0 이상의 정수여야 합니다.                        |
|       `400` | `INVALID_PRODUCT_IMAGE_URLS`        | 상품 이미지 URL 형식이 올바르지 않습니다.                    |
|       `400` | `MISSING_CHAT_PRODUCT_ID`           | productId는 필수입니다.                                      |
|       `400` | `MISSING_CHAT_RECEIVER_ID`          | receiverId는 필수입니다.                                     |
|       `400` | `INVALID_CHAT_RECEIVER_ID`          | receiverId는 올바른 사용자 ID여야 합니다.                    |
|       `400` | `INVALID_PRODUCT_STATUS`            | 상품 상태값이 올바르지 않습니다.                             |
|       `400` | `INVALID_TRADE_REQUEST_STATUS`      | 처리할 수 없는 거래 요청 상태입니다.                         |
|       `400` | `INVALID_CHAT_MESSAGE`              | 메시지 내용이 올바르지 않습니다.                             |
|       `401` | `UNAUTHORIZED`                      | 인증이 필요합니다.                                           |
|       `401` | `INVALID_CREDENTIALS`               | 이메일 또는 비밀번호가 올바르지 않습니다.                    |
|       `401` | `INVALID_REFRESH_TOKEN`             | refreshToken이 올바르지 않습니다.                            |
|       `401` | `EXPIRED_REFRESH_TOKEN`             | refreshToken이 만료되었습니다.                               |
|       `401` | `REFRESH_TOKEN_REUSE_DETECTED`      | 폐기된 refreshToken입니다. 다시 로그인해주세요.              |
|       `403` | `FORBIDDEN`                         | 접근 권한이 없습니다.                                        |
|       `404` | `USER_NOT_FOUND`                    | 사용자를 찾을 수 없습니다.                                   |
|       `404` | `PRODUCT_NOT_FOUND`                 | 상품을 찾을 수 없습니다.                                     |
|       `404` | `TRADE_REQUEST_NOT_FOUND`           | 거래 요청을 찾을 수 없습니다.                                |
|       `404` | `CHAT_ROOM_NOT_FOUND`               | 채팅방을 찾을 수 없습니다.                                   |
|       `404` | `CHAT_MESSAGE_NOT_FOUND`            | 메시지를 찾을 수 없습니다.                                   |
|       `409` | `EMAIL_ALREADY_EXISTS`              | 이미 가입된 이메일입니다.                                    |
|       `409` | `DUPLICATE_PENDING_TRADE_REQUEST`   | 이미 대기 중인 거래 요청이 있습니다.                         |
|       `409` | `SELF_TRADE_NOT_ALLOWED`            | 자신의 상품에는 거래 요청할 수 없습니다.                     |
|       `409` | `PRODUCT_ALREADY_SOLD`              | 판매 완료된 상품입니다.                                      |
|       `500` | `INTERNAL_SERVER_ERROR`             | 서버 내부 오류가 발생했습니다.                               |
|       `502` | `BAD_GATEWAY`                       | 게이트웨이에서 잘못된 응답을 받았습니다.                     |
|       `503` | `SERVICE_UNAVAILABLE`               | 일시적으로 서비스를 사용할 수 없습니다.                      |
|       `504` | `GATEWAY_TIMEOUT`                   | 게이트웨이 응답 시간이 초과되었습니다.                       |

### 서버 / 인프라 에러 응답

`5xx` 에러는 특정 기능의 비즈니스 실패가 아니라 서버 또는 인프라 문제로 처리한다. 모든 API에서 공통으로 발생할 수 있다.

#### 500 Internal Server Error

서버 내부 예외, 예상하지 못한 런타임 오류, 처리되지 않은 DB 오류 등이 발생하면 반환한다.

```json
{
  "statusCode": 500,
  "code": "INTERNAL_SERVER_ERROR",
  "message": "서버 내부 오류가 발생했습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products"
}
```

#### 502 Bad Gateway

Nginx, 로드밸런서, API Gateway 같은 게이트웨이 계층에서 upstream 서버의 잘못된 응답을 받으면 반환한다.

```json
{
  "statusCode": 502,
  "code": "BAD_GATEWAY",
  "message": "게이트웨이에서 잘못된 응답을 받았습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products"
}
```

#### 503 Service Unavailable

서버 점검, 과부하, DB 연결 불가 등으로 일시적으로 요청을 처리할 수 없으면 반환한다.

```json
{
  "statusCode": 503,
  "code": "SERVICE_UNAVAILABLE",
  "message": "일시적으로 서비스를 사용할 수 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products"
}
```

#### 504 Gateway Timeout

게이트웨이 계층에서 upstream 서버 응답을 제한 시간 안에 받지 못하면 반환한다.

```json
{
  "statusCode": 504,
  "code": "GATEWAY_TIMEOUT",
  "message": "게이트웨이 응답 시간이 초과되었습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products"
}
```

### 기능별 에러 메시지 상세

같은 `code`라도 기능별로 `message`를 다르게 설정한다.

#### 인증 / 회원

| API                                       | 상황                         | code                               | message                                    |
| ----------------------------------------- | ---------------------------- | ---------------------------------- | -------------------------------------------------------- |
| `POST /api/auth/signup/email-code`        | 이메일 형식 오류             | `INVALID_EMAIL_CODE_REQUEST_EMAIL` | 이메일 형식이 올바르지 않습니다. |
| `POST /api/auth/signup/email-code`        | 이미 가입된 이메일           | `EMAIL_ALREADY_EXISTS`             | 이미 가입된 이메일입니다. |
| `POST /api/auth/signup/email-code/verify` | 인증 코드 불일치             | `INVALID_EMAIL_CODE`               | 이메일 인증 코드가 올바르지 않습니다. |
| `POST /api/auth/signup/email-code/verify` | 인증 코드 만료               | `EXPIRED_EMAIL_CODE`               | 이메일 인증 코드가 만료되었습니다. |
| `POST /api/auth/signup`                   | 이메일 형식 오류             | `INVALID_SIGNUP_EMAIL`             | 이메일 형식이 올바르지 않습니다. |
| `POST /api/auth/signup`                   | 비밀번호 형식 오류           | `INVALID_SIGNUP_PASSWORD`          | 비밀번호는 최소 8자 이상이어야 합니다. |
| `POST /api/auth/signup`                   | 닉네임 누락                  | `INVALID_SIGNUP_NICKNAME`          | 닉네임은 필수입니다. |
| `POST /api/auth/signup`                   | 이메일 인증 토큰 누락        | `MISSING_EMAIL_VERIFICATION_TOKEN` | 이메일 인증을 완료해주세요. |
| `POST /api/auth/signup`                   | 이메일 인증 토큰 조작/불일치 | `INVALID_EMAIL_VERIFICATION_TOKEN` | 이메일 인증 정보가 올바르지 않습니다. 다시 인증해주세요. |
| `POST /api/auth/signup` | 이메일 인증 토큰 만료 | `EXPIRED_EMAIL_VERIFICATION_TOKEN` | 이메일 인증 시간이 만료되었습니다. 다시 인증해주세요. |
| `POST /api/auth/signup` | 이메일 인증 토큰 재사용 | `USED_EMAIL_VERIFICATION_TOKEN` | 이미 사용된 이메일 인증입니다. 다시 인증해주세요. |
| `POST /api/auth/signup` | 인증 이메일 불일치 | `EMAIL_VERIFICATION_EMAIL_MISMATCH` | 인증한 이메일과 회원가입 이메일이 일치하지 않습니다. |
| `POST /api/auth/signup` | 이미 가입된 이메일 | `EMAIL_ALREADY_EXISTS` | 이미 가입된 이메일입니다. |
| `POST /api/auth/login` | 이메일 형식 오류 | `INVALID_LOGIN_EMAIL` | 이메일 형식이 올바르지 않습니다. |
| `POST /api/auth/login` | 비밀번호 누락 | `MISSING_LOGIN_PASSWORD` | 비밀번호는 필수입니다. |
| `POST /api/auth/login` | 이메일 또는 비밀번호 불일치 | `INVALID_CREDENTIALS` | 이메일 또는 비밀번호가 올바르지 않습니다. |
| `POST /api/auth/refresh` | refreshToken 오류 | `INVALID_REFRESH_TOKEN` | 로그인 정보가 올바르지 않습니다. 다시 시도해주세요. |
| `POST /api/auth/refresh` | refreshToken 만료 | `EXPIRED_REFRESH_TOKEN` | 로그인 시간이 만료되었습니다. 다시 로그인해주세요. |
| `POST /api/auth/refresh` | 폐기된 refreshToken 재사용 | `REFRESH_TOKEN_REUSE_DETECTED` | 로그인이 만료되었습니다. 다시 로그인해주세요. |
| `POST /api/auth/logout` | accessToken 없음 또는 만료 | `UNAUTHORIZED` | 로그아웃하려면 인증이 필요합니다. |
| `GET /api/users/me` | accessToken 없음 또는 만료 | `UNAUTHORIZED` | 내 정보를 조회하려면 인증이 필요합니다. |
| `GET /api/users/me/products` | accessToken 없음 또는 만료 | `UNAUTHORIZED` | 내 상품 목록을 조회하려면 인증이 필요합니다. |

#### 상품

| API                                      | 상황                       | code                         | message                                          |
| ---------------------------------------- | -------------------------- | ---------------------------- | ---------------------------------------------------------- |
| `GET /api/products`                      | page 오류                  | `INVALID_PRODUCTS_PAGE`      | page는 1 이상의 숫자여야 합니다.                           |
| `GET /api/products`                      | limit 오류                 | `INVALID_PRODUCTS_LIMIT`     | 상품 개수는 1 이상 100 이하의 숫자여야 합니다.             |
| `GET /api/products/search`               | 상품 상태 오류             | `INVALID_SEARCH_STATUS`      | 상품의 상태는 판매중, 예약중, 거래완료 중 하나여야 합니다. |
| `GET /api/products/search`               | minPrice 오류              | `INVALID_SEARCH_MIN_PRICE`   | 최소 가격은 0 이상의 정수여야 합니다.                      |
| `GET /api/products/search`               | maxPrice 오류              | `INVALID_SEARCH_MAX_PRICE`   | 최대 가격은 0 이상의 정수여야 합니다.                      |
| `GET /api/products/search`               | 가격 범위 오류             | `INVALID_SEARCH_PRICE_RANGE` | 최소 가격은 최대 가격보다 클 수 없습니다.                  |
| `GET /api/products/{productId}`          | 상품 없음                  | `PRODUCT_NOT_FOUND`          | 상품을 찾을 수 없습니다.                                   |
| `POST /api/products`                     | accessToken 없음 또는 만료 | `UNAUTHORIZED`               | 상품을 등록하려면 인증이 필요합니다.                       |
| `POST /api/products`                     | 제목 누락                  | `MISSING_PRODUCT_TITLE`      | 상품 제목은 필수입니다.                                    |
| `POST /api/products`                     | 가격 오류                  | `INVALID_PRODUCT_PRICE`      | 상품 가격은 0 이상의 정수여야 합니다.                      |
| `POST /api/products`                     | 이미지 URL 오류            | `INVALID_PRODUCT_IMAGE_URLS` | 상품 이미지 형식이 올바르지 않습니다.                      |
| `PATCH /api/products/{productId}`        | accessToken 없음 또는 만료 | `UNAUTHORIZED`               | 상품을 수정하려면 인증이 필요합니다.                       |
| `PATCH /api/products/{productId}`        | 판매자 아님                | `FORBIDDEN`                  | 상품을 수정할 권한이 없습니다.                             |
| `PATCH /api/products/{productId}`        | 상품 없음                  | `PRODUCT_NOT_FOUND`          | 상품을 찾을 수 없습니다.                                   |
| `DELETE /api/products/{productId}`       | accessToken 없음 또는 만료 | `UNAUTHORIZED`               | 상품을 삭제하려면 인증이 필요합니다.                       |
| `DELETE /api/products/{productId}`       | 판매자 아님                | `FORBIDDEN`                  | 상품을 삭제할 권한이 없습니다.                             |
| `DELETE /api/products/{productId}`       | 상품 없음                  | `PRODUCT_NOT_FOUND`          | 상품을 찾을 수 없습니다.                                   |
| `PATCH /api/products/{productId}/status` | 상태값 오류                | `INVALID_PRODUCT_STATUS`     | 상품 상태가 올바르지 않습니다.                             |
| `PATCH /api/products/{productId}/status` | accessToken 없음 또는 만료 | `UNAUTHORIZED`               | 상품 상태를 변경하려면 인증이 필요합니다.                  |
| `PATCH /api/products/{productId}/status` | 판매자 아님                | `FORBIDDEN`                  | 상품 상태를 변경할 권한이 없습니다.                        |
| `PATCH /api/products/{productId}/status` | 상품 없음                  | `PRODUCT_NOT_FOUND`          | 상품을 찾을 수 없습니다.                                   |

#### 거래 요청

| API                                                 | 상황                       | code                              | message                             |
| --------------------------------------------------- | -------------------------- | --------------------------------- | ------------------------------------------------- |
| `POST /api/products/{productId}/trade-requests`     | accessToken 없음 또는 만료 | `UNAUTHORIZED`                    | 거래 요청을 등록하려면 인증이 필요합니다. |
| `POST /api/products/{productId}/trade-requests`     | 상품 없음                 | `PRODUCT_NOT_FOUND`               | 상품을 찾을 수 없습니다. |
| `POST /api/products/{productId}/trade-requests`     | 본인 상품 요청             | `SELF_TRADE_NOT_ALLOWED`          | 자신의 상품에는 거래 요청할 수 없습니다. |
| `POST /api/products/{productId}/trade-requests`     | 중복 대기 요청             | `DUPLICATE_PENDING_TRADE_REQUEST` | 이미 대기 중인 거래 요청이 있습니다. |
| `POST /api/products/{productId}/trade-requests`     | 판매 완료 상품             | `PRODUCT_ALREADY_SOLD`            | 판매 완료된 상품입니다. |
| `GET /api/products/{productId}/trade-requests`      | accessToken 없음 또는 만료 | `UNAUTHORIZED`                    | 거래 요청 목록을 조회하려면 인증이 필요합니다. |
| `GET /api/products/{productId}/trade-requests`      | 판매자 아님                | `FORBIDDEN`                       | 거래 요청 목록을 조회할 권한이 없습니다. |
| `GET /api/products/{productId}/trade-requests`      | 상품 없음                  | `PRODUCT_NOT_FOUND`               | 상품을 찾을 수 없습니다. |
| `PATCH /api/trade-requests/{tradeRequestId}/accept` | accessToken 없음 또는 만료 | `UNAUTHORIZED`                    | 거래 요청을 수락하려면 인증이 필요합니다. |
| `PATCH /api/trade-requests/{tradeRequestId}/accept` | 판매자 아님                | `FORBIDDEN`                       | 거래 요청을 수락할 권한이 없습니다. |
| `PATCH /api/trade-requests/{tradeRequestId}/accept` | 요청 없음                  | `TRADE_REQUEST_NOT_FOUND`         | 거래 요청을 찾을 수 없습니다. |
| `PATCH /api/trade-requests/{tradeRequestId}/accept` | PENDING 아님               | `INVALID_TRADE_REQUEST_STATUS`    | PENDING 상태의 거래 요청만 수락할 수 있습니다. |
| `PATCH /api/trade-requests/{tradeRequestId}/reject` | accessToken 없음 또는 만료 | `UNAUTHORIZED`                    | 거래 요청을 거절하려면 인증이 필요합니다. |
| `PATCH /api/trade-requests/{tradeRequestId}/reject` | 판매자 아님                | `FORBIDDEN`                       | 거래 요청을 거절할 권한이 없습니다. |
| `PATCH /api/trade-requests/{tradeRequestId}/reject` | 요청 없음                  | `TRADE_REQUEST_NOT_FOUND`         | 거래 요청을 찾을 수 없습니다. |
| `PATCH /api/trade-requests/{tradeRequestId}/reject` | PENDING 아님               | `INVALID_TRADE_REQUEST_STATUS`    | PENDING 상태의 거래 요청만 거절할 수 있습니다. |
| `GET /api/trade-requests/me`                        | accessToken 없음 또는 만료 | `UNAUTHORIZED`                    | 내 거래 요청 목록을 조회하려면 인증이 필요합니다. |

#### 채팅

| API                                                   | 상황                       | code                       | message                    |
| ----------------------------------------------------- | -------------------------- | -------------------------- | ---------------------------------------------------- |
| `POST /api/chats`                                     | productId 누락             | `MISSING_CHAT_PRODUCT_ID`  | 거래할 상품을 선택해주세요. |
| `POST /api/chats`                                     | receiverId 누락            | `MISSING_CHAT_RECEIVER_ID` | 채팅 상대를 선택해주세요. |
| `POST /api/chats`                                     | receiverId 형식 오류       | `INVALID_CHAT_RECEIVER_ID` | 채팅 상대의 정보가 올바르지 않습니다. |
| `POST /api/chats`                                     | accessToken 없음 또는 만료 | `UNAUTHORIZED`             | 채팅방을 생성하려면 인증이 필요합니다. |
| `POST /api/chats`                                     | 상품 없음                  | `PRODUCT_NOT_FOUND`        | 상품을 찾을 수 없습니다. |
| `POST /api/chats`                                     | 자기 자신과 채팅           | `SELF_TRADE_NOT_ALLOWED`   | 자기 자신과 채팅방을 만들 수 없습니다. |
| `GET /api/chats`                                      | accessToken 없음 또는 만료 | `UNAUTHORIZED`             | 채팅방 목록을 조회하려면 인증이 필요합니다.          |
| `GET /api/chats/{chatRoomId}/messages`                | accessToken 없음 또는 만료 | `UNAUTHORIZED`             | 채팅 메시지를 조회하려면 인증이 필요합니다.          |
| `GET /api/chats/{chatRoomId}/messages`                | 참여자 아님                | `FORBIDDEN`                | 채팅방 메시지를 조회할 권한이 없습니다. |
| `GET /api/chats/{chatRoomId}/messages`                | 채팅방 없음                | `CHAT_ROOM_NOT_FOUND`      | 채팅방을 찾을 수 없습니다. |
| `POST /api/chats/{chatRoomId}/messages`               | accessToken 없음 또는 만료 | `UNAUTHORIZED`             | 메시지를 등록하려면 인증이 필요합니다. |
| `POST /api/chats/{chatRoomId}/messages`               | 빈 메시지                  | `INVALID_CHAT_MESSAGE`     | 메시지 내용이 올바르지 않습니다. |
| `POST /api/chats/{chatRoomId}/messages`               | 참여자 아님                | `FORBIDDEN`                | 채팅방에 메시지를 등록할 권한이 없습니다. |
| `POST /api/chats/{chatRoomId}/messages`               | 채팅방 없음                | `CHAT_ROOM_NOT_FOUND`      | 채팅방을 찾을 수 없습니다. |
| `PATCH /api/chats/{chatRoomId}/messages/{messageId}`  | accessToken 없음 또는 만료 | `UNAUTHORIZED`             | 메시지를 수정하려면 인증이 필요합니다. |
| `PATCH /api/chats/{chatRoomId}/messages/{messageId}`  | 삭제된 메시지 수정         | `INVALID_CHAT_MESSAGE`     | 삭제된 메시지는 수정할 수 없습니다. |
| `PATCH /api/chats/{chatRoomId}/messages/{messageId}`  | 작성자 아님                | `FORBIDDEN`                | 메시지를 수정할 권한이 없습니다. |
| `PATCH /api/chats/{chatRoomId}/messages/{messageId}`  | 메시지 없음                | `CHAT_MESSAGE_NOT_FOUND`   | 메시지를 찾을 수 없습니다. |
| `DELETE /api/chats/{chatRoomId}/messages/{messageId}` | accessToken 없음 또는 만료 | `UNAUTHORIZED`             | 메시지를 삭제하려면 인증이 필요합니다. |
| `DELETE /api/chats/{chatRoomId}/messages/{messageId}` | 작성자 아님                | `FORBIDDEN`                | 메시지를 삭제할 권한이 없습니다. |
| `DELETE /api/chats/{chatRoomId}/messages/{messageId}` | 메시지 없음                | `CHAT_MESSAGE_NOT_FOUND`   | 메시지를 찾을 수 없습니다. |
  
### 페이지네이션 응답 형식

```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 0
}
```

기본값:

- `page`: `1`
- `limit`: `20`
- 기본 정렬: 최신 등록순

## 3. 인증 / 회원 API

### 3.1 회원가입 이메일 인증 코드 발송

```http
POST /api/auth/signup/email-code
```

인증: 불필요

Request Body:

```json
{
  "email": "user@example.com"
}
```

Response `201 Created`:

```json
{
  "message": "인증 코드가 발송되었습니다."
}
```

정책:

- 이미 가입된 이메일이면 `409 Conflict`를 반환한다.
- 인증 코드는 6자리 숫자다.
- 인증 코드 만료 시간은 10분이다.
- 실제 구현에서는 인증 코드를 해시하여 저장한다.

### 3.2 이메일 인증 코드 확인

```http
POST /api/auth/signup/email-code/verify
```

인증: 불필요

Request Body:

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

Response `200 OK`:

```json
{
  "emailVerificationToken": "verified-token"
}
```

정책:

- 코드가 틀리거나 만료되면 `400 Bad Request`를 반환한다.
- `emailVerificationToken`은 회원가입 요청 시 사용한다.
- `emailVerificationToken` 만료 시간은 30분이다.

### 3.3 회원가입

```http
POST /api/auth/signup
```

인증: 불필요

Request Body:

```json
{
  "email": "user@example.com",
  "password": "password1234!",
  "nickname": "홍길동",
  "emailVerificationToken": "verified-token"
}
```

Response `201 Created`:

```json
{
  "id": 1,
  "email": "user@example.com",
  "nickname": "홍길동",
  "emailVerifiedAt": "2026-04-15T12:00:00.000Z"
}
```

정책:

- 이메일은 중복 가입할 수 없다.
- 비밀번호는 최소 8자 이상이어야 한다.
- 이메일 인증이 완료되지 않은 사용자는 가입할 수 없다.
- 비밀번호는 해시하여 저장한다.

### 3.4 로그인

```http
POST /api/auth/login
```

인증: 불필요

Request Body:

```json
{
  "email": "user@example.com",
  "password": "password1234!"
}
```

Response `200 OK`:

```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "홍길동"
  }
}
```

### 3.5 토큰 재발급

```http
POST /api/auth/refresh
```

인증: 불필요

Request Body:

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

Response `200 OK`:

```json
{
  "accessToken": "new-jwt-access-token",
  "refreshToken": "new-jwt-refresh-token"
}
```

정책:

- refreshToken이 만료되었거나 폐기되었으면 `401 Unauthorized`를 반환한다.
- RFR 방식으로 재발급 시 기존 refreshToken은 폐기하고 새 refreshToken을 발급한다.
- 재발급으로 교체되어 폐기된 refreshToken이 재사용되면 `REFRESH_TOKEN_REUSE_DETECTED`를 반환하고 같은 토큰 패밀리의 refreshToken을 모두 폐기한다.

### 3.6 로그아웃

```http
POST /api/auth/logout
```

인증: 필요

Request Body:

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

Response `204 No Content`

정책:

- 전달받은 refreshToken을 폐기한다.
- 로그아웃으로 폐기된 refreshToken으로 재발급을 요청하면 `INVALID_REFRESH_TOKEN`을 반환한다.

### 3.7 내 정보 조회

```http
GET /api/users/me
```

인증: 필요

Response `200 OK`:

```json
{
  "id": 1,
  "email": "user@example.com",
  "nickname": "홍길동",
  "emailVerifiedAt": "2026-04-15T12:00:00.000Z",
  "createdAt": "2026-04-15T12:00:00.000Z"
}
```

### 3.8 마이페이지 - 내 상품 목록

```http
GET /api/users/me/products?page=1&limit=20
```

인증: 필요

Response `200 OK`:

```json
{
  "items": [
    {
      "id": 1,
      "title": "맥북 팝니다",
      "price": 900000,
      "status": "ON_SALE",
      "createdAt": "2026-04-15T12:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

## 4. 상품 API

### 상품 상태

```ts
type ProductStatus = 'ON_SALE' | 'RESERVED' | 'SOLD';
```

| 값         | 의미      |
| ---------- | --------- |
| `ON_SALE`  | 판매중    |
| `RESERVED` | 예약      |
| `SOLD`     | 거래 완료 |

### 4.1 상품 리스트 조회

```http
GET /api/products?page=1&limit=20
```

인증: 불필요

Response `200 OK`:

```json
{
  "items": [
    {
      "id": 1,
      "title": "맥북 팝니다",
      "price": 900000
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

정책:

- 상품 리스트는 제목과 가격만 반환한다.
- 기본 정렬은 최신 등록순이다.

### 4.2 상품 검색

```http
GET /api/products/search?keyword=맥북&minPrice=100000&maxPrice=1000000&status=ON_SALE&page=1&limit=20
```

인증: 불필요

Query Parameters:

| 이름       | 타입          | 필수 | 설명             |
| ---------- | ------------- | ---: | ---------------- |
| `keyword`  | string        |   No | 상품 제목 검색어 |
| `minPrice` | number        |   No | 최소 가격        |
| `maxPrice` | number        |   No | 최대 가격        |
| `status`   | ProductStatus |   No | 상품 상태        |
| `page`     | number        |   No | 페이지 번호      |
| `limit`    | number        |   No | 페이지 크기      |

Response `200 OK`:

```json
{
  "items": [
    {
      "id": 1,
      "title": "맥북 팝니다",
      "price": 900000
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

정책:

- `keyword`는 상품 제목 기준으로 검색한다.
- `minPrice`, `maxPrice`를 함께 사용할 수 있다.
- 검색 결과도 리스트 조회와 동일하게 제목과 가격만 반환한다.

### 4.3 상품 상세 조회

```http
GET /api/products/{productId}
```

인증: 불필요

Response `200 OK`:

```json
{
  "id": 1,
  "title": "맥북 팝니다",
  "description": "상태 좋습니다.",
  "price": 900000,
  "imageUrls": ["https://example.com/product-1.jpg"],
  "status": "ON_SALE",
  "seller": {
    "id": 1,
    "nickname": "홍길동"
  },
  "createdAt": "2026-04-15T12:00:00.000Z",
  "updatedAt": "2026-04-15T12:00:00.000Z"
}
```

### 4.4 상품 등록

```http
POST /api/products
```

인증: 필요

Request Body:

```json
{
  "title": "맥북 팝니다",
  "description": "상태 좋습니다.",
  "price": 900000,
  "imageUrls": ["https://example.com/product-1.jpg"]
}
```

Response `201 Created`:

```json
{
  "id": 1,
  "title": "맥북 팝니다",
  "description": "상태 좋습니다.",
  "price": 900000,
  "imageUrls": ["https://example.com/product-1.jpg"],
  "status": "ON_SALE",
  "sellerId": 1,
  "createdAt": "2026-04-15T12:00:00.000Z",
  "updatedAt": "2026-04-15T12:00:00.000Z"
}
```

정책:

- 등록 시 기본 상태는 `ON_SALE`이다.
- 가격은 정수 원화 기준으로 저장한다.
- 이미지는 URL 문자열 배열로만 저장한다.

### 4.5 상품 수정

```http
PATCH /api/products/{productId}
```

인증: 필요

Request Body:

```json
{
  "title": "맥북 급처합니다",
  "description": "가격 내렸습니다.",
  "price": 850000,
  "imageUrls": ["https://example.com/product-1.jpg"]
}
```

Response `200 OK`:

```json
{
  "id": 1,
  "title": "맥북 급처합니다",
  "description": "가격 내렸습니다.",
  "price": 850000,
  "imageUrls": ["https://example.com/product-1.jpg"],
  "status": "ON_SALE",
  "sellerId": 1,
  "updatedAt": "2026-04-15T12:00:00.000Z"
}
```

정책:

- 판매자만 수정할 수 있다.

### 4.6 상품 삭제

```http
DELETE /api/products/{productId}
```

인증: 필요

Response `204 No Content`

정책:

- 판매자만 삭제할 수 있다.

### 4.7 상품 거래 상태 변경

```http
PATCH /api/products/{productId}/status
```

인증: 필요

Request Body:

```json
{
  "status": "RESERVED"
}
```

Response `200 OK`:

```json
{
  "id": 1,
  "status": "RESERVED",
  "updatedAt": "2026-04-15T12:00:00.000Z"
}
```

정책:

- 판매자만 상태를 변경할 수 있다.

## 5. 거래 요청 API

### 거래 요청 상태

```ts
type TradeRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
```

| 값         | 의미      |
| ---------- | --------- |
| `PENDING`  | 요청 대기 |
| `ACCEPTED` | 수락      |
| `REJECTED` | 거절      |

### 5.1 거래 요청 생성

```http
POST /api/products/{productId}/trade-requests
```

인증: 필요

Request Body:

```json
{
  "message": "구매하고 싶습니다."
}
```

Response `201 Created`:

```json
{
  "id": 1,
  "productId": 1,
  "buyerId": 2,
  "sellerId": 1,
  "message": "구매하고 싶습니다.",
  "status": "PENDING",
  "createdAt": "2026-04-15T12:00:00.000Z"
}
```

정책:

- 구매자는 자신의 상품에 거래 요청할 수 없다.
- 같은 구매자가 같은 상품에 중복 `PENDING` 거래 요청을 만들 수 없다.
- 상품이 `SOLD` 상태이면 거래 요청할 수 없다.

### 5.2 상품별 거래 요청 목록 조회

```http
GET /api/products/{productId}/trade-requests?page=1&limit=20
```

인증: 필요

Response `200 OK`:

```json
{
  "items": [
    {
      "id": 1,
      "productId": 1,
      "buyer": {
        "id": 2,
        "nickname": "구매자"
      },
      "message": "구매하고 싶습니다.",
      "status": "PENDING",
      "createdAt": "2026-04-15T12:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

정책:

- 상품 판매자만 해당 상품의 거래 요청 목록을 볼 수 있다.

### 5.3 거래 요청 수락

```http
PATCH /api/trade-requests/{tradeRequestId}/accept
```

인증: 필요

Response `200 OK`:

```json
{
  "id": 1,
  "status": "ACCEPTED",
  "product": {
    "id": 1,
    "status": "RESERVED"
  },
  "updatedAt": "2026-04-15T12:00:00.000Z"
}
```

정책:

- 상품 판매자만 수락할 수 있다.
- 요청 상태가 `PENDING`일 때만 수락할 수 있다.
- 거래 요청이 수락되면 상품 상태는 `RESERVED`로 변경된다.
- 같은 상품의 다른 `PENDING` 요청은 자동 거절하지 않는다.

### 5.4 거래 요청 거절

```http
PATCH /api/trade-requests/{tradeRequestId}/reject
```

인증: 필요

Response `200 OK`:

```json
{
  "id": 1,
  "status": "REJECTED",
  "updatedAt": "2026-04-15T12:00:00.000Z"
}
```

정책:

- 상품 판매자만 거절할 수 있다.
- 요청 상태가 `PENDING`일 때만 거절할 수 있다.

### 5.5 내가 보낸 거래 요청 목록

```http
GET /api/trade-requests/me?page=1&limit=20
```

인증: 필요

Response `200 OK`:

```json
{
  "items": [
    {
      "id": 1,
      "product": {
        "id": 1,
        "title": "맥북 팝니다",
        "price": 900000,
        "status": "RESERVED"
      },
      "message": "구매하고 싶습니다.",
      "status": "ACCEPTED",
      "createdAt": "2026-04-15T12:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

## 6. 채팅 API

### 6.1 채팅방 생성 또는 기존 방 반환

```http
POST /api/chats
```

인증: 필요

Request Body:

```json
{
  "productId": 1,
  "receiverId": 2
}
```

Response `201 Created` 또는 `200 OK`:

```json
{
  "id": 1,
  "productId": 1,
  "buyerId": 2,
  "sellerId": 1,
  "createdAt": "2026-04-15T12:00:00.000Z"
}
```

정책:

- 상품 판매자와 구매자 사이의 1대1 채팅방을 생성한다.
- 같은 `productId + buyerId + sellerId` 조합의 채팅방은 중복 생성하지 않는다.
- 이미 존재하는 채팅방이면 기존 채팅방을 반환한다.
- `sellerId`는 상품의 판매자 ID로 고정한다.
- 로그인 사용자가 상품 판매자이면 `receiverId`가 구매자가 되고, 로그인 사용자가 판매자가 아니면 로그인 사용자가 구매자가 된다.
- `receiverId`는 로그인 사용자와 같을 수 없다.

### 6.2 내 채팅방 목록

```http
GET /api/chats?page=1&limit=20
```

인증: 필요

Response `200 OK`:

```json
{
  "items": [
    {
      "id": 1,
      "product": {
        "id": 1,
        "title": "맥북 팝니다",
        "price": 900000
      },
      "buyer": {
        "id": 2,
        "nickname": "구매자"
      },
      "seller": {
        "id": 1,
        "nickname": "홍길동"
      },
      "lastMessage": {
        "id": 10,
        "content": "아직 구매 가능할까요?",
        "createdAt": "2026-04-15T12:00:00.000Z"
      },
      "createdAt": "2026-04-15T12:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

정책:

- 로그인 사용자가 구매자 또는 판매자로 참여한 채팅방만 조회된다.

### 6.3 채팅 메시지 조회

```http
GET /api/chats/{chatRoomId}/messages?page=1&limit=20
```

인증: 필요

Response `200 OK`:

```json
{
  "items": [
    {
      "id": 1,
      "chatRoomId": 1,
      "sender": {
        "id": 2,
        "nickname": "구매자"
      },
      "content": "아직 구매 가능할까요?",
      "isDeleted": false,
      "editedAt": null,
      "createdAt": "2026-04-15T12:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

정책:

- 채팅방 참여자만 메시지를 조회할 수 있다.
- 삭제된 메시지는 내용 대신 `"삭제된 메시지입니다."`로 응답한다.

### 6.4 메시지 등록

```http
POST /api/chats/{chatRoomId}/messages
```

인증: 필요

Request Body:

```json
{
  "content": "아직 구매 가능할까요?"
}
```

Response `201 Created`:

```json
{
  "id": 1,
  "chatRoomId": 1,
  "senderId": 2,
  "content": "아직 구매 가능할까요?",
  "isDeleted": false,
  "editedAt": null,
  "createdAt": "2026-04-15T12:00:00.000Z"
}
```

정책:

- 채팅방 참여자만 메시지를 등록할 수 있다.
- 빈 문자열은 등록할 수 없다.

### 6.5 메시지 수정

```http
PATCH /api/chats/{chatRoomId}/messages/{messageId}
```

인증: 필요

Request Body:

```json
{
  "content": "혹시 오늘 거래 가능할까요?"
}
```

Response `200 OK`:

```json
{
  "id": 1,
  "chatRoomId": 1,
  "senderId": 2,
  "content": "혹시 오늘 거래 가능할까요?",
  "isDeleted": false,
  "editedAt": "2026-04-15T12:00:00.000Z",
  "createdAt": "2026-04-15T12:00:00.000Z"
}
```

정책:

- 작성자만 메시지를 수정할 수 있다.
- 삭제된 메시지는 수정할 수 없다.

### 6.6 메시지 삭제

```http
DELETE /api/chats/{chatRoomId}/messages/{messageId}
```

인증: 필요

Response `204 No Content`

정책:

- 작성자만 메시지를 삭제할 수 있다.
- 물리 삭제하지 않고 `deletedAt`과 `isDeleted`를 사용한다.

## 7. 데이터 모델

### User

| 컬럼              | 타입      | 설명                  |
| ----------------- | --------- | --------------------- |
| `id`              | bigint    | 사용자 ID             |
| `email`           | varchar   | 이메일, unique        |
| `passwordHash`    | varchar   | 해시된 비밀번호       |
| `nickname`        | varchar   | 닉네임                |
| `emailVerifiedAt` | timestamp | 이메일 인증 완료 시각 |
| `createdAt`       | timestamp | 생성 시각             |
| `updatedAt`       | timestamp | 수정 시각             |

### EmailVerification

| 컬럼         | 타입               | 설명             |
| ------------ | ------------------ | ---------------- |
| `id`         | bigint             | 인증 ID          |
| `email`      | varchar            | 이메일           |
| `codeHash`   | varchar            | 해시된 인증 코드 |
| `expiresAt`  | timestamp          | 만료 시각        |
| `verifiedAt` | timestamp nullable | 인증 완료 시각   |
| `tokenHash`  | varchar nullable   | 해시된 이메일 인증 토큰 |
| `tokenExpiresAt` | timestamp nullable | 이메일 인증 토큰 만료 시각 |
| `tokenUsedAt` | timestamp nullable | 이메일 인증 토큰 사용 시각 |
| `createdAt`  | timestamp          | 생성 시각        |

### RefreshToken

| 컬럼                | 타입               | 설명                         |
| ------------------- | ------------------ | ---------------------------- |
| `id`                | bigint             | 토큰 ID                      |
| `userId`            | bigint             | 사용자 ID                    |
| `tokenHash`         | varchar            | 해시된 refreshToken          |
| `tokenFamilyId`     | uuid               | RFR 토큰 패밀리 ID           |
| `replacedByTokenId` | bigint nullable    | 재발급으로 교체된 새 토큰 ID |
| `expiresAt`         | timestamp          | 만료 시각                    |
| `revokedAt`         | timestamp nullable | 폐기 시각                    |
| `reuseDetectedAt`   | timestamp nullable | 폐기된 토큰 재사용 감지 시각 |
| `createdAt`         | timestamp          | 생성 시각                    |

### Product

| 컬럼          | 타입                  | 설명                          |
| ------------- | --------------------- | ----------------------------- |
| `id`          | bigint                | 상품 ID                       |
| `sellerId`    | bigint                | 판매자 ID                     |
| `title`       | varchar               | 제목                          |
| `description` | text                  | 설명                          |
| `price`       | integer               | 가격                          |
| `imageUrls`   | text array 또는 jsonb | 이미지 URL 목록               |
| `status`      | enum                  | `ON_SALE`, `RESERVED`, `SOLD` |
| `createdAt`   | timestamp             | 생성 시각                     |
| `updatedAt`   | timestamp             | 수정 시각                     |

### TradeRequest

| 컬럼        | 타입      | 설명                                          |
| ----------- | --------- | --------------------------------------------- |
| `id`        | bigint    | 거래 요청 ID                                  |
| `productId` | bigint    | 상품 ID                                       |
| `buyerId`   | bigint    | 구매자 ID                                     |
| `sellerId`  | bigint    | 판매자 ID                                     |
| `message`   | text      | 요청 메시지                                   |
| `status`    | enum      | `PENDING`, `ACCEPTED`, `REJECTED` |
| `createdAt` | timestamp | 생성 시각                                     |
| `updatedAt` | timestamp | 수정 시각                                     |

### ChatRoom

| 컬럼        | 타입      | 설명      |
| ----------- | --------- | --------- |
| `id`        | bigint    | 채팅방 ID |
| `productId` | bigint    | 상품 ID   |
| `buyerId`   | bigint    | 구매자 ID |
| `sellerId`  | bigint    | 판매자 ID |
| `createdAt` | timestamp | 생성 시각 |
| `updatedAt` | timestamp | 수정 시각 |

### ChatMessage

| 컬럼         | 타입               | 설명        |
| ------------ | ------------------ | ----------- |
| `id`         | bigint             | 메시지 ID   |
| `chatRoomId` | bigint             | 채팅방 ID   |
| `senderId`   | bigint             | 발신자 ID   |
| `content`    | text               | 메시지 내용 |
| `isDeleted`  | boolean            | 삭제 여부   |
| `editedAt`   | timestamp nullable | 수정 시각   |
| `deletedAt`  | timestamp nullable | 삭제 시각   |
| `createdAt`  | timestamp          | 생성 시각   |
| `updatedAt`  | timestamp          | 수정 시각   |

## 8. 주요 검증 규칙

- 이메일은 중복 가입할 수 없다.
- 이메일 인증 코드는 10분 뒤 만료된다.
- 비밀번호는 최소 8자 이상이어야 한다.
- 상품 수정, 삭제, 상태 변경은 판매자만 가능하다.
- 구매자는 자신의 상품에 거래 요청할 수 없다.
- 같은 구매자가 같은 상품에 중복 `PENDING` 거래 요청을 만들 수 없다.
- 상품 판매자만 거래 요청을 수락하거나 거절할 수 있다.
- 거래 요청 수락 시 상품 상태는 `RESERVED`로 변경된다.
- 채팅방은 같은 `productId + buyerId + sellerId` 조합으로 중복 생성하지 않는다.
- 채팅방 참여자만 메시지를 조회하거나 등록할 수 있다.
- 메시지 수정과 삭제는 작성자만 가능하다.
- 삭제된 메시지는 물리 삭제하지 않고 `"삭제된 메시지입니다."`로 응답한다.

## 9. 테스트 시나리오

### Auth

- 이메일 인증 코드 발송 성공
- 중복 이메일 인증 코드 발송 실패
- 이메일 인증 성공
- 잘못된 코드 또는 만료된 코드 검증 실패
- 이메일 인증 후 회원가입 성공
- 이메일 인증 없이 회원가입 실패
- 로그인 성공
- refreshToken으로 accessToken 재발급 성공
- 로그아웃 후 refreshToken 재사용 실패

### Products

- 상품 등록 성공
- 상품 리스트가 `id`, `title`, `price`만 반환하는지 확인
- 상품 상세 조회 성공
- 판매자 상품 수정 성공
- 판매자가 아닌 사용자의 상품 수정 실패
- 판매자 상품 삭제 성공
- 판매자가 아닌 사용자의 상품 삭제 실패
- 판매자 상품 상태 변경 성공

### Search

- 제목 keyword 검색 성공
- 최소 가격 필터 검색 성공
- 최대 가격 필터 검색 성공
- 상품 상태 필터 검색 성공
- keyword, 가격 범위, status 조합 검색 성공
- 페이지네이션 기본값 확인

### Trade Requests

- 거래 요청 생성 성공
- 자신의 상품에 거래 요청 실패
- 같은 상품에 중복 `PENDING` 요청 실패
- 판매자 거래 요청 목록 조회 성공
- 판매자가 아닌 사용자의 거래 요청 목록 조회 실패
- 거래 요청 수락 성공
- 수락 시 상품 상태가 `RESERVED`로 변경되는지 확인
- 거래 요청 거절 성공
- `PENDING`이 아닌 요청 수락 또는 거절 실패
- 내가 보낸 거래 요청 목록 조회 성공

### Chat

- 채팅방 생성 성공
- 같은 조건으로 채팅방 생성 시 기존 방 반환
- 내 채팅방 목록 조회 성공
- 채팅방 참여자 메시지 조회 성공
- 채팅방 미참여자 메시지 조회 실패
- 메시지 등록 성공
- 작성자 메시지 수정 성공
- 작성자가 아닌 사용자의 메시지 수정 실패
- 작성자 메시지 삭제 성공
- 삭제된 메시지가 `"삭제된 메시지입니다."`로 응답되는지 확인

## 10. QA용 엔드포인트별 Response / Error

이 섹션은 QA에서 각 API의 성공 응답과 주요 실패 응답을 바로 확인하기 위한 요약이다. 에러 응답의 `timestamp`, `path`는 실제 요청 시각과 요청 경로로 내려간다.

### 10.1 `POST /api/auth/signup/email-code`

Success `201 Created`:

```json
{
  "message": "인증 코드가 발송되었습니다."
}
```

Errors:

```json
{
  "statusCode": 400,
  "code": "INVALID_EMAIL_CODE_REQUEST_EMAIL",
  "message": "이메일 형식이 올바르지 않습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/auth/signup/email-code"
}
```

```json
{
  "statusCode": 409,
  "code": "EMAIL_ALREADY_EXISTS",
  "message": "이미 가입된 이메일입니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/auth/signup/email-code"
}
```

### 10.2 `POST /api/auth/signup/email-code/verify`

Success `200 OK`:

```json
{
  "emailVerificationToken": "verified-token"
}
```

Errors:

```json
{
  "statusCode": 400,
  "code": "INVALID_EMAIL_CODE",
  "message": "이메일 인증 코드가 올바르지 않습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/auth/signup/email-code/verify"
}
```

```json
{
  "statusCode": 400,
  "code": "EXPIRED_EMAIL_CODE",
  "message": "이메일 인증 코드가 만료되었습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/auth/signup/email-code/verify"
}
```

### 10.3 `POST /api/auth/signup`

Success `201 Created`:

```json
{
  "id": 1,
  "email": "user@example.com",
  "nickname": "홍길동",
  "emailVerifiedAt": "2026-04-15T12:00:00.000Z"
}
```

Errors:

```json
{
  "statusCode": 400,
  "code": "INVALID_SIGNUP_EMAIL",
  "message": "이메일 형식이 올바르지 않습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/auth/signup"
}
```

```json
{
  "statusCode": 400,
  "code": "INVALID_SIGNUP_PASSWORD",
  "message": "비밀번호는 최소 8자 이상이어야 합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/auth/signup"
}
```

```json
{
  "statusCode": 400,
  "code": "INVALID_SIGNUP_NICKNAME",
  "message": "닉네임은 필수입니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/auth/signup"
}
```

```json
{
  "statusCode": 400,
  "code": "MISSING_EMAIL_VERIFICATION_TOKEN",
  "message": "이메일 인증 토큰은 필수입니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/auth/signup"
}
```

```json
{
  "statusCode": 400,
  "code": "INVALID_EMAIL_VERIFICATION_TOKEN",
  "message": "이메일 인증 토큰이 올바르지 않습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/auth/signup"
}
```

```json
{
  "statusCode": 400,
  "code": "EXPIRED_EMAIL_VERIFICATION_TOKEN",
  "message": "이메일 인증 토큰이 만료되었습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/auth/signup"
}
```

```json
{
  "statusCode": 400,
  "code": "USED_EMAIL_VERIFICATION_TOKEN",
  "message": "이미 사용된 이메일 인증 토큰입니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/auth/signup"
}
```

```json
{
  "statusCode": 400,
  "code": "EMAIL_VERIFICATION_EMAIL_MISMATCH",
  "message": "이메일 인증 토큰의 이메일과 요청 이메일이 일치하지 않습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/auth/signup"
}
```

```json
{
  "statusCode": 409,
  "code": "EMAIL_ALREADY_EXISTS",
  "message": "이미 가입된 이메일입니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/auth/signup"
}
```

### 10.4 `POST /api/auth/login`

Success `200 OK`:

```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "홍길동"
  }
}
```

Errors:

```json
{
  "statusCode": 400,
  "code": "INVALID_LOGIN_EMAIL",
  "message": "이메일 형식이 올바르지 않습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/auth/login"
}
```

```json
{
  "statusCode": 400,
  "code": "MISSING_LOGIN_PASSWORD",
  "message": "비밀번호는 필수입니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/auth/login"
}
```

```json
{
  "statusCode": 401,
  "code": "INVALID_CREDENTIALS",
  "message": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/auth/login"
}
```

### 10.5 `POST /api/auth/refresh`

Success `200 OK`:

```json
{
  "accessToken": "new-jwt-access-token",
  "refreshToken": "new-jwt-refresh-token"
}
```

Errors:

```json
{
  "statusCode": 401,
  "code": "INVALID_REFRESH_TOKEN",
  "message": "refreshToken이 올바르지 않습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/auth/refresh"
}
```

```json
{
  "statusCode": 401,
  "code": "EXPIRED_REFRESH_TOKEN",
  "message": "refreshToken이 만료되었습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/auth/refresh"
}
```

```json
{
  "statusCode": 401,
  "code": "REFRESH_TOKEN_REUSE_DETECTED",
  "message": "폐기된 refreshToken입니다. 다시 로그인해주세요.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/auth/refresh"
}
```

### 10.6 `POST /api/auth/logout`

Success `204 No Content`

Errors:

```json
{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "로그아웃하려면 인증이 필요합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/auth/logout"
}
```

```json
{
  "statusCode": 401,
  "code": "INVALID_REFRESH_TOKEN",
  "message": "refreshToken이 올바르지 않습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/auth/logout"
}
```

### 10.7 `GET /api/users/me`

Success `200 OK`:

```json
{
  "id": 1,
  "email": "user@example.com",
  "nickname": "홍길동",
  "emailVerifiedAt": "2026-04-15T12:00:00.000Z",
  "createdAt": "2026-04-15T12:00:00.000Z"
}
```

Errors:

```json
{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "내 정보를 조회하려면 인증이 필요합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/users/me"
}
```

### 10.8 `GET /api/users/me/products`

Success `200 OK`:

```json
{
  "items": [
    {
      "id": 1,
      "title": "맥북 팝니다",
      "price": 900000,
      "status": "ON_SALE",
      "createdAt": "2026-04-15T12:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

Errors:

```json
{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "내 상품 목록을 조회하려면 인증이 필요합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/users/me/products"
}
```

### 10.9 `GET /api/products`

Success `200 OK`:

```json
{
  "items": [
    {
      "id": 1,
      "title": "맥북 팝니다",
      "price": 900000
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

Errors:

```json
{
  "statusCode": 400,
  "code": "INVALID_PRODUCTS_PAGE",
  "message": "page는 1 이상의 숫자여야 합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products"
}
```

```json
{
  "statusCode": 400,
  "code": "INVALID_PRODUCTS_LIMIT",
  "message": "상품 개수는 1 이상 100 이하의 숫자여야 합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products"
}
```

### 10.10 `GET /api/products/search`

Success `200 OK`:

```json
{
  "items": [
    {
      "id": 1,
      "title": "맥북 팝니다",
      "price": 900000
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

Errors:

```json
{
  "statusCode": 400,
  "code": "INVALID_SEARCH_STATUS",
  "message": "상품의 상태는 판매중, 예약중, 거래완료 중 하나여야 합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/search"
}
```

```json
{
  "statusCode": 400,
  "code": "INVALID_SEARCH_MIN_PRICE",
  "message": "minPrice는 0 이상의 정수여야 합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/search"
}
```

```json
{
  "statusCode": 400,
  "code": "INVALID_SEARCH_MAX_PRICE",
  "message": "maxPrice는 0 이상의 정수여야 합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/search"
}
```

```json
{
  "statusCode": 400,
  "code": "INVALID_SEARCH_PRICE_RANGE",
  "message": "minPrice는 maxPrice보다 클 수 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/search"
}
```

### 10.11 `GET /api/products/{productId}`

Success `200 OK`:

```json
{
  "id": 1,
  "title": "맥북 팝니다",
  "description": "상태 좋습니다.",
  "price": 900000,
  "imageUrls": ["https://example.com/product-1.jpg"],
  "status": "ON_SALE",
  "seller": {
    "id": 1,
    "nickname": "홍길동"
  },
  "createdAt": "2026-04-15T12:00:00.000Z",
  "updatedAt": "2026-04-15T12:00:00.000Z"
}
```

Errors:

```json
{
  "statusCode": 404,
  "code": "PRODUCT_NOT_FOUND",
  "message": "상품을 찾을 수 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/999"
}
```

### 10.12 `POST /api/products`

Success `201 Created`:

```json
{
  "id": 1,
  "title": "맥북 팝니다",
  "description": "상태 좋습니다.",
  "price": 900000,
  "imageUrls": ["https://example.com/product-1.jpg"],
  "status": "ON_SALE",
  "sellerId": 1,
  "createdAt": "2026-04-15T12:00:00.000Z",
  "updatedAt": "2026-04-15T12:00:00.000Z"
}
```

Errors:

```json
{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "상품을 등록하려면 인증이 필요합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products"
}
```

```json
{
  "statusCode": 400,
  "code": "MISSING_PRODUCT_TITLE",
  "message": "상품 제목은 필수입니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products"
}
```

```json
{
  "statusCode": 400,
  "code": "INVALID_PRODUCT_PRICE",
  "message": "상품 가격은 0 이상의 정수여야 합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products"
}
```

```json
{
  "statusCode": 400,
  "code": "INVALID_PRODUCT_IMAGE_URLS",
  "message": "상품 이미지 URL 형식이 올바르지 않습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products"
}
```

### 10.13 `PATCH /api/products/{productId}`

Success `200 OK`:

```json
{
  "id": 1,
  "title": "맥북 급처합니다",
  "description": "가격 내렸습니다.",
  "price": 850000,
  "imageUrls": ["https://example.com/product-1.jpg"],
  "status": "ON_SALE",
  "sellerId": 1,
  "updatedAt": "2026-04-15T12:00:00.000Z"
}
```

Errors:

```json
{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "상품을 수정하려면 인증이 필요합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/1"
}
```

```json
{
  "statusCode": 403,
  "code": "FORBIDDEN",
  "message": "상품을 수정할 권한이 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/1"
}
```

```json
{
  "statusCode": 404,
  "code": "PRODUCT_NOT_FOUND",
  "message": "상품을 찾을 수 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/999"
}
```

### 10.14 `DELETE /api/products/{productId}`

Success `204 No Content`

Errors:

```json
{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "상품을 삭제하려면 인증이 필요합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/1"
}
```

```json
{
  "statusCode": 403,
  "code": "FORBIDDEN",
  "message": "상품을 삭제할 권한이 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/1"
}
```

```json
{
  "statusCode": 404,
  "code": "PRODUCT_NOT_FOUND",
  "message": "상품을 찾을 수 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/999"
}
```

### 10.15 `PATCH /api/products/{productId}/status`

Success `200 OK`:

```json
{
  "id": 1,
  "status": "RESERVED",
  "updatedAt": "2026-04-15T12:00:00.000Z"
}
```

Errors:

```json
{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "상품 상태를 변경하려면 인증이 필요합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/1/status"
}
```

```json
{
  "statusCode": 400,
  "code": "INVALID_PRODUCT_STATUS",
  "message": "상품 상태값이 올바르지 않습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/1/status"
}
```

```json
{
  "statusCode": 403,
  "code": "FORBIDDEN",
  "message": "상품 상태를 변경할 권한이 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/1/status"
}
```

```json
{
  "statusCode": 404,
  "code": "PRODUCT_NOT_FOUND",
  "message": "상품을 찾을 수 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/999/status"
}
```

### 10.16 `POST /api/products/{productId}/trade-requests`

Success `201 Created`:

```json
{
  "id": 1,
  "productId": 1,
  "buyerId": 2,
  "sellerId": 1,
  "message": "구매하고 싶습니다.",
  "status": "PENDING",
  "createdAt": "2026-04-15T12:00:00.000Z"
}
```

Errors:

```json
{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "거래 요청을 등록하려면 인증이 필요합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/1/trade-requests"
}
```

```json
{
  "statusCode": 404,
  "code": "PRODUCT_NOT_FOUND",
  "message": "상품을 찾을 수 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/999/trade-requests"
}
```

```json
{
  "statusCode": 409,
  "code": "SELF_TRADE_NOT_ALLOWED",
  "message": "자신의 상품에는 거래 요청할 수 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/1/trade-requests"
}
```

```json
{
  "statusCode": 409,
  "code": "DUPLICATE_PENDING_TRADE_REQUEST",
  "message": "이미 대기 중인 거래 요청이 있습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/1/trade-requests"
}
```

```json
{
  "statusCode": 409,
  "code": "PRODUCT_ALREADY_SOLD",
  "message": "판매 완료된 상품입니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/1/trade-requests"
}
```

### 10.17 `GET /api/products/{productId}/trade-requests`

Success `200 OK`:

```json
{
  "items": [
    {
      "id": 1,
      "productId": 1,
      "buyer": {
        "id": 2,
        "nickname": "구매자"
      },
      "message": "구매하고 싶습니다.",
      "status": "PENDING",
      "createdAt": "2026-04-15T12:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

Errors:

```json
{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "거래 요청 목록을 조회하려면 인증이 필요합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/1/trade-requests"
}
```

```json
{
  "statusCode": 403,
  "code": "FORBIDDEN",
  "message": "거래 요청 목록을 조회할 권한이 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/1/trade-requests"
}
```

```json
{
  "statusCode": 404,
  "code": "PRODUCT_NOT_FOUND",
  "message": "상품을 찾을 수 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/products/999/trade-requests"
}
```

### 10.18 `PATCH /api/trade-requests/{tradeRequestId}/accept`

Success `200 OK`:

```json
{
  "id": 1,
  "status": "ACCEPTED",
  "product": {
    "id": 1,
    "status": "RESERVED"
  },
  "updatedAt": "2026-04-15T12:00:00.000Z"
}
```

Errors:

```json
{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "거래 요청을 수락하려면 인증이 필요합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/trade-requests/1/accept"
}
```

```json
{
  "statusCode": 403,
  "code": "FORBIDDEN",
  "message": "거래 요청을 수락할 권한이 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/trade-requests/1/accept"
}
```

```json
{
  "statusCode": 404,
  "code": "TRADE_REQUEST_NOT_FOUND",
  "message": "거래 요청을 찾을 수 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/trade-requests/999/accept"
}
```

```json
{
  "statusCode": 400,
  "code": "INVALID_TRADE_REQUEST_STATUS",
  "message": "PENDING 상태의 거래 요청만 수락할 수 있습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/trade-requests/1/accept"
}
```

### 10.19 `PATCH /api/trade-requests/{tradeRequestId}/reject`

Success `200 OK`:

```json
{
  "id": 1,
  "status": "REJECTED",
  "updatedAt": "2026-04-15T12:00:00.000Z"
}
```

Errors:

```json
{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "거래 요청을 거절하려면 인증이 필요합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/trade-requests/1/reject"
}
```

```json
{
  "statusCode": 403,
  "code": "FORBIDDEN",
  "message": "거래 요청을 거절할 권한이 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/trade-requests/1/reject"
}
```

```json
{
  "statusCode": 404,
  "code": "TRADE_REQUEST_NOT_FOUND",
  "message": "거래 요청을 찾을 수 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/trade-requests/999/reject"
}
```

```json
{
  "statusCode": 400,
  "code": "INVALID_TRADE_REQUEST_STATUS",
  "message": "PENDING 상태의 거래 요청만 거절할 수 있습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/trade-requests/1/reject"
}
```

### 10.20 `GET /api/trade-requests/me`

Success `200 OK`:

```json
{
  "items": [
    {
      "id": 1,
      "product": {
        "id": 1,
        "title": "맥북 팝니다",
        "price": 900000,
        "status": "RESERVED"
      },
      "message": "구매하고 싶습니다.",
      "status": "ACCEPTED",
      "createdAt": "2026-04-15T12:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

Errors:

```json
{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "내 거래 요청 목록을 조회하려면 인증이 필요합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/trade-requests/me"
}
```

### 10.21 `POST /api/chats`

Success `201 Created`:

```json
{
  "id": 1,
  "productId": 1,
  "buyerId": 2,
  "sellerId": 1,
  "createdAt": "2026-04-15T12:00:00.000Z"
}
```

Success `200 OK` when existing room is returned:

```json
{
  "id": 1,
  "productId": 1,
  "buyerId": 2,
  "sellerId": 1,
  "createdAt": "2026-04-15T12:00:00.000Z"
}
```

Errors:

```json
{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "채팅방을 생성하려면 인증이 필요합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/chats"
}
```

```json
{
  "statusCode": 400,
  "code": "MISSING_CHAT_PRODUCT_ID",
  "message": "거래할 상품을 선택해주세요.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/chats"
}
```

```json
{
  "statusCode": 400,
  "code": "MISSING_CHAT_RECEIVER_ID",
  "message": "채팅 상대를 선택해주세요.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/chats"
}
```

```json
{
  "statusCode": 400,
  "code": "INVALID_CHAT_RECEIVER_ID",
  "message": "채팅 상대의 정보가 올바르지 않습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/chats"
}
```

```json
{
  "statusCode": 404,
  "code": "PRODUCT_NOT_FOUND",
  "message": "상품을 찾을 수 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/chats"
}
```

```json
{
  "statusCode": 409,
  "code": "SELF_TRADE_NOT_ALLOWED",
  "message": "자기 자신과 채팅방을 만들 수 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/chats"
}
```

### 10.22 `GET /api/chats`

Success `200 OK`:

```json
{
  "items": [
    {
      "id": 1,
      "product": {
        "id": 1,
        "title": "맥북 팝니다",
        "price": 900000
      },
      "buyer": {
        "id": 2,
        "nickname": "구매자"
      },
      "seller": {
        "id": 1,
        "nickname": "홍길동"
      },
      "lastMessage": {
        "id": 10,
        "content": "아직 구매 가능할까요?",
        "createdAt": "2026-04-15T12:00:00.000Z"
      },
      "createdAt": "2026-04-15T12:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

Errors:

```json
{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "채팅방 목록을 조회하려면 인증이 필요합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/chats"
}
```

### 10.23 `GET /api/chats/{chatRoomId}/messages`

Success `200 OK`:

```json
{
  "items": [
    {
      "id": 1,
      "chatRoomId": 1,
      "sender": {
        "id": 2,
        "nickname": "구매자"
      },
      "content": "아직 구매 가능할까요?",
      "isDeleted": false,
      "editedAt": null,
      "createdAt": "2026-04-15T12:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

Deleted message item:

```json
{
  "id": 2,
  "chatRoomId": 1,
  "sender": {
    "id": 1,
    "nickname": "홍길동"
  },
  "content": "삭제된 메시지입니다.",
  "isDeleted": true,
  "editedAt": null,
  "createdAt": "2026-04-15T12:01:00.000Z"
}
```

Errors:

```json
{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "채팅 메시지를 조회하려면 인증이 필요합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/chats/1/messages"
}
```

```json
{
  "statusCode": 403,
  "code": "FORBIDDEN",
  "message": "채팅방 메시지를 조회할 권한이 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/chats/1/messages"
}
```

```json
{
  "statusCode": 404,
  "code": "CHAT_ROOM_NOT_FOUND",
  "message": "채팅방을 찾을 수 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/chats/999/messages"
}
```

### 10.24 `POST /api/chats/{chatRoomId}/messages`

Success `201 Created`:

```json
{
  "id": 1,
  "chatRoomId": 1,
  "senderId": 2,
  "content": "아직 구매 가능할까요?",
  "isDeleted": false,
  "editedAt": null,
  "createdAt": "2026-04-15T12:00:00.000Z"
}
```

Errors:

```json
{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "메시지를 등록하려면 인증이 필요합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/chats/1/messages"
}
```

```json
{
  "statusCode": 400,
  "code": "INVALID_CHAT_MESSAGE",
  "message": "메시지 내용이 올바르지 않습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/chats/1/messages"
}
```

```json
{
  "statusCode": 403,
  "code": "FORBIDDEN",
  "message": "채팅방에 메시지를 등록할 권한이 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/chats/1/messages"
}
```

```json
{
  "statusCode": 404,
  "code": "CHAT_ROOM_NOT_FOUND",
  "message": "채팅방을 찾을 수 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/chats/999/messages"
}
```

### 10.25 `PATCH /api/chats/{chatRoomId}/messages/{messageId}`

Success `200 OK`:

```json
{
  "id": 1,
  "chatRoomId": 1,
  "senderId": 2,
  "content": "혹시 오늘 거래 가능할까요?",
  "isDeleted": false,
  "editedAt": "2026-04-15T12:00:00.000Z",
  "createdAt": "2026-04-15T12:00:00.000Z"
}
```

Errors:

```json
{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "메시지를 수정하려면 인증이 필요합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/chats/1/messages/1"
}
```

```json
{
  "statusCode": 400,
  "code": "INVALID_CHAT_MESSAGE",
  "message": "삭제된 메시지는 수정할 수 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/chats/1/messages/1"
}
```

```json
{
  "statusCode": 403,
  "code": "FORBIDDEN",
  "message": "메시지를 수정할 권한이 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/chats/1/messages/1"
}
```

```json
{
  "statusCode": 404,
  "code": "CHAT_MESSAGE_NOT_FOUND",
  "message": "메시지를 찾을 수 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/chats/1/messages/999"
}
```

### 10.26 `DELETE /api/chats/{chatRoomId}/messages/{messageId}`

Success `204 No Content`

Errors:

```json
{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "메시지를 삭제하려면 인증이 필요합니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/chats/1/messages/1"
}
```

```json
{
  "statusCode": 403,
  "code": "FORBIDDEN",
  "message": "메시지를 삭제할 권한이 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/chats/1/messages/1"
}
```

```json
{
  "statusCode": 404,
  "code": "CHAT_MESSAGE_NOT_FOUND",
  "message": "메시지를 찾을 수 없습니다.",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "path": "/api/chats/1/messages/999"
}
```

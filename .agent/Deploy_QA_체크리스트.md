# Deploy QA 체크리스트

## 목적

이 문서는 자동 테스트로 끝나지 않는 실제 배포 환경 검증 항목을 정리한다.

대상 환경:

- AWS EC2
- Nginx
- PM2
- Supabase
- SMTP
- WebSocket

---

## 1. 서버 가용성

- EC2 인스턴스가 실행 중이다.
- PM2에서 `wwt-be` 프로세스가 `online` 상태다.
- Nginx가 정상 실행 중이다.
- 외부 브라우저에서 `http://<server>/api/products` 호출 시 응답이 온다.

## 2. Auth

- `signup/email-code` 요청이 정상 동작한다.
- `signup/email-code/verify`가 정상 동작한다.
- `signup`이 정상 동작한다.
- `login` 성공 후 access token으로 보호 API를 호출할 수 있다.
- `refresh`가 정상 동작한다.
- `logout` 후 기존 refresh token은 더 이상 동작하지 않는다.

## 3. Users

- `GET /api/users/me`가 정상 응답한다.
- `GET /api/users/me/products`가 정상 응답한다.

## 4. Products

- 상품 목록 조회
- 상품 검색
- 상품 상세 조회
- 상품 등록
- 상품 수정
- 상품 삭제
- 상품 상태 변경

각 단계에서 권한 없는 사용자의 요청이 적절히 차단되는지도 함께 확인한다.

## 5. Trade Requests

- 거래 요청 생성
- 판매자의 거래 요청 목록 조회
- 거래 요청 수락
- 거래 요청 거절
- 내 거래 요청 목록 조회
- 수락 후 상품 상태가 `RESERVED`로 바뀌는지 확인

## 6. Chats REST

- 채팅방 생성
- 채팅방 목록 조회
- 메시지 목록 조회
- 메시지 전송
- 메시지 수정
- 메시지 삭제

## 7. Chats WebSocket

- 유효한 토큰으로 연결 가능
- 참여자가 아닌 경우 join 차단
- 메시지 생성 이벤트 수신
- 메시지 수정 이벤트 수신
- 메시지 삭제 이벤트 수신

## 8. 운영 환경 검증

- CORS 허용 도메인에서 API 호출 가능
- SMTP 실제 발송 가능
- 서버 재부팅 후 PM2 자동 복구
- Nginx reverse proxy 지속 동작

## 9. 최종 응답 품질 확인

- `/` 같은 비도메인 경로가 generic 404로 응답한다.
- 공통 에러 응답 형식이 문서와 일치한다.
- 주요 API 성공 응답 구조가 문서와 다르지 않다.

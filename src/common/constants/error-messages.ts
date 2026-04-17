import { ERROR_CODES, type ErrorCode } from './error-codes';

export const DEFAULT_ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.INVALID_SIGNUP_EMAIL]: '이메일 형식이 올바르지 않습니다.',
  [ERROR_CODES.INVALID_SIGNUP_PASSWORD]: '비밀번호는 최소 8자 이상이어야 합니다.',
  [ERROR_CODES.INVALID_SIGNUP_NICKNAME]: '닉네임은 필수입니다.',
  [ERROR_CODES.INVALID_EMAIL_CODE_REQUEST_EMAIL]:
    '이메일 형식이 올바르지 않습니다.',
  [ERROR_CODES.MISSING_EMAIL_VERIFICATION_TOKEN]:
    '이메일 인증 토큰은 필수입니다.',
  [ERROR_CODES.INVALID_EMAIL_CODE]: '이메일 인증 코드가 올바르지 않습니다.',
  [ERROR_CODES.EXPIRED_EMAIL_CODE]: '이메일 인증 코드가 만료되었습니다.',
  [ERROR_CODES.INVALID_EMAIL_VERIFICATION_TOKEN]:
    '이메일 인증 토큰이 올바르지 않습니다.',
  [ERROR_CODES.EXPIRED_EMAIL_VERIFICATION_TOKEN]:
    '이메일 인증 토큰이 만료되었습니다.',
  [ERROR_CODES.USED_EMAIL_VERIFICATION_TOKEN]:
    '이미 사용된 이메일 인증 토큰입니다.',
  [ERROR_CODES.EMAIL_VERIFICATION_EMAIL_MISMATCH]:
    '이메일 인증 토큰의 이메일과 요청 이메일이 일치하지 않습니다.',
  [ERROR_CODES.EMAIL_ALREADY_EXISTS]: '이미 가입된 이메일입니다.',
  [ERROR_CODES.INVALID_LOGIN_EMAIL]: '이메일 형식이 올바르지 않습니다.',
  [ERROR_CODES.MISSING_LOGIN_PASSWORD]: '비밀번호는 필수입니다.',
  [ERROR_CODES.INVALID_CREDENTIALS]: '이메일 또는 비밀번호가 올바르지 않습니다.',
  [ERROR_CODES.INVALID_REFRESH_TOKEN]: 'refreshToken이 올바르지 않습니다.',
  [ERROR_CODES.EXPIRED_REFRESH_TOKEN]: 'refreshToken이 만료되었습니다.',
  [ERROR_CODES.REFRESH_TOKEN_REUSE_DETECTED]:
    '폐기된 refreshToken입니다. 다시 로그인해주세요.',
  [ERROR_CODES.UNAUTHORIZED]: '인증이 필요합니다.',
  [ERROR_CODES.FORBIDDEN]: '요청을 수행할 권한이 없습니다.',
  [ERROR_CODES.INVALID_PRODUCTS_PAGE]: 'page는 1 이상의 숫자여야 합니다.',
  [ERROR_CODES.INVALID_PRODUCTS_LIMIT]:
    '상품 개수는 1 이상 100 이하의 숫자여야 합니다.',
  [ERROR_CODES.INVALID_SEARCH_STATUS]:
    '상품의 상태는 판매중, 예약중, 거래완료 중 하나여야 합니다.',
  [ERROR_CODES.INVALID_SEARCH_MIN_PRICE]:
    'minPrice는 0 이상의 정수여야 합니다.',
  [ERROR_CODES.INVALID_SEARCH_MAX_PRICE]:
    'maxPrice는 0 이상의 정수여야 합니다.',
  [ERROR_CODES.INVALID_SEARCH_PRICE_RANGE]:
    'minPrice는 maxPrice보다 클 수 없습니다.',
  [ERROR_CODES.MISSING_PRODUCT_TITLE]: '상품 제목은 필수입니다.',
  [ERROR_CODES.INVALID_PRODUCT_PRICE]:
    '상품 가격은 0 이상의 정수여야 합니다.',
  [ERROR_CODES.INVALID_PRODUCT_IMAGE_URLS]:
    '상품 이미지 URL 형식이 올바르지 않습니다.',
  [ERROR_CODES.INVALID_PRODUCT_STATUS]: '상품 상태값이 올바르지 않습니다.',
  [ERROR_CODES.INVALID_TRADE_REQUEST_STATUS]:
    '처리할 수 없는 거래 요청 상태입니다.',
  [ERROR_CODES.MISSING_CHAT_PRODUCT_ID]: '거래할 상품을 선택해주세요.',
  [ERROR_CODES.MISSING_CHAT_RECEIVER_ID]: '채팅 상대를 선택해주세요.',
  [ERROR_CODES.INVALID_CHAT_RECEIVER_ID]:
    '채팅 상대의 정보가 올바르지 않습니다.',
  [ERROR_CODES.INVALID_CHAT_MESSAGE]: '메시지 내용이 올바르지 않습니다.',
  [ERROR_CODES.USER_NOT_FOUND]: '사용자를 찾을 수 없습니다.',
  [ERROR_CODES.PRODUCT_NOT_FOUND]: '상품을 찾을 수 없습니다.',
  [ERROR_CODES.TRADE_REQUEST_NOT_FOUND]: '거래 요청을 찾을 수 없습니다.',
  [ERROR_CODES.CHAT_ROOM_NOT_FOUND]: '채팅방을 찾을 수 없습니다.',
  [ERROR_CODES.CHAT_MESSAGE_NOT_FOUND]: '메시지를 찾을 수 없습니다.',
  [ERROR_CODES.DUPLICATE_PENDING_TRADE_REQUEST]:
    '이미 대기 중인 거래 요청이 있습니다.',
  [ERROR_CODES.SELF_TRADE_NOT_ALLOWED]:
    '자신의 상품에는 거래 요청할 수 없습니다.',
  [ERROR_CODES.PRODUCT_ALREADY_SOLD]: '판매 완료된 상품입니다.',
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: '서버 내부 오류가 발생했습니다.',
};

export function getErrorMessage(
  code: ErrorCode,
  fallback?: string,
): string {
  return fallback ?? DEFAULT_ERROR_MESSAGES[code];
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'
}

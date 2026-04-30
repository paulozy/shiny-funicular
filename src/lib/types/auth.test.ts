import { normalizeAuthError, getErrorMessage } from './auth'

describe('normalizeAuthError', () => {
  test('normalizes handler error with error_description', () => {
    const result = normalizeAuthError({
      error: 'invalid_request',
      error_description: 'bad email format',
    })
    expect(result).toEqual({
      code: 'invalid_request',
      message: 'bad email format',
    })
  })

  test('normalizes middleware 401 with message', () => {
    const result = normalizeAuthError({
      error: 'unauthorized',
      message: 'token expired',
    })
    expect(result).toEqual({
      code: 'unauthorized',
      message: 'token expired',
    })
  })

  test('handles missing message fields', () => {
    const result = normalizeAuthError({
      error: 'authentication_failed',
    })
    expect(result.code).toBe('authentication_failed')
    expect(result.message).toBe('Erro desconhecido')
  })

  test('handles null input', () => {
    const result = normalizeAuthError(null)
    expect(result).toEqual({
      code: 'unknown_error',
      message: 'Erro desconhecido',
    })
  })

  test('handles undefined input', () => {
    const result = normalizeAuthError(undefined)
    expect(result).toEqual({
      code: 'unknown_error',
      message: 'Erro desconhecido',
    })
  })

  test('handles non-object input', () => {
    const result = normalizeAuthError('error')
    expect(result).toEqual({
      code: 'unknown_error',
      message: 'Erro desconhecido',
    })
  })

  test('truncates long messages to 200 chars', () => {
    const longMessage = 'a'.repeat(250)
    const result = normalizeAuthError({
      error: 'some_error',
      message: longMessage,
    })
    expect(result.message.length).toBeLessThanOrEqual(200)
  })

  test('prefers error_description over message', () => {
    const result = normalizeAuthError({
      error: 'some_error',
      error_description: 'specific error',
      message: 'generic message',
    })
    expect(result.message).toBe('specific error')
  })
})

describe('getErrorMessage', () => {
  test('returns Portuguese message for known error codes', () => {
    expect(getErrorMessage('authentication_failed')).toBe(
      'E-mail ou senha incorretos'
    )
    expect(getErrorMessage('invalid_request')).toBe('Dados inválidos')
  })

  test('returns fallback for unknown codes', () => {
    const result = getErrorMessage('unknown_code', 'Custom fallback')
    expect(result).toBe('Custom fallback')
  })

  test('returns unknown_error message for unknown codes without fallback', () => {
    const result = getErrorMessage('unknown_code')
    expect(result).toBe('Erro desconhecido')
  })
})

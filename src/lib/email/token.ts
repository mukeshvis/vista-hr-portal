import crypto from 'crypto'

const SECRET_KEY = process.env.NEXTAUTH_SECRET || 'default-secret-key'

export function generateApprovalToken(data: {
  leaveApplicationId: number
  role: 'manager' | 'hr'
  expiresIn?: number // in hours, default 72 hours
}): string {
  const expiresIn = data.expiresIn || 72
  const expiresAt = Date.now() + expiresIn * 60 * 60 * 1000

  const payload = {
    id: data.leaveApplicationId,
    role: data.role,
    exp: expiresAt,
  }

  const payloadString = JSON.stringify(payload)
  const token = Buffer.from(payloadString).toString('base64url')

  // Create signature
  const hmac = crypto.createHmac('sha256', SECRET_KEY)
  hmac.update(token)
  const signature = hmac.digest('base64url')

  return `${token}.${signature}`
}

export function verifyApprovalToken(token: string): {
  valid: boolean
  data?: {
    id: number
    role: 'manager' | 'hr'
    exp: number
  }
  error?: string
} {
  try {
    const [payloadToken, signature] = token.split('.')

    if (!payloadToken || !signature) {
      return { valid: false, error: 'Invalid token format' }
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', SECRET_KEY)
    hmac.update(payloadToken)
    const expectedSignature = hmac.digest('base64url')

    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid token signature' }
    }

    // Decode payload
    const payloadString = Buffer.from(payloadToken, 'base64url').toString('utf-8')
    const payload = JSON.parse(payloadString)

    // Check expiration
    if (Date.now() > payload.exp) {
      return { valid: false, error: 'Token has expired' }
    }

    return {
      valid: true,
      data: {
        id: payload.id,
        role: payload.role,
        exp: payload.exp,
      },
    }
  } catch (error) {
    return { valid: false, error: 'Token verification failed' }
  }
}

/**
 * Get the base URL based on the current environment
 * @returns Base URL for the application
 */
export function getBaseUrl(): string {
  const appEnv = process.env.APP_ENV || 'local'

  if (appEnv === 'production') {
    return process.env.PRODUCTION_URL || 'https://hr.vis.com.pk'
  }

  // Default to localhost for local development
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

/**
 * Get the appropriate URL for email approval links
 * Uses production URL if APP_ENV is set to production, otherwise localhost
 */
export function getEmailBaseUrl(): string {
  return getBaseUrl()
}

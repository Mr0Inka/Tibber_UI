// Auto-detect API URL based on where the frontend is accessed from
export const getApiUrl = (): string => {
  const hostname = window.location.hostname
  
  // Priority 1: If VITE_API_URL is explicitly set, use it
  // Exception: If it's set to localhost but we're accessing from elsewhere, use auto-detection
  if (import.meta.env.VITE_API_URL) {
    const envUrl = import.meta.env.VITE_API_URL.trim()
    // If env URL is localhost/127.0.0.1 but we're not on localhost, use auto-detection
    const isLocalhostUrl = envUrl.includes('localhost') || envUrl.includes('127.0.0.1')
    if (isLocalhostUrl && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Fall through to auto-detection
    } else {
      // Use the explicit URL from env (works for development: laptop frontend → Pi backend)
      return envUrl
    }
  }
  
  // Priority 2: Auto-detect based on where frontend is accessed from
  // If accessing from localhost, use localhost for API
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000'
  }
  
  // Otherwise, use the same hostname/IP for API
  // This works when accessing frontend via Pi's IP/hostname - it will use the same for API
  return `http://${hostname}:3000`
}

export const API_URL = getApiUrl()

// Debug logging (remove in production if desired)
if (import.meta.env.DEV) {
  console.log('API URL Configuration:', {
    'VITE_API_URL from env': import.meta.env.VITE_API_URL,
    'window.location.hostname': window.location.hostname,
    'Final API_URL': API_URL
  })
}

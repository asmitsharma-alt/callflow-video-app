/**
 * Keep-Alive Service
 * Automatically pings the server's public URL every 14 minutes
 * to prevent Render free-tier instances from spinning down after 15 minutes of inactivity.
 */

export function startKeepAlive(externalUrl, intervalMinutes = 14) {
  if (!externalUrl) {
    console.log('ℹ️ [Keep-Alive] No external URL configured (RENDER_EXTERNAL_URL / SERVER_URL). Skipping self-ping.');
    return null;
  }

  const pingUrl = `${externalUrl.replace(/\/$/, '')}/api/health`;
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`⏱️ [Keep-Alive] Active: Pinging ${pingUrl} every ${intervalMinutes} minutes.`);

  const intervalId = setInterval(async () => {
    try {
      const response = await fetch(pingUrl);
      if (response.ok) {
        console.log(`💓 [Keep-Alive] Ping successful (${response.status}) at ${new Date().toISOString()}`);
      } else {
        console.warn(`⚠️ [Keep-Alive] Ping returned non-200 status: ${response.status}`);
      }
    } catch (err) {
      console.error('❌ [Keep-Alive] Ping failed:', err.message);
    }
  }, intervalMs);

  return () => clearInterval(intervalId);
}

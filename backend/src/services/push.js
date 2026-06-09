/** Expo push delivery only — DB kayıtları notifications.js üzerinden */
async function sendExpoPush(pushToken, { title, body, data }) {
  if (!pushToken?.startsWith('ExponentPushToken')) return false;
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: pushToken,
        title,
        body,
        data: data || {},
        sound: 'default',
      }),
    });
    const json = await res.json();
    return json.data?.[0]?.status === 'ok';
  } catch (e) {
    console.warn('Expo push failed:', e.message);
    return false;
  }
}

module.exports = { sendExpoPush };

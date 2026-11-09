import { checkExpiredPhases, getPendingNotifications, markNotificationSent } from '../../../lib/game-engine.js';

export async function onRequestPost(context) {
  const { env, request } = context;

  const authHeader = request.headers.get('Authorization');
  const cronSecret = env.CRON_SECRET || 'dev-cron-secret';
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const phaseResults = await checkExpiredPhases(env.DB);

  const notifications = await getPendingNotifications(env.DB);
  const notificationResults = [];

  for (const n of notifications) {
    try {
      if (env.CLIQ_WEBHOOK_URL) {
        const payload = {
          text: n.message,
          channel: n.channel,
          user_id: n.user_id,
          game_name: n.game_name,
          message_type: n.message_type,
        };
        await fetch(env.CLIQ_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      await markNotificationSent(env.DB, n.id);
      notificationResults.push({ id: n.id, status: 'sent' });
    } catch (e) {
      notificationResults.push({ id: n.id, status: 'failed', error: e.message });
    }
  }

  return new Response(JSON.stringify({
    phases_advanced: phaseResults,
    notifications_processed: notificationResults,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

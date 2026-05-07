import webpush from 'web-push';
import { getMemberPushSubscriptions, deletePushSubscription } from './member-data';

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  const subject = process.env.VAPID_SUBJECT;
  const pubKey = process.env.VAPID_PUBLIC_KEY;
  const privKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !pubKey || !privKey) return;
  webpush.setVapidDetails(subject, pubKey, privKey);
  vapidConfigured = true;
}

export async function sendMemberPushNotification(
  memberId: string,
  title: string,
  body: string,
  url = '/member/dashboard'
): Promise<void> {
  try {
    ensureVapid();
    if (!vapidConfigured) return;

    const subscriptions = await getMemberPushSubscriptions(memberId);
    if (!subscriptions.length) return;

    const payload = JSON.stringify({ title, body, url });

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await deletePushSubscription(memberId, sub.endpoint);
          }
        }
      })
    );
  } catch {
    // Non-fatal — never let push errors break the main transaction
  }
}

const FRONTEND = process.env.FRONTEND_URL ?? 'http://localhost:3000';

const base = (body: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:system-ui,sans-serif;color:#e5e5e5">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto">
    <tr>
      <td style="padding:0 24px">
        <p style="font-size:20px;font-weight:900;color:#f97316;margin:0 0 24px">AutoGuildX</p>
        ${body}
        <hr style="border:none;border-top:1px solid #2a2a2a;margin:32px 0">
        <p style="font-size:11px;color:#555;margin:0">
          You received this email because you have an account on AutoGuildX.<br>
          <a href="${FRONTEND}/profile#notifications"
             style="color:#f97316;text-decoration:underline">Unsubscribe from email notifications</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

export const templates = {
  verificationApproved: () => ({
    subject: 'Your AutoGuildX verified badge was approved ✓',
    html: base(`
      <h1 style="font-size:22px;font-weight:800;margin:0 0 12px">You&apos;re verified!</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 20px;color:#ccc">
        Your verification request has been approved. A verified badge now appears next to your
        name across AutoGuildX — on your profile, in the feed, and in search results.
      </p>
      <a href="${FRONTEND}/profile"
         style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;
                font-weight:700;padding:12px 24px;border-radius:8px;font-size:14px">
        View your profile
      </a>
    `),
  }),

  verificationDenied: () => ({
    subject: 'Update on your AutoGuildX verification request',
    html: base(`
      <h1 style="font-size:22px;font-weight:800;margin:0 0 12px">Verification update</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 20px;color:#ccc">
        Your verification request was reviewed and could not be approved at this time.
        You can submit a new request from your profile page once your account has more activity.
      </p>
      <a href="${FRONTEND}/profile"
         style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;
                font-weight:700;padding:12px 24px;border-radius:8px;font-size:14px">
        Go to your profile
      </a>
    `),
  }),

  newMessage: (senderName: string) => ({
    subject: `New message from ${senderName} on AutoGuildX`,
    html: base(`
      <h1 style="font-size:22px;font-weight:800;margin:0 0 12px">You have a new message</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 20px;color:#ccc">
        <strong style="color:#fff">${senderName}</strong> sent you a message on AutoGuildX.
      </p>
      <a href="${FRONTEND}/messages"
         style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;
                font-weight:700;padding:12px 24px;border-radius:8px;font-size:14px">
        Read message
      </a>
    `),
  }),

  newFollower: (followerName: string) => ({
    subject: `${followerName} is now following you on AutoGuildX`,
    html: base(`
      <h1 style="font-size:22px;font-weight:800;margin:0 0 12px">New follower</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 20px;color:#ccc">
        <strong style="color:#fff">${followerName}</strong> started following you on AutoGuildX.
      </p>
      <a href="${FRONTEND}/profile"
         style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;
                font-weight:700;padding:12px 24px;border-radius:8px;font-size:14px">
        View your profile
      </a>
    `),
  }),

  newReview: (reviewerName: string, rating: number) => ({
    subject: `${reviewerName} left you a ${rating}-star review on AutoGuildX`,
    html: base(`
      <h1 style="font-size:22px;font-weight:800;margin:0 0 12px">New review</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 20px;color:#ccc">
        <strong style="color:#fff">${reviewerName}</strong> left you a
        <strong style="color:#fff">${rating}-star</strong> review on AutoGuildX.
      </p>
      <a href="${FRONTEND}/profile"
         style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;
                font-weight:700;padding:12px 24px;border-radius:8px;font-size:14px">
        View your profile
      </a>
    `),
  }),
};

import type {
  DocumentOpenedPayload,
  NewCommentPayload,
} from './notifications.service';

const escape = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char] as string,
  );

const shell = (heading: string, body: string, cta: { label: string; url: string }): string => `
<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#f4f2ee;font-family:ui-sans-serif,-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#14161a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#fbfaf8;border:1px solid #e2ded6;border-radius:12px;">
      <tr>
        <td style="padding:28px 28px 8px;">
          <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#7a746a;">Deal Room</div>
          <h1 style="margin:14px 0 0;font-size:20px;line-height:1.35;font-weight:600;">${heading}</h1>
        </td>
      </tr>
      <tr><td style="padding:12px 28px 0;font-size:15px;line-height:1.6;color:#3d3a34;">${body}</td></tr>
      <tr>
        <td style="padding:24px 28px 32px;">
          <a href="${cta.url}" style="display:inline-block;padding:11px 18px;background:#14523c;color:#fbfaf8;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">${cta.label}</a>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export const documentOpenedEmail = (payload: DocumentOpenedPayload): string => {
  const when = payload.openedAt.toUTCString();
  const audience = payload.recipientName
    ? ` on the link you shared with ${escape(payload.recipientName)}`
    : '';

  return shell(
    `${escape(payload.viewerLabel)} opened ${escape(payload.documentName)}`,
    `<p style="margin:0 0 12px;">Opened at ${escape(when)}${audience}.</p>
     <p style="margin:0;">Open the deal room to see how long they spent and which pages held their attention.</p>`,
    { label: 'View engagement', url: payload.documentUrl },
  );
};

export const newCommentEmail = (payload: NewCommentPayload): string =>
  shell(
    `${escape(payload.authorLabel)} commented on ${escape(payload.documentName)}`,
    `<blockquote style="margin:0 0 12px;padding:12px 16px;background:#f4f2ee;border-left:3px solid #14523c;border-radius:6px;">${escape(payload.body)}</blockquote>`,
    { label: 'Reply', url: payload.url },
  );

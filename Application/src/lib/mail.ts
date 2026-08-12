import "server-only";

import nodemailer from "nodemailer";

import { CONTACT_EMAIL, MAIL_SENDER } from "./site";

/**
 * Sending mail from the site. One sender, one purpose: the contact form.
 *
 * ---------------------------------------------------------------------------
 * WHY SMTP, AND NOT AN EMAIL API
 * ---------------------------------------------------------------------------
 * The obvious alternative — Resend, SendGrid, Postmark — needs no dependency at
 * all, just `fetch`. SMTP was chosen anyway, for two reasons that matter more
 * here than the package count:
 *
 *  - **It adds no data processor.** Everything a visitor types on the contact
 *    form is personal data, and the privacy policy names Maynooth University as
 *    the controller. Routing it through a commercial email service makes that
 *    service a processor, which needs an agreement, a transfer assessment if it
 *    is outside the EEA, and a line in the policy. Sending through a mailbox
 *    the project already owns needs none of that.
 *  - **It works with what the project has.** IRESI already publishes
 *    a project address already. Any mailbox — institutional, Microsoft 365, Google
 *    Workspace — can relay this. No new account, no card, no domain to verify.
 *
 * `nodemailer` is the one dependency, and it has no dependencies of its own.
 * SMTP over TLS with AUTH is not something to hand-roll for a form that must
 * not drop messages.
 *
 * ---------------------------------------------------------------------------
 * NOT CONFIGURED IS A NORMAL STATE, NOT AN ERROR
 * ---------------------------------------------------------------------------
 * With no SMTP settings the site behaves exactly as it did before any of this
 * existed: the contact form works and messages land in the admin dashboard.
 * Nothing here throws on a missing variable, and no page changes.
 */

/** How long to wait for the mail server before giving up and falling back. */
const TIMEOUT_MS = 10_000;

type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  from: string;
  to: string;
};

/** Where contact form messages are sent. One line, in `site.ts`. */
export function contactRecipient(): string {
  return CONTACT_EMAIL.trim();
}

/**
 * Reads the mail settings, or null when the site cannot send.
 *
 * ---------------------------------------------------------------------------
 * ONE FILE FOR THE ADDRESSES, THE ENVIRONMENT FOR THE SECRET
 * ---------------------------------------------------------------------------
 * Everything that is not a secret — where messages go, which mailbox sends them,
 * the host and the port — comes from `CONTACT_EMAIL` and `MAIL_SENDER` in
 * `site.ts`. No environment variable shadows them: there was an admin screen and
 * an env var for this at one point, and three places to look for one address is
 * how a site ends up mailing somewhere nobody expects.
 *
 * The password is the exception and comes from the environment, because a
 * credential in a source file is a credential in the git history.
 *
 * Read per call rather than captured at module load: a Server Action runs long
 * after this module is first imported.
 */
function readConfig(): MailConfig | null {
  const host = MAIL_SENDER.host.trim();
  const recipient = contactRecipient();
  /*
   * The sending mailbox is explicit — no falling back to the recipient. A
   * default there would make `CONTACT_EMAIL` quietly do a second job, and the
   * `From:` header has to follow whatever the site actually authenticates as:
   * sending as an address its mailbox cannot authenticate for is what SPF and
   * DMARC reject.
   */
  const sender = MAIL_SENDER.address.trim();
  const password = process.env.SMTP_PASSWORD || undefined;

  // No server, no sender, no recipient or no password means the site cannot
  // send, and every submission goes to the dashboard instead. That is a normal
  // state, not a fault — see the note at the top of this file.
  if (!host || !sender || !recipient || !password) return null;

  const port = MAIL_SENDER.port;
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;

  /*
   * Port 465 is implicit TLS; 587 and 25 start in the clear and upgrade with
   * STARTTLS, which nodemailer does automatically when `secure` is false.
   */
  return {
    host,
    port,
    secure: port === 465,
    // Authenticated as, and sent as, the sending mailbox — never the visitor and
    // never the destination. Sending as an address this account cannot
    // authenticate for is what SPF and DMARC exist to reject.
    user: sender,
    password,
    from: `ADFLEX website <${sender}>`,
    to: recipient,
  };
}

/** Whether the site can send mail at all. Used to decide if the form is offered. */
export function isMailConfigured(): boolean {
  return readConfig() !== null;
}

/**
 * Strips anything that could break out of a header.
 *
 * A carriage return or newline in a `Subject:` or a display name is how header
 * injection works — it ends the header and starts another, which is how a public
 * form becomes a way to send mail to addresses nobody at ADFLEX chose. Nodemailer
 * encodes headers properly and would almost certainly stop this on its own; this
 * is here because "almost certainly" is not the standard for the one endpoint on
 * this site that an anonymous visitor can reach.
 *
 * Every other control character goes the same way, runs of whitespace collapse,
 * and the result is capped — a 4,000-character subject is not a real subject.
 */
function headerSafe(value: string, max = 200): string {
  let out = "";
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    // C0 controls and DEL. Compared by code point rather than matched with a
    // regex so this file contains no control characters of its own — one that
    // does is a file that greps, diffs and editors all handle badly.
    out += code < 0x20 || code === 0x7f ? " " : character;
  }
  return out.replace(/\s+/g, " ").trim().slice(0, max);
}

export type ContactEmail = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type SendResult =
  | { ok: true }
  /** `reason` is for the server log and the admin, never for the visitor. */
  | { ok: false; reason: string };

/**
 * Emails one contact form submission.
 *
 * Never throws: the caller has a fallback and needs an answer, not an exception.
 * A `false` here means "put it in the dashboard instead", whatever went wrong.
 */
export async function sendContactEmail(entry: ContactEmail): Promise<SendResult> {
  const config = readConfig();
  if (!config) return { ok: false, reason: "SMTP is not configured" };

  const name = headerSafe(entry.name, 120);
  const subject = headerSafe(entry.subject, 160);
  const replyTo = headerSafe(entry.email, 200);

  try {
    const transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user ? { user: config.user, pass: config.password ?? "" } : undefined,
      // Without these a dead mail server holds the visitor's browser open until
      // the platform kills the request, and they never learn whether their
      // message arrived. Ten seconds, then the dashboard takes it.
      connectionTimeout: TIMEOUT_MS,
      greetingTimeout: TIMEOUT_MS,
      socketTimeout: TIMEOUT_MS,
    });

    await transport.sendMail({
      /*
       * From is always the project's own address — never the visitor's.
       *
       * Sending as the visitor is the intuitive thing and the wrong thing: the
       * project's mail server is not authorised to send as `someone@gmail.com`,
       * so SPF and DMARC reject it and the message is lost or filed as spam.
       * The visitor's address goes in Reply-To, where hitting reply in any mail
       * client does the right thing.
       */
      from: config.from,
      to: config.to,
      replyTo: replyTo ? `${name} <${replyTo}>` : undefined,
      subject: subject
        ? `ADFLEX contact form: ${subject}`
        : `ADFLEX contact form: message from ${name || "a visitor"}`,
      /*
       * Plain text only, deliberately.
       *
       * An HTML body would mean escaping everything a stranger typed, on the one
       * endpoint on this site an anonymous visitor can reach, for no gain — this
       * is a form submission, not a newsletter. Text has no injection surface.
       */
      text: [
        `Name:    ${entry.name}`,
        `Email:   ${entry.email}`,
        `Subject: ${entry.subject || "(none given)"}`,
        "",
        entry.message,
        "",
        "--",
        "Sent from the contact form on the ADFLEX website.",
        "Reply to this email to answer the sender directly.",
      ].join("\n"),
    });

    return { ok: true };
  } catch (error) {
    // The message, never the credentials — a nodemailer error can carry the
    // command that failed, and an AUTH failure quotes what was sent.
    const reason = error instanceof Error ? error.message : "unknown error";
    return { ok: false, reason: reason.slice(0, 200) };
  }
}

"use server";

import { headers } from "next/headers";
import { recordSubmission, tooManySubmissions } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { isMailConfigured, sendContactEmail } from "@/lib/mail";
import { createMessage } from "@/lib/repo";

/**
 * Receives a contact form submission.
 *
 * Public and unauthenticated by definition, so it is the one Server Action on
 * the site an anonymous visitor can reach. Three consequences, each handled
 * below: everything is length-capped before it goes anywhere, a honeypot
 * catches the simplest bots, and nothing the sender typed is ever echoed back
 * into HTML by this action.
 *
 * ---------------------------------------------------------------------------
 * EMAIL FIRST, THE DASHBOARD ONLY IF THAT FAILS
 * ---------------------------------------------------------------------------
 * A message that arrives in someone's inbox gets answered. A message that sits
 * in an admin dashboard gets answered when somebody remembers to look, which on
 * a project with no full-time web person is not a schedule. So this emails the
 * project, and writes to the database **only when the email did not go** —
 * because a message nobody can see is worse than one stored in the wrong place.
 *
 * Consequences worth knowing before changing it back:
 *
 *  - The dashboard is now a failure queue, not an archive. Anything in it is
 *    something that did not reach the mailbox and still needs answering.
 *  - With no SMTP settings, every message falls back, which is exactly what the
 *    site did before any of this existed. Nothing breaks; nothing is lost.
 *  - A successfully emailed message is not stored anywhere on the site. That is
 *    deliberate — fewer copies of personal data — but it does mean the mailbox
 *    is the record, and deleting it there deletes it entirely.
 *
 * **This handles personal data.** Name, email and free text, with Maynooth
 * University as the controller named in the privacy policy. See docs/ADMIN.md.
 */

export type ContactState = { error?: string; sent?: boolean };

const LIMITS = { name: 120, email: 200, subject: 200, message: 4000 };

export async function submitContact(
  _previous: ContactState,
  form: FormData,
): Promise<ContactState> {
  // Honeypot. A real person never sees or fills this field; automated posters
  // fill everything. Answer as though it succeeded — telling a bot it was
  // detected only teaches it to try again differently.
  if (String(form.get("website") ?? "").trim()) return { sent: true };

  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const subject = String(form.get("subject") ?? "").trim();
  const message = String(form.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { error: "Please fill in your name, your email address and a message." };
  }

  // Deliberately loose. Anything stricter rejects real addresses, and the only
  // real test of an address is sending to it.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "That email address does not look right." };
  }

  if (
    name.length > LIMITS.name ||
    email.length > LIMITS.email ||
    subject.length > LIMITS.subject ||
    message.length > LIMITS.message
  ) {
    return { error: "That message is longer than the form accepts. Please shorten it." };
  }

  /*
   * A cap on how often one address can post.
   *
   * The honeypot above catches scripts that fill every field and nothing else,
   * and this is the only unauthenticated write on the site. Checked after the
   * cheap validation so a flood of malformed posts costs nothing, and before
   * anything is sent or stored.
   *
   * Deliberately not silent. A person who has genuinely sent five messages in an
   * hour should be told why the sixth did not go, rather than shown a success
   * message over a message nobody will read.
   */
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (tooManySubmissions(ip)) {
    return {
      error:
        "That is several messages in a short time. Please wait a little while before sending another, or email us directly.",
    };
  }

  // The form only renders when at least one of the two routes exists, so
  // reaching this means a direct POST. Say plainly that nothing was kept rather
  // than showing a success message over a message that went nowhere.
  if (!isMailConfigured() && !isDatabaseConfigured()) {
    return { error: "The contact form is not available right now. Please email us instead." };
  }

  recordSubmission(ip);

  const posted = await sendContactEmail({ name, email, subject, message });
  if (posted.ok) return { sent: true };

  /*
   * The email did not go. Log why — on the server, where the team can see it and
   * the sender cannot — and fall back to the dashboard.
   *
   * Logged at `warn` rather than `error` when there is simply no SMTP configured,
   * because that is a site that has not been set up to email yet, not a fault.
   */
  const configured = isMailConfigured();
  console[configured ? "error" : "warn"](
    `[adflex] contact email not sent (${posted.reason}); ${
      isDatabaseConfigured() ? "falling back to the dashboard" : "and there is no database to fall back to"
    }`,
  );

  if (!isDatabaseConfigured()) {
    return {
      error: "Sorry — we could not send your message. Please email us instead.",
    };
  }

  try {
    await createMessage({ name, email, subject, message });
  } catch (error) {
    console.error("[adflex] contact submission failed:", error);
    return {
      error: "Sorry — we could not send your message. Please email us instead.",
    };
  }

  return { sent: true };
}

/**
 * Turning a submitted enquiry form into the message that gets sent.
 *
 * Kept out of the Server Action, and free of `server-only`, so it can be
 * exercised directly. The action itself can only be driven through React's
 * action protocol, which makes the one part worth checking — how the subject
 * and body are assembled — the hardest part to reach.
 */

export type EnquiryFields = {
	name: string;
	email: string;
	message: string;
	subject?: string;
	organisation?: string;
	phone?: string;
	/** Which form it came from. Anything unrecognised is treated as general. */
	origin?: string;
};

/**
 * Which form the submission came from, used to title the email.
 *
 * One action serves both the contact page and the partnership panel on
 * /partners, because they collect nearly the same thing and every extra
 * unauthenticated endpoint is another thing to keep safe. What differs is the
 * subject, so whoever reads the mailbox can tell a partnership approach from a
 * general enquiry without opening it.
 */
export const ORIGINS: Record<string, string> = {
	contact: "Website enquiry",
	partners: "Partnership enquiry",
	// One deployment serves both sites, so the subject line is the only thing
	// telling the reader which of them a message came from.
	adflex: "ADFLEX enquiry",
};

export const LIMITS = {
	name: 120,
	email: 200,
	subject: 200,
	message: 4000,
	organisation: 200,
	phone: 60,
};

export type ComposedEnquiry = { subject: string; body: string };

/**
 * Builds the subject line and the message body.
 *
 * Organisation and phone are folded into the body rather than carried as their
 * own fields: the email, the dashboard and the messages table all take name,
 * email, subject and message, and widening all three to carry two optional
 * lines that only one form collects would be a schema change for a formatting
 * problem.
 */
export function composeEnquiry(fields: EnquiryFields): ComposedEnquiry {
	const origin = ORIGINS[fields.origin?.trim() ?? ""] ?? ORIGINS.contact;
	const subject = fields.subject?.trim() || `${origin} from ${fields.name}`;

	const details = [
		fields.organisation?.trim() && `Organisation: ${fields.organisation.trim()}`,
		fields.phone?.trim() && `Phone: ${fields.phone.trim()}`,
	].filter(Boolean);

	const body =
		details.length > 0 ? `${details.join("\n")}\n\n${fields.message}` : fields.message;

	return { subject, body };
}

/** True when any field is longer than the form accepts. */
export function tooLong(fields: EnquiryFields, subject: string): boolean {
	return (
		fields.name.length > LIMITS.name ||
		fields.email.length > LIMITS.email ||
		subject.length > LIMITS.subject ||
		fields.message.length > LIMITS.message ||
		(fields.organisation?.length ?? 0) > LIMITS.organisation ||
		(fields.phone?.length ?? 0) > LIMITS.phone
	);
}

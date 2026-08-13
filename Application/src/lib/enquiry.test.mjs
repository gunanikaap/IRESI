/**
 * Tests for how an enquiry becomes an email.
 *
 *   node --test src/lib/enquiry.test.mjs
 *
 * This is the part of the contact and partnership forms worth checking and the
 * hardest to reach: the Server Action around it can only be driven through
 * React's action protocol, so the composition lives in a plain module.
 *
 * The module is TypeScript, so this imports the types-stripped source directly —
 * Node runs it without a build step.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { composeEnquiry, tooLong, LIMITS } from "./enquiry.ts";

const base = { name: "Dana Okonkwo", email: "dana@example.com", message: "Hello." };

test("a general enquiry is titled as one", () => {
	const { subject } = composeEnquiry({ ...base, origin: "contact" });
	assert.equal(subject, "Website enquiry from Dana Okonkwo");
});

test("a partnership enquiry is titled so it stands out in the inbox", () => {
	const { subject } = composeEnquiry({ ...base, origin: "partners" });
	assert.equal(subject, "Partnership enquiry from Dana Okonkwo");
});

test("an unrecognised origin is not reflected into the subject", () => {
	const { subject } = composeEnquiry({ ...base, origin: "<script>alert(1)</script>" });
	assert.equal(subject, "Website enquiry from Dana Okonkwo");
});

test("a subject the sender typed is kept as it is", () => {
	const { subject } = composeEnquiry({ ...base, subject: "About the RENEW project" });
	assert.equal(subject, "About the RENEW project");
});

test("organisation and phone are carried into the body", () => {
	const { body } = composeEnquiry({
		...base,
		origin: "partners",
		organisation: "Northwind Energy Cooperative",
		phone: "+353 1 555 0142",
	});
	assert.equal(
		body,
		"Organisation: Northwind Energy Cooperative\nPhone: +353 1 555 0142\n\nHello."
	);
});

test("only the field that was filled in appears", () => {
	const { body } = composeEnquiry({ ...base, organisation: "Northwind" });
	assert.equal(body, "Organisation: Northwind\n\nHello.");
});

test("the contact form's body is the message and nothing else", () => {
	const { body } = composeEnquiry({ ...base, origin: "contact" });
	assert.equal(body, "Hello.");
});

test("whitespace-only optional fields add nothing", () => {
	const { body } = composeEnquiry({ ...base, organisation: "   ", phone: "\t" });
	assert.equal(body, "Hello.");
});

test("an over-long organisation is refused", () => {
	const fields = { ...base, organisation: "x".repeat(LIMITS.organisation + 1) };
	const { subject } = composeEnquiry(fields);
	assert.equal(tooLong(fields, subject), true);
});

test("an over-long phone number is refused", () => {
	const fields = { ...base, phone: "9".repeat(LIMITS.phone + 1) };
	const { subject } = composeEnquiry(fields);
	assert.equal(tooLong(fields, subject), true);
});

test("an ordinary partnership submission is accepted", () => {
	const fields = {
		...base,
		origin: "partners",
		organisation: "Northwind Energy Cooperative",
		phone: "+353 1 555 0142",
	};
	const { subject } = composeEnquiry(fields);
	assert.equal(tooLong(fields, subject), false);
});

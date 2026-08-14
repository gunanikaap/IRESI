/**
 * Tests for turning a stored date into words.
 *
 *   node --test src/lib/dates.test.mjs
 *
 * The bug these exist to prevent is a date rendering as the day before or the
 * day after the one in the database. It is invisible in Ireland in winter, which
 * is exactly why it needs a test rather than a look.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { formatDate, formatDayAndTime, todayInIreland } from "./dates.ts";

test("a date renders as the day it says, not the day before", () => {
	assert.equal(formatDate("2026-08-14"), "14 August 2026");
	assert.equal(formatDate("2025-02-01"), "1 February 2025");
});

test("the first of the month does not slip backwards", () => {
	// The failure mode this guards: `new Date("2026-01-01")` is UTC midnight, so
	// formatting it in a zone behind UTC gives 31 December 2025.
	assert.equal(formatDate("2026-01-01"), "1 January 2026");
	assert.equal(formatDate("2026-03-01"), "1 March 2026");
});

test("a date in Irish summer time still renders correctly", () => {
	// Ireland is UTC+1 from late March to late October; a naive reading of the
	// string at midnight UTC lands on the previous evening locally.
	assert.equal(formatDate("2026-07-01"), "1 July 2026");
	assert.equal(formatDate("2026-10-25"), "25 October 2026");
});

test("the last day of the year does not slip forwards", () => {
	assert.equal(formatDate("2026-12-31"), "31 December 2026");
});

test("day and time renders the weekday, and the time when there is one", () => {
	assert.equal(formatDayAndTime("2026-08-14", null), "Fri, 14 August");
	assert.equal(formatDayAndTime("2026-08-14", "14:00"), "Fri, 14 August · 14:00");
});

test("today is a YYYY-MM-DD string that sorts and compares as text", () => {
	const today = todayInIreland();
	assert.match(today, /^\d{4}-\d{2}-\d{2}$/);

	// The property the admin's "an upcoming event cannot be in the past" check
	// relies on: these are comparable with < and > as plain strings.
	assert.ok("2020-01-01" < today, "a past date sorts before today");
	assert.ok("2200-01-01" > today, "a future date sorts after today");
});

test("a leap day is a real date", () => {
	assert.equal(formatDate("2028-02-29"), "29 February 2028");
});

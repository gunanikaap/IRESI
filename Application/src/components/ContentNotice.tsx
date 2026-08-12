import styles from "./ContentNotice.module.css";

/**
 * Shown in place of a list that could not be read, or that is genuinely empty.
 *
 * ---------------------------------------------------------------------------
 * WHY THESE ARE TWO DIFFERENT MESSAGES
 * ---------------------------------------------------------------------------
 * A failed read used to return an empty list, and an empty list is also what a
 * page shows when nothing has been published — so a database that blinked told
 * visitors a funded research centre had no projects and no news. Every public
 * read returns `{ data, degraded }` so the page can tell "there is nothing"
 * from "I could not find out", and say the right one.
 *
 * This was the most damaging bug found in the ADFLEX security review. Do not
 * collapse these two states back into one.
 */
export default function ContentNotice({
	degraded,
	what,
}: {
	degraded: boolean;
	/** Plural noun for what is missing, e.g. "projects". */
	what: string;
}) {
	return (
		<p className={styles.notice} role={degraded ? "status" : undefined}>
			{degraded
				? `We could not load the ${what} just now. Please try again shortly.`
				: `There are no ${what} to show yet. Please check back soon.`}
		</p>
	);
}

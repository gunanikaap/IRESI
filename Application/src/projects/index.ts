import type { ProjectConfig } from "./types";
import { iresi } from "./iresi/config";
import { adflex } from "./adflex/config";

export type { ProjectConfig, NavItem, SocialLink, SocialIcon, FooterColumn } from "./types";

const PROJECTS: Record<string, ProjectConfig> = {
	[iresi.key]: iresi,
	[adflex.key]: adflex,
};

/**
 * The project this deployment serves, chosen by `ACTIVE_PROJECT`.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS THROWS RATHER THAN FALLING BACK
 * ---------------------------------------------------------------------------
 * An unset variable defaults to IRESI, which is the parent platform and the
 * safe assumption. A variable that is *set to something unknown* is a typo in a
 * deployment's environment, and the worst outcome there is quietly serving the
 * wrong project's name, navigation and contact address. Failing at startup with
 * the list of valid keys is a minute's work to fix; discovering it because a
 * visitor emailed the wrong mailbox is not.
 *
 * Read at module scope, so a bad value stops the build rather than the first
 * request that happens to touch it.
 */
function resolveProject(): ProjectConfig {
	const key = process.env.ACTIVE_PROJECT?.trim();
	if (!key) return iresi;

	const project = PROJECTS[key];
	if (!project) {
		throw new Error(
			`ACTIVE_PROJECT is "${key}", which is not a known project. ` +
				`Valid values: ${Object.keys(PROJECTS).join(", ")}.`
		);
	}
	return project;
}

export const project = resolveProject();

/** Every configured project. Used by the admin to say which site it is editing. */
export const allProjects = Object.values(PROJECTS);

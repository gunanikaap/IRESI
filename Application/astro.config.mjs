// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.iresi.eu',

	// Fully static output — the built `dist/` folder can be copied onto any web
	// server (including Maynooth University hosting) with no Node runtime.
	output: 'static',

	// Emit `/about-us/index.html` rather than `/about-us.html` so the existing
	// WordPress URLs keep working after the domain is pointed at this build.
	build: {
		format: 'directory',
	},

	trailingSlash: 'ignore',
});

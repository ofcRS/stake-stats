import { build, context } from "esbuild";

const config = {
	entryPoints: [
		"src/background-scripts/background.js",
		"src/content-script.js",
	],
	bundle: true,
	outdir: "dist",
	platform: "browser",
	format: "esm",
	sourcemap: true,
	minify: false,
	loader: {
		".js.user.script": "text",
	},
};

const run = async () => {
	if (process.env.WATCH) {
		const ctx = await context(config);
		await ctx.watch({});
	} else {
		build(config);
	}
};

run();

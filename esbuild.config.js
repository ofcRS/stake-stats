import { build, context } from "esbuild";
import { cp } from "node:fs/promises";

const config = {
  entryPoints: ["src/stats/stats.js","src/stats/stats.css"],
  bundle: true,
  outdir: "dist",
  platform: "browser",
  format: "esm",
  sourcemap: true,
  minify: false,
};

const run = async () => {
  await cp("src/stats/stats.html", "dist/stats.html");
  await cp("src/utils/chart.js", "dist/chart.js");
  await cp("src/utils/jsstats.js", "dist/jsstats.js");
  if (process.env.WATCH) {
    const ctx = await context(config);
    ctx.serve({
      port: 3000,
      host: "localhost",
      servedir: "dist",
    });
    await ctx.watch({});
  } else {
    build(config);
  }
};

run();

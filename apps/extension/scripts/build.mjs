import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import sharp from "sharp";

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = resolve(packageDirectory, "dist");
const webFavicon = resolve(packageDirectory, "../web/app/icon.svg");

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(resolve(outputDirectory, "icons"), { recursive: true });

await build({
  absWorkingDir: packageDirectory,
  entryPoints: {
    background: "src/background.ts",
    popup: "src/popup.ts",
    options: "src/options.ts"
  },
  outdir: outputDirectory,
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "chrome102",
  sourcemap: false,
  minify: false
});

await Promise.all([
  cp(resolve(packageDirectory, "manifest.json"), resolve(outputDirectory, "manifest.json")),
  cp(resolve(packageDirectory, "popup.html"), resolve(outputDirectory, "popup.html")),
  cp(resolve(packageDirectory, "options.html"), resolve(outputDirectory, "options.html")),
  cp(resolve(packageDirectory, "styles.css"), resolve(outputDirectory, "styles.css"))
]);

const favicon = await readFile(webFavicon);
for (const size of [16, 32, 48, 128]) {
  const logo = await sharp(favicon)
    .resize(Math.max(12, Math.round(size * 0.78)), Math.max(12, Math.round(size * 0.78)), { fit: "contain" })
    .png()
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: "#050505" }
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(resolve(outputDirectory, `icons/icon-${size}.png`));
}

console.log(`Built Chrome extension in ${outputDirectory}`);

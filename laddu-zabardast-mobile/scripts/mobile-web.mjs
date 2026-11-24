import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const mobile = fileURLToPath(new URL("../", import.meta.url));
export const frontend = path.resolve(mobile, "../laddu-zabardast-fe");

export function mobileBackendURL(release) {
  const server = process.env.MOBILE_BACKEND_URL || (release ? "" : "http://localhost:8080");
  if (!server) throw new Error("Set MOBILE_BACKEND_URL to the public HTTPS API before building a release.");
  const url = new URL(server);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("MOBILE_BACKEND_URL must be an HTTP(S) API base URL without credentials, a query or a fragment.");
  }
  if (release && url.protocol !== "https:") throw new Error("Release builds require an HTTPS API.");
  return url;
}

export function run(command, args, env, cwd = frontend) {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

export function syncMobileWeb(platform, env) {
  run(process.execPath, ["node_modules/typescript/bin/tsc", "--noEmit", "--incremental", "false"], env);
  run(process.execPath, ["node_modules/vite/bin/vite.js", "build", "--outDir", "dist-mobile", "--emptyOutDir"], env);
  run(process.execPath, ["node_modules/@capacitor/cli/bin/capacitor", "sync", platform], env);
}

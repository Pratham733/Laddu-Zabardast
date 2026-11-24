import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { mobile, mobileBackendURL, run, syncMobileWeb } from "./mobile-web.mjs";

const release = process.argv.includes("--release");
const syncOnly = process.argv.includes("--sync-only");
const url = mobileBackendURL(release);
const env = { ...process.env, VITE_BACKEND_URL: url.href.replace(/\/$/, ""), MOBILE_ALLOW_HTTP: "0" };
const defaultXcode = "/Applications/Xcode.app/Contents/Developer";
if (!env.DEVELOPER_DIR && existsSync(defaultXcode)) env.DEVELOPER_DIR = defaultXcode;

if (!syncOnly) {
  const version = spawnSync("xcodebuild", ["-version"], { env, encoding: "utf8" });
  const major = Number(version.stdout?.match(/^Xcode (\d+)/m)?.[1]);
  if (version.status !== 0 || !(major >= 26)) {
    throw new Error("Install full Xcode 26 or later and an iOS simulator runtime. Run with --sync-only to prepare the app without Xcode.");
  }
}

syncMobileWeb("ios", env);
const project = path.join(mobile, "ios", "App", "App.xcodeproj");
if (syncOnly) {
  console.log(`\nSynced iOS project: ${project}\nAPI: ${env.VITE_BACKEND_URL}`);
} else {
  const configuration = release ? "Release" : "Debug";
  const output = path.join(mobile, "output", "ios-simulator");
  run("xcodebuild", [
    "-project", project,
    "-scheme", "App",
    "-configuration", configuration,
    "-destination", "generic/platform=iOS Simulator",
    "-derivedDataPath", output,
    "CODE_SIGNING_ALLOWED=NO",
    "build",
  ], env);
  console.log(`\nBuilt ${path.join(output, "Build", "Products", `${configuration}-iphonesimulator`, "App.app")}\nAPI: ${env.VITE_BACKEND_URL}`);
}

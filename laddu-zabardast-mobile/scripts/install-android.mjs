import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const mobile = fileURLToPath(new URL("../", import.meta.url));
const apk = path.join(mobile, "output", "laddu-zabardast-debug.apk");
if (!existsSync(apk)) throw new Error("Build the APK first with npm run mobile:android.");
const sdkAdb = path.join(process.env.ANDROID_HOME || path.join(mobile, ".tools", "android-sdk"), "platform-tools", "adb");
const adb = existsSync(sdkAdb) ? sdkAdb : "adb";
const serial = process.env.ANDROID_SERIAL;
const prefix = serial ? ["-s", serial] : [];
function run(args) {
  const result = spawnSync(adb, [...prefix, ...args], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run(["reverse", "tcp:8080", "tcp:8080"]);
run(["reverse", "tcp:7000", "tcp:7000"]);
run(["install", "-r", apk]);
run(["shell", "am", "start", "-n", "com.ladduzabardast.app/.MainActivity"]);

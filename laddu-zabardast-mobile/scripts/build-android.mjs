import { existsSync, readdirSync, mkdirSync, copyFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { mobile, mobileBackendURL, run, syncMobileWeb } from "./mobile-web.mjs";

const android = path.join(mobile, "android");
const release = process.argv.includes("--release");
const url = mobileBackendURL(release);
const server = url.href.replace(/\/$/, "");
const tools = path.join(mobile, ".tools");
const bundledJava = existsSync(tools) ? readdirSync(tools).find(name =>
  name.startsWith("jdk-") && existsSync(path.join(tools, name, "Contents/Home/bin/java"))
) : undefined;
const javaHome = process.env.JAVA_HOME || (bundledJava ? path.join(tools, bundledJava, "Contents/Home") : undefined);
const sdk = process.env.ANDROID_HOME || path.join(tools, "android-sdk");
if (!javaHome) throw new Error("Install JDK 21 and set JAVA_HOME. See laddu-zabardast-mobile/README.md.");
if (!existsSync(path.join(sdk, "platforms", "android-36"))) {
  throw new Error("Install Android SDK platform 36 and set ANDROID_HOME. See the mobile README.");
}
const env = {
  ...process.env, JAVA_HOME: javaHome, ANDROID_HOME: sdk, ANDROID_SDK_ROOT: sdk,
  GRADLE_USER_HOME: path.join(mobile, ".gradle"),
  ANDROID_USER_HOME: path.join(mobile, ".android"),
  VITE_BACKEND_URL: server,
  MOBILE_ALLOW_HTTP: !release && url.protocol === "http:" ? "1" : "0",
};
syncMobileWeb("android", env);
const localGradle = path.join(tools, "gradle-8.14.3", "bin", "gradle");
run(existsSync(localGradle) ? localGradle : "./gradlew", ["--no-daemon", "--console=plain", "--quiet", release ? "bundleRelease" : "assembleDebug"], env, android);
const source = path.join(android, release ? "app/build/outputs/bundle/release/app-release.aab" : "app/build/outputs/apk/debug/app-debug.apk");
const output = path.join(mobile, "output");
mkdirSync(output, { recursive: true });
const filename = release ? "laddu-zabardast-release-unsigned.aab" : "laddu-zabardast-debug.apk";
copyFileSync(source, path.join(output, filename));
writeFileSync(path.join(output, "build-info.json"), JSON.stringify({
  appId: "com.ladduzabardast.app", builtAt: new Date().toISOString(),
  backendURL: server, type: release ? "release-unsigned" : "debug", filename,
}, null, 2) + "\n");
console.log(`\nBuilt ${path.join(output, filename)}\nAPI: ${server}`);

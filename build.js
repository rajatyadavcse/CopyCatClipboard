const { execSync } = require("child_process");
const os = require("os");
const path = require("path");

const arch = os.arch() === "arm64" ? "arm64" : "x64";
const appName = "CopyCat";

console.log(`��️  Building ${appName} for macOS (${arch})...`);

try {
  // 1️⃣ Build the .app bundle
  execSync(
    `npx electron-packager . ${appName} --platform=darwin --arch=${arch} --icon=assets/icon.icns --overwrite`,
    { stdio: "inherit" }
  );

  // 2️⃣ Path to built app
  const appPath = path.join(__dirname, `${appName}-darwin-${arch}`, `${appName}.app`);

  // 3️⃣ Create DMG installer
  console.log("📦 Creating DMG installer...");
  execSync(
    `npx electron-installer-dmg "${appPath}" "${appName}" --overwrite --icon=assets/icon.icns --format=ULFO`,
    { stdio: "inherit" }
  );

  console.log(`✅ Build complete! Check the folder for '${appName}.dmg'`);
} catch (error) {
  console.error("❌ Build failed:", error.message);
  process.exit(1);
}


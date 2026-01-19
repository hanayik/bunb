import { $ } from "bun";
import { mkdir, exists, writeFile } from "node:fs/promises";
import { join } from "node:path";

type Platform = "darwin-arm64" | "darwin-x64" | "linux-x64" | "linux-arm64";

interface PlatformConfig {
  biomePackage: string;
  bunTarget: string;
}

const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  "darwin-arm64": {
    biomePackage: "@biomejs/cli-darwin-arm64",
    bunTarget: "bun-darwin-arm64",
  },
  "darwin-x64": {
    biomePackage: "@biomejs/cli-darwin-x64",
    bunTarget: "bun-darwin-x64",
  },
  "linux-x64": {
    biomePackage: "@biomejs/cli-linux-x64",
    bunTarget: "bun-linux-x64",
  },
  "linux-arm64": {
    biomePackage: "@biomejs/cli-linux-arm64",
    bunTarget: "bun-linux-arm64",
  },
};

const BIOME_VERSION = "1.9.4";

async function downloadBiome(platform: Platform): Promise<string> {
  const config = PLATFORM_CONFIGS[platform];
  const binariesDir = join(import.meta.dir, "binaries");
  const binaryName = `biome-${platform}`;
  const binaryPath = join(binariesDir, binaryName);

  // Check if already downloaded
  if (await exists(binaryPath)) {
    console.log(`Biome binary already exists: ${binaryPath}`);
    return binaryPath;
  }

  await mkdir(binariesDir, { recursive: true });

  // Download from npm registry
  const npmUrl = `https://registry.npmjs.org/${config.biomePackage}/-/${config.biomePackage.split("/")[1]}-${BIOME_VERSION}.tgz`;
  console.log(`Downloading biome from: ${npmUrl}`);

  const response = await fetch(npmUrl);
  if (!response.ok) {
    throw new Error(`Failed to download biome: ${response.statusText}`);
  }

  // Save tarball to temp location
  const tarballPath = join(binariesDir, `biome-${platform}.tgz`);
  await Bun.write(tarballPath, response);

  // Extract the binary from the tarball
  console.log("Extracting biome binary...");
  await $`tar -xzf ${tarballPath} -C ${binariesDir}`;

  // Move the binary to the expected location
  const extractedBinary = join(binariesDir, "package", "biome");
  await $`mv ${extractedBinary} ${binaryPath}`;
  await $`chmod +x ${binaryPath}`;

  // Cleanup
  await $`rm -rf ${join(binariesDir, "package")} ${tarballPath}`;

  console.log(`Downloaded biome to: ${binaryPath}`);
  return binaryPath;
}

async function generateEntry(platform: Platform): Promise<string> {
  const entryPath = join(import.meta.dir, "src", `entry-${platform}.ts`);
  const binaryName = `biome-${platform}`;

  const content = `// Auto-generated entry point for ${platform}
import biomePath from "../binaries/${binaryName}" with { type: "file" };
import configPath from "../biome.json" with { type: "file" };
import { runCLI } from "./cli";

runCLI(biomePath, configPath);
`;

  await writeFile(entryPath, content);
  console.log(`Generated entry point: ${entryPath}`);
  return entryPath;
}

async function build(platform: Platform): Promise<void> {
  console.log(`\nBuilding bunb for ${platform}...`);

  const config = PLATFORM_CONFIGS[platform];

  // Download biome binary
  await downloadBiome(platform);

  // Generate platform-specific entry
  const entryPath = await generateEntry(platform);

  // Create dist/platform directory
  const platformDir = join(import.meta.dir, "dist", platform);
  await mkdir(platformDir, { recursive: true });

  // Build with bun
  const outputPath = join(platformDir, "bunb");
  console.log(`Compiling to: ${outputPath}`);

  await $`bun build --compile --target=${config.bunTarget} ${entryPath} --outfile ${outputPath}`;

  console.log(`\nBuild complete: ${outputPath}`);
}

// Main
const args = process.argv.slice(2);
let platform: Platform;

if (args.length === 0) {
  // Detect current platform
  const os = process.platform;
  const arch = process.arch;

  if (os === "darwin" && arch === "arm64") {
    platform = "darwin-arm64";
  } else if (os === "darwin" && arch === "x64") {
    platform = "darwin-x64";
  } else if (os === "linux" && arch === "x64") {
    platform = "linux-x64";
  } else if (os === "linux" && arch === "arm64") {
    platform = "linux-arm64";
  } else {
    console.error(`Unsupported platform: ${os}-${arch}`);
    process.exit(1);
  }
} else {
  platform = args[0] as Platform;
  if (!PLATFORM_CONFIGS[platform]) {
    console.error(`Unknown platform: ${platform}`);
    console.error(
      `Supported platforms: ${Object.keys(PLATFORM_CONFIGS).join(", ")}`
    );
    process.exit(1);
  }
}

build(platform).catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});

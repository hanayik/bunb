import { describe, test, expect, beforeAll } from "bun:test";
import { spawn } from "bun";
import { join } from "node:path";
import { existsSync } from "node:fs";

function getPlatformDir(): string {
	const os = process.platform;
	const arch = process.arch;

	if (os === "darwin" && arch === "arm64") return "darwin-arm64";
	if (os === "darwin" && arch === "x64") return "darwin-x64";
	if (os === "linux" && arch === "x64") return "linux-x64";
	if (os === "linux" && arch === "arm64") return "linux-arm64";

	throw new Error(`Unsupported platform: ${os}-${arch}`);
}

const BUNB_PATH = join(import.meta.dir, "..", "dist", getPlatformDir(), "bunb");
const FIXTURES_PATH = join(import.meta.dir, "fixtures");

async function runBunb(args: string[]): Promise<{
	stdout: string;
	stderr: string;
	exitCode: number;
}> {
	const proc = spawn({
		cmd: [BUNB_PATH, ...args],
		stdout: "pipe",
		stderr: "pipe",
	});

	const stdout = await new Response(proc.stdout).text();
	const stderr = await new Response(proc.stderr).text();
	const exitCode = await proc.exited;

	return { stdout, stderr, exitCode };
}

describe("bunb", () => {
	beforeAll(() => {
		if (!existsSync(BUNB_PATH)) {
			throw new Error(
				`bunb binary not found at ${BUNB_PATH}. Run 'bun run build' first.`,
			);
		}
	});

	describe("bun pass-through", () => {
		test("--version returns bun version", async () => {
			const result = await runBunb(["--version"]);
			expect(result.exitCode).toBe(0);
			expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
		});

		test("--help shows bun help", async () => {
			const result = await runBunb(["--help"]);
			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain("Bun is a fast JavaScript runtime");
			expect(result.stdout).toContain("Usage:");
		});

		test("eval runs JavaScript code", async () => {
			const result = await runBunb(["-e", "console.log(1 + 2)"]);
			expect(result.exitCode).toBe(0);
			expect(result.stdout.trim()).toBe("3");
		});
	});

	describe("biome format", () => {
		test("format --help shows biome format help", async () => {
			const result = await runBunb(["format", "--help"]);
			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain("Run the formatter");
			expect(result.stdout).toContain("--write");
		});

		test("format detects files needing formatting", async () => {
			const result = await runBunb([
				"format",
				join(FIXTURES_PATH, "needs-formatting"),
			]);
			// biome format exits with 0 but prints diff when files need formatting
			expect(result.stdout.length + result.stderr.length).toBeGreaterThan(0);
		});

		test("format passes on correctly formatted files", async () => {
			const result = await runBunb([
				"format",
				join(FIXTURES_PATH, "correct", "well-formatted.ts"),
			]);
			expect(result.exitCode).toBe(0);
		});
	});

	describe("biome lint", () => {
		test("lint --help shows biome lint help", async () => {
			const result = await runBunb(["lint", "--help"]);
			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain("Run various checks");
			expect(result.stdout).toContain("--write");
		});

		test("lint detects issues in files needing linting", async () => {
			const result = await runBunb([
				"lint",
				join(FIXTURES_PATH, "needs-linting"),
			]);
			// biome lint exits with non-zero when there are lint errors
			expect(result.exitCode).not.toBe(0);
			// Should detect some of our intentional issues
			expect(result.stdout + result.stderr).toMatch(
				/noDebugger|noUnusedVariables|useConst|noExplicitAny/i,
			);
		});

		test("lint passes on clean files", async () => {
			const result = await runBunb([
				"lint",
				join(FIXTURES_PATH, "correct", "clean-code.js"),
			]);
			expect(result.exitCode).toBe(0);
		});
	});

	describe("biome check", () => {
		test("check --help shows biome check help", async () => {
			const result = await runBunb(["check", "--help"]);
			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain("formatter, linter and import sorting");
		});

		test("check detects issues in mixed files", async () => {
			const result = await runBunb(["check", FIXTURES_PATH]);
			// Should fail because we have files with issues
			expect(result.exitCode).not.toBe(0);
		});

		test("check passes on correct directory", async () => {
			const result = await runBunb([
				"check",
				join(FIXTURES_PATH, "correct"),
			]);
			expect(result.exitCode).toBe(0);
		});
	});

	describe("biome ci", () => {
		test("ci --help shows biome ci help", async () => {
			const result = await runBunb(["ci", "--help"]);
			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain("CI environments");
		});

		test("ci fails on files with issues", async () => {
			const result = await runBunb(["ci", FIXTURES_PATH]);
			expect(result.exitCode).not.toBe(0);
		});

		test("ci passes on correct files", async () => {
			const result = await runBunb(["ci", join(FIXTURES_PATH, "correct")]);
			expect(result.exitCode).toBe(0);
		});
	});

	describe("command routing", () => {
		test("non-biome commands go to bun", async () => {
			// 'install' is a bun command, not a biome command
			const result = await runBunb(["install", "--help"]);
			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain("Install the dependencies");
		});

		test("build command goes to bun", async () => {
			const result = await runBunb(["build", "--help"]);
			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain("Transpile and bundle");
		});

		test("test command goes to bun", async () => {
			const result = await runBunb(["test", "--help"]);
			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain("Run all matching test files");
		});
	});
});

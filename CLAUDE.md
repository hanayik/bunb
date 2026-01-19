# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
bun install              # Install dependencies
bun run build            # Build for current platform
bun run build:darwin-arm64   # Build for macOS Apple Silicon
bun run build:linux-x64      # Build for Linux x64
bun run build:linux-arm64    # Build for Linux ARM64
bun test                 # Run all tests (requires build first)
```

## Architecture

bunb is a single executable that combines Bun and Biome. It routes commands based on the first argument:

- **Biome commands** (`format`, `lint`, `check`, `ci`) → Extracts embedded Biome binary to temp dir and executes
- **All other commands** → Passes through to Bun via `BUN_BE_BUN=1` environment variable

### Key Files

- `src/cli.ts` - Command router that decides between Biome and Bun
- `src/biome.ts` - Biome extraction and execution logic (extracts to `/tmp/biome-{pid}`)
- `src/entry-{platform}.ts` - Auto-generated platform-specific entry points that import embedded binaries
- `build.ts` - Build script that downloads Biome binaries from npm, generates entry points, and compiles with `bun build --compile`
- `binaries/` - Downloaded platform-specific Biome binaries (gitignored, created at build time)
- `biome.json` - Default Biome config embedded into the executable

### Build Process

1. Downloads Biome binary for target platform from npm registry
2. Generates `src/entry-{platform}.ts` that imports the binary using `with { type: "file" }`
3. Compiles to standalone executable with `bun build --compile --target={platform}`
4. Output goes to `dist/{platform}/bunb`

### User Config Detection

When running Biome commands, bunb searches upward from cwd for `biome.json` or `biome.jsonc`. If found, uses user's config; otherwise uses the embedded default config.

## Code Style

- Use Bun APIs over Node.js equivalents (`Bun.file`, `Bun.write`, `bun:test`, `Bun.$`)
- Single quotes, no semicolons (as needed), no trailing commas, 2-space indent
- Tests require the binary to be built first (`bun run build && bun test`)

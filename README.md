# bunb

Bun + Biome in a single executable. A drop-in replacement for [Bun](https://bun.sh) with embedded [Biome](https://biomejs.dev/) for linting and formatting.

## Install

Download the latest release for your platform:

```bash
# macOS Apple Silicon
curl -fsSL https://github.com/hanayik/bunb/releases/latest/download/bunb-darwin-arm64.tar.gz | tar -xz

# macOS Intel
curl -fsSL https://github.com/hanayik/bunb/releases/latest/download/bunb-darwin-x64.tar.gz | tar -xz

# Linux x64
curl -fsSL https://github.com/hanayik/bunb/releases/latest/download/bunb-linux-x64.tar.gz | tar -xz

# Linux ARM64
curl -fsSL https://github.com/hanayik/bunb/releases/latest/download/bunb-linux-arm64.tar.gz | tar -xz
```

Move to a directory in your PATH:

```bash
sudo mv bunb /usr/local/bin/
```

### Alias as `bun`

To use bunb as your default `bun` command, add an alias to your shell config:

```bash
# ~/.bashrc or ~/.zshrc
alias bun="bunb"
```

Then reload your shell:

```bash
source ~/.zshrc  # or ~/.bashrc
```

Now all `bun` commands will use bunb with built-in Biome support:

```bash
bun install      # Uses Bun
bun format .     # Uses Biome
bun lint src/    # Uses Biome
```

## How it works

- **Biome commands** (`format`, `lint`, `check`, `ci`) → routed to embedded Biome binary
- **All other commands** → passed through to Bun

## Default Config

Bunb includes a default Biome config with opinionated defaults:

- **Single quotes** for strings
- **No semicolons** (ASI)
- **No trailing commas**
- 2-space indentation

To override, create a `biome.json` or `biome.jsonc` in your project root.

## Usage

```bash
# Biome commands (intercepted)
bunb format .
bunb lint src/
bunb check --write .
bunb ci .

# Bun commands (pass-through)
bunb install
bunb run dev
bunb test
bunb build ./app.ts
```

## Build from source

```bash
bun install
bun run build                    # Build for current platform
bun run build:darwin-arm64       # macOS Apple Silicon
bun run build:darwin-x64         # macOS Intel
bun run build:linux-x64          # Linux x64
bun run build:linux-arm64        # Linux ARM64
```

## Test

```bash
bun test
```

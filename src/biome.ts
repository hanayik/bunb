import { spawn, file } from 'bun'
import { chmod, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'

let cachedBiomePath: string | null = null
let cachedConfigPath: string | null = null
let cleanupRegistered = false

async function extractFile(
  embeddedPath: string,
  outputPath: string,
  executable = false
): Promise<void> {
  const embeddedFile = file(embeddedPath)
  const buffer = await embeddedFile.arrayBuffer()
  await Bun.write(outputPath, buffer)
  if (executable) {
    await chmod(outputPath, 0o755)
  }
}

async function extractBiome(embeddedBiomePath: string): Promise<string> {
  if (cachedBiomePath && existsSync(cachedBiomePath)) {
    return cachedBiomePath
  }

  const tempPath = join(tmpdir(), `biome-${process.pid}`)
  await extractFile(embeddedBiomePath, tempPath, true)
  cachedBiomePath = tempPath

  if (!cleanupRegistered) {
    cleanupRegistered = true
    registerCleanup()
  }

  return tempPath
}

async function extractConfig(embeddedConfigPath: string): Promise<string> {
  if (cachedConfigPath && existsSync(cachedConfigPath)) {
    return cachedConfigPath
  }

  const tempPath = join(tmpdir(), `biome-config-${process.pid}.json`)
  await extractFile(embeddedConfigPath, tempPath, false)
  cachedConfigPath = tempPath

  return tempPath
}

function findUserConfig(startDir: string): string | null {
  let dir = startDir
  while (dir !== dirname(dir)) {
    const configPath = join(dir, 'biome.json')
    if (existsSync(configPath)) {
      return configPath
    }
    const configPathJsonc = join(dir, 'biome.jsonc')
    if (existsSync(configPathJsonc)) {
      return configPathJsonc
    }
    dir = dirname(dir)
  }
  return null
}

function registerCleanup(): void {
  const cleanup = async () => {
    const files = [cachedBiomePath, cachedConfigPath].filter(Boolean)
    for (const f of files) {
      try {
        await unlink(f!)
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  process.on('exit', () => {
    const files = [cachedBiomePath, cachedConfigPath].filter(Boolean)
    for (const f of files) {
      try {
        Bun.spawnSync(['rm', '-f', f!])
      } catch {
        // Ignore
      }
    }
  })

  process.on('SIGINT', async () => {
    await cleanup()
    process.exit(130)
  })

  process.on('SIGTERM', async () => {
    await cleanup()
    process.exit(143)
  })
}

export async function runBiome(
  embeddedBiomePath: string,
  embeddedConfigPath: string,
  args: string[]
): Promise<number> {
  const biomePath = await extractBiome(embeddedBiomePath)

  // Check if user has their own biome config
  const userConfig = findUserConfig(process.cwd())
  const configArgs: string[] = []

  if (!userConfig) {
    // Use embedded default config
    const configPath = await extractConfig(embeddedConfigPath)
    configArgs.push('--config-path', configPath)
  }

  const proc = spawn({
    cmd: [biomePath, ...args, ...configArgs],
    stdio: ['inherit', 'inherit', 'inherit']
  })

  return await proc.exited
}

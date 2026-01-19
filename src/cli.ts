import { spawn } from 'bun'
import { runBiome } from './biome'

const BIOME_COMMANDS = ['format', 'lint', 'check', 'ci']

export async function runCLI(
  embeddedBiomePath: string,
  embeddedConfigPath: string
): Promise<void> {
  const args = process.argv.slice(2)
  const firstArg = args[0]

  if (firstArg && BIOME_COMMANDS.includes(firstArg)) {
    // Route to embedded biome
    const exitCode = await runBiome(embeddedBiomePath, embeddedConfigPath, args)
    process.exit(exitCode)
  } else {
    // Pass-through to Bun by spawning self with BUN_BE_BUN=1
    const proc = spawn({
      cmd: [process.execPath, ...args],
      env: {
        ...process.env,
        BUN_BE_BUN: '1'
      },
      stdio: ['inherit', 'inherit', 'inherit']
    })

    const exitCode = await proc.exited
    process.exit(exitCode)
  }
}

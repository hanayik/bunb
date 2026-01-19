// Utility functions - correctly formatted and linted
export function capitalize(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function sum(numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0)
}

export function isEven(n: number): boolean {
  return n % 2 === 0
}

export const DEFAULT_TIMEOUT = 5000

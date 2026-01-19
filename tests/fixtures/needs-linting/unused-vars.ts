// This file has unused variables
const unusedVariable = "I am never used";
const anotherUnused = 42;

export function calculate(a: number, b: number) {
	const unusedLocal = a * 2;
	return a + b;
}

const usedVariable = "I am exported";
export { usedVariable };

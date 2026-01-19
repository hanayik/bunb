// This file uses let when const would be better
export function greet(name: string) {
	let greeting = "Hello";
	let message = greeting + ", " + name + "!";
	return message;
}

let config = {
	timeout: 1000,
	retries: 3,
};

export { config };

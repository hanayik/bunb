// This file uses explicit any
export function processData(data: any): any {
	return data;
}

export function handleEvent(event: any) {
	console.log(event);
}

const config: any = { foo: "bar" };
export { config };

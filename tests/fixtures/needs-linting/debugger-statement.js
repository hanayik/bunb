// This file has a debugger statement
function processItems(items) {
	debugger;
	return items.map((item) => item * 2);
}

module.exports = { processItems };

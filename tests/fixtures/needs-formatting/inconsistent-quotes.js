// This file has inconsistent quotes
const message = "Hello";
const greeting = 'World';
const combined = "Hello" + 'World';

function greet(name) {
  return "Hello, " + name + '!';
}

module.exports = { message, greeting, combined, greet };

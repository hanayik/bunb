// This file has lines that are too long
export function processUserDataWithVeryLongFunctionName(firstName: string, lastName: string, email: string, phoneNumber: string, address: string, city: string, country: string) {
  const fullName = firstName + " " + lastName;
  const contactInfo = { email: email, phone: phoneNumber, address: address, city: city, country: country };
  return { name: fullName, contact: contactInfo };
}

const veryLongVariableNameThatExceedsTheMaximumLineWidth = "This is a very long string that should probably be broken up into multiple lines for better readability";

export { veryLongVariableNameThatExceedsTheMaximumLineWidth };

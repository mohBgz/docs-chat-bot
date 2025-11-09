export function capitalizeFirstLetter(inputString: string): string {
  // Check if the string is empty or null to avoid errors
  if (!inputString) {
    return "";
  }
  
  // Get the first character and convert it to uppercase
  const firstLetter = inputString.charAt(0).toUpperCase();
  
  // Get the rest of the string (from the second character onwards)
  const restOfString = inputString.slice(1);
  
  // Combine them and return the new string
  return firstLetter + restOfString;
}
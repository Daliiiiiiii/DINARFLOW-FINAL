import crypto from 'crypto';

/**
 * Generates a test RIB (Relevé d'Identité Bancaire) for a user
 * Format: 5 digits bank code + 5 digits branch code + 11 digits account number + 2 digits key
 * @param {string} userId - The user's ID to generate a unique RIB
 * @returns {string} A valid test RIB
 */
export const generateTestRIB = (userId) => {
    // Generate a hash from the userId to ensure uniqueness
    const hash = crypto.createHash('sha256').update(userId.toString()).digest('hex');

    // Extract parts from the hash
    const bankCode = hash.substring(0, 5).replace(/[^0-9]/g, '0').substring(0, 5);
    const branchCode = hash.substring(5, 10).replace(/[^0-9]/g, '0').substring(0, 5);
    const accountNumber = hash.substring(10, 21).replace(/[^0-9]/g, '0').substring(0, 11);

    // Calculate the key (last 2 digits)
    const key = calculateRIBKey(bankCode + branchCode + accountNumber);

    return `${bankCode}${branchCode}${accountNumber}${key}`;
};

/**
 * Calculates the RIB key (last 2 digits) using the French banking algorithm
 * @param {string} ribWithoutKey - The RIB without the key (17 digits)
 * @returns {string} The 2-digit key
 */
const calculateRIBKey = (ribWithoutKey) => {
    // Convert letters to numbers (A=1, B=2, etc.)
    const rib = ribWithoutKey.toUpperCase().replace(/[A-Z]/g, (letter) => {
        return (letter.charCodeAt(0) - 55).toString();
    });

    // Calculate the key using the French banking algorithm
    const remainder = rib.split('').reduce((acc, digit) => {
        return ((acc * 10) + parseInt(digit)) % 97;
    }, 0);

    const key = (97 - remainder).toString().padStart(2, '0');
    return key;
};

/**
 * Validates if a RIB is in the correct format
 * @param {string} rib - The RIB to validate
 * @returns {boolean} True if the RIB is valid
 */
export const validateRIB = (rib) => {
    // Check if RIB is 20 digits
    if (!/^\d{20}$/.test(rib)) {
        return false;
    }

    // Extract parts
    const bankCode = rib.substring(0, 5);
    const branchCode = rib.substring(5, 10);
    const accountNumber = rib.substring(10, 21);
    const key = rib.substring(21, 23);

    // Calculate the expected key
    const expectedKey = calculateRIBKey(bankCode + branchCode + accountNumber);

    return key === expectedKey;
}; 
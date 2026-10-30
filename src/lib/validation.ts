/**
 * Comprehensive Validation Utility for Paneliya Enterprise HRMS
 * Provides standardized email, mobile phone, GSTIN, names, and field validators.
 */

// RFC 5322 compliant email regex
export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Standard 10-digit Indian mobile number (optionally prefixed with +91 or 0)
// Must begin with 6, 7, 8, or 9
export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

// Standard 15-character Indian Goods and Services Tax Identification Number (GSTIN)
// Structure: 2 digits (state) + 5 letters (PAN) + 4 digits + 1 letter + 1 entity num + 'Z' + 1 checksum
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Normalizes phone numbers by removing spaces, hyphens, and leading +91 or 0
 */
export function cleanPhoneNumber(raw: string): string {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

/**
 * Validates Email Address
 */
export function validateEmail(email: string, isRequired = true): ValidationResult {
  const trimmed = (email || '').trim();
  if (!trimmed) {
    return isRequired
      ? { isValid: false, error: 'Email address is required.' }
      : { isValid: true };
  }

  if (!trimmed.includes('@')) {
    return { isValid: false, error: 'Email must contain "@" (e.g. name@company.com).' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. rahul@company.com).' };
  }

  return { isValid: true };
}

/**
 * Validates 10-digit Mobile Number
 */
export function validatePhone(phone: string, isRequired = true): ValidationResult & { cleanPhone?: string } {
  const trimmed = (phone || '').trim();
  if (!trimmed) {
    return isRequired
      ? { isValid: false, error: 'Mobile / Phone number is required.' }
      : { isValid: true, cleanPhone: '' };
  }

  const clean = cleanPhoneNumber(trimmed);

  if (clean.length === 0) {
    return { isValid: false, error: 'Please enter a valid mobile number.' };
  }

  if (clean.length !== 10) {
    return {
      isValid: false,
      error: `Mobile number must be exactly 10 digits (currently ${clean.length} digits).`,
      cleanPhone: clean,
    };
  }

  if (!INDIAN_MOBILE_REGEX.test(clean)) {
    return {
      isValid: false,
      error: 'Valid Indian mobile numbers must start with 6, 7, 8, or 9.',
      cleanPhone: clean,
    };
  }

  return { isValid: true, cleanPhone: clean };
}

/**
 * Validates Indian GSTIN Number (15 Alphanumerics)
 */
export function validateGstin(gstin: string, isRequired = false): ValidationResult & { cleanGstin?: string } {
  const cleaned = (gstin || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!cleaned) {
    return isRequired
      ? { isValid: false, error: 'GSTIN / Tax ID is required.' }
      : { isValid: true, cleanGstin: '' };
  }

  if (cleaned.length !== 15) {
    return {
      isValid: false,
      error: `GSTIN must be exactly 15 characters (currently ${cleaned.length} characters). Example: 24AAAAA0000A1Z5`,
      cleanGstin: cleaned,
    };
  }

  if (!GSTIN_REGEX.test(cleaned)) {
    return {
      isValid: false,
      error: 'Invalid GSTIN format. Standard format: 2-digit state code + 10-char PAN + 1 entity + Z + 1 checksum (e.g. 24AAAAA0000A1Z5).',
      cleanGstin: cleaned,
    };
  }

  return { isValid: true, cleanGstin: cleaned };
}

/**
 * Validates First / Last Name or Company Name
 */
export function validateName(
  value: string,
  fieldLabel = 'Name',
  minLength = 2,
  isRequired = true
): ValidationResult {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return isRequired
      ? { isValid: false, error: `${fieldLabel} is required.` }
      : { isValid: true };
  }

  if (trimmed.length < minLength) {
    return {
      isValid: false,
      error: `${fieldLabel} must be at least ${minLength} characters long.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates Password
 */
export function validatePassword(password: string, minLength = 6): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required.' };
  }

  if (password.length < minLength) {
    return {
      isValid: false,
      error: `Password must be at least ${minLength} characters long.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates Password Confirmation Match
 */
export function validatePasswordMatch(pass: string, confirmPass: string): ValidationResult {
  if (pass !== confirmPass) {
    return { isValid: false, error: 'Passwords do not match. Please verify both fields.' };
  }
  return { isValid: true };
}

/**
 * Validates Login Identifier (Accepts either valid Email, 10-digit Phone, or Employee Code)
 */
export function validateLoginIdentifier(identifier: string): ValidationResult {
  const trimmed = (identifier || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Please enter your Email, Phone Number, or Employee Code.' };
  }

  // Check if it's an email
  if (trimmed.includes('@')) {
    return validateEmail(trimmed, true);
  }

  // Check if it's numeric (phone)
  const digits = cleanPhoneNumber(trimmed);
  if (digits.length >= 10 && /^\d+$/.test(digits)) {
    return validatePhone(digits, true);
  }

  // Otherwise treat as alphanumeric employee code (min 3 chars)
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Employee Code must be at least 3 characters.' };
  }

  return { isValid: true };
}

/**
 * Checks if an email or mobile phone number is already registered
 * in a provided employee list or against the logged-in user.
 * Ensures 1 Email = 1 Account and 1 Mobile Number = 1 Account.
 */
export function checkDuplicateEmailOrPhone(params: {
  email: string;
  phone: string;
  existingEmployees?: Array<{ id?: string; email?: string; phone?: string; firstName?: string; lastName?: string }>;
  currentUserEmail?: string;
  currentUserPhone?: string;
  ignoreEmployeeId?: string;
}): ValidationResult {
  const cleanEmail = (params.email || '').trim().toLowerCase();
  const cleanPhone = cleanPhoneNumber(params.phone || '');

  // 1. Check against Current User / Owner
  if (params.currentUserEmail && cleanEmail && params.currentUserEmail.trim().toLowerCase() === cleanEmail) {
    return {
      isValid: false,
      error: 'This email is already registered to the Company Owner account. 1 email can only belong to 1 account.',
    };
  }

  if (params.currentUserPhone && cleanPhone && cleanPhoneNumber(params.currentUserPhone) === cleanPhone) {
    return {
      isValid: false,
      error: 'This mobile number is already registered to the Company Owner account. 1 mobile number can only belong to 1 account.',
    };
  }

  // 2. Check against All Employees in database
  if (Array.isArray(params.existingEmployees)) {
    for (const emp of params.existingEmployees) {
      if (params.ignoreEmployeeId && emp.id === params.ignoreEmployeeId) continue;

      const empEmail = (emp.email || '').trim().toLowerCase();
      if (cleanEmail && empEmail && empEmail === cleanEmail) {
        const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'an existing employee';
        return {
          isValid: false,
          error: `This email is already in use by ${name}. Duplicate emails are not allowed (1 email = 1 account).`,
        };
      }

      const empPhone = cleanPhoneNumber(emp.phone || '');
      if (cleanPhone && empPhone && empPhone === cleanPhone) {
        const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'an existing employee';
        return {
          isValid: false,
          error: `This mobile number is already in use by ${name}. Duplicate mobile numbers are not allowed (1 phone = 1 account).`,
        };
      }
    }
  }

  return { isValid: true };
}


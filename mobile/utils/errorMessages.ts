type ErrorCode = 
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'UNAUTHORIZED'
  | 'EMAIL_EXISTS'
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_DEACTIVATED'
  | 'VERIFICATION_FAILED'
  | 'VERIFICATION_EXPIRED'
  | 'TOO_MANY_ATTEMPTS'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMITED'
  | 'UNKNOWN';

interface FriendlyError {
  title: string;
  message: string;
  action?: string;
}

const ERROR_MESSAGES: Record<ErrorCode, FriendlyError> = {
  NETWORK_ERROR: {
    title: "Connection Issue",
    message: "We couldn't connect to our servers. Please check your internet connection and try again.",
    action: "Check your WiFi or mobile data connection",
  },
  SERVER_ERROR: {
    title: "Something Went Wrong",
    message: "We're having trouble on our end. Please try again in a moment.",
    action: "Wait a few seconds and try again",
  },
  UNAUTHORIZED: {
    title: "Session Expired",
    message: "Your session has expired for security. Please sign in again.",
    action: "Sign in to continue",
  },
  EMAIL_EXISTS: {
    title: "Email Already Registered",
    message: "This email is already associated with an account. Try signing in instead, or use a different email.",
    action: "Sign in or use a different email",
  },
  INVALID_CREDENTIALS: {
    title: "Sign In Failed",
    message: "The email or password you entered doesn't match our records. Please double-check and try again.",
    action: "Check your email and password",
  },
  ACCOUNT_DEACTIVATED: {
    title: "Account Unavailable",
    message: "This account has been deactivated. If you believe this is a mistake, please contact support.",
    action: "Contact support for assistance",
  },
  VERIFICATION_FAILED: {
    title: "Invalid Code",
    message: "The verification code you entered is incorrect. Please check the code and try again.",
    action: "Check your email for the correct code",
  },
  VERIFICATION_EXPIRED: {
    title: "Code Expired",
    message: "This verification code has expired. Please request a new one.",
    action: "Request a new code",
  },
  TOO_MANY_ATTEMPTS: {
    title: "Too Many Attempts",
    message: "For your security, we've temporarily limited attempts. Please wait a few minutes before trying again.",
    action: "Wait a few minutes and try again",
  },
  NOT_FOUND: {
    title: "Not Found",
    message: "We couldn't find what you're looking for. It may have been moved or deleted.",
    action: "Go back and try again",
  },
  VALIDATION_ERROR: {
    title: "Invalid Information",
    message: "Please check the information you entered and try again.",
    action: "Review and correct the fields",
  },
  PERMISSION_DENIED: {
    title: "Access Denied",
    message: "You don't have permission to perform this action.",
    action: "Contact support if you need access",
  },
  RATE_LIMITED: {
    title: "Slow Down",
    message: "You're making requests too quickly. Please wait a moment before trying again.",
    action: "Wait a few seconds",
  },
  UNKNOWN: {
    title: "Something Went Wrong",
    message: "An unexpected error occurred. Please try again.",
    action: "Try again or contact support",
  },
};

export function parseApiError(error: string | undefined): ErrorCode {
  if (!error) return 'UNKNOWN';
  
  const lowerError = error.toLowerCase();
  
  if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('connection') || lowerError.includes('timeout')) {
    return 'NETWORK_ERROR';
  }
  
  if (lowerError.includes('401') || lowerError.includes('unauthorized') || lowerError.includes('token')) {
    return 'UNAUTHORIZED';
  }
  
  if (lowerError.includes('already registered') || lowerError.includes('email exists') || lowerError.includes('already exists')) {
    return 'EMAIL_EXISTS';
  }
  
  if (lowerError.includes('invalid email or password') || lowerError.includes('invalid credentials') || lowerError.includes('wrong password')) {
    return 'INVALID_CREDENTIALS';
  }
  
  if (lowerError.includes('deactivated') || lowerError.includes('disabled') || lowerError.includes('suspended')) {
    return 'ACCOUNT_DEACTIVATED';
  }
  
  if (lowerError.includes('verification') && lowerError.includes('invalid')) {
    return 'VERIFICATION_FAILED';
  }
  
  if (lowerError.includes('expired')) {
    return 'VERIFICATION_EXPIRED';
  }
  
  if (lowerError.includes('too many') || lowerError.includes('attempts') || lowerError.includes('locked')) {
    return 'TOO_MANY_ATTEMPTS';
  }
  
  if (lowerError.includes('not found') || lowerError.includes('404')) {
    return 'NOT_FOUND';
  }
  
  if (lowerError.includes('permission') || lowerError.includes('forbidden') || lowerError.includes('403')) {
    return 'PERMISSION_DENIED';
  }
  
  if (lowerError.includes('rate') || lowerError.includes('429') || lowerError.includes('throttl')) {
    return 'RATE_LIMITED';
  }
  
  if (lowerError.includes('500') || lowerError.includes('internal') || lowerError.includes('server error')) {
    return 'SERVER_ERROR';
  }
  
  if (lowerError.includes('required') || lowerError.includes('invalid') || lowerError.includes('validation')) {
    return 'VALIDATION_ERROR';
  }
  
  return 'UNKNOWN';
}

export function getFriendlyError(error: string | undefined): FriendlyError {
  const errorCode = parseApiError(error);
  return ERROR_MESSAGES[errorCode];
}

export function getFriendlyErrorMessage(error: string | undefined): string {
  const friendlyError = getFriendlyError(error);
  return friendlyError.message;
}

export function getFriendlyErrorTitle(error: string | undefined): string {
  const friendlyError = getFriendlyError(error);
  return friendlyError.title;
}

export { ERROR_MESSAGES, ErrorCode, FriendlyError };

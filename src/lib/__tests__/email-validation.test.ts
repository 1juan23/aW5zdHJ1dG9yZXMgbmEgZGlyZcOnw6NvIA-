/**
 * Email Security Validation Tests
 * Tests for the anti-phishing email validation system
 */

import { describe, it, expect } from 'vitest';

// RFC 5322 compliant email regex (same as edge function)
const isValidEmailSyntax = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Disposable email domains
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
  'throwaway.email', 'yopmail.com', 'sharklasers.com', 'spam4.me',
]);

const isDisposableEmail = (domain: string): boolean => {
  return DISPOSABLE_DOMAINS.has(domain);
};

// Suspicious TLDs
const SUSPICIOUS_TLDS = new Set([
  '.zip', '.mov', '.top', '.click', '.xyz', '.club', '.work',
]);

const hasSuspiciousTLD = (domain: string): boolean => {
  return Array.from(SUSPICIOUS_TLDS).some(tld => domain.endsWith(tld));
};

// Levenshtein distance for typosquatting detection
const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
};

const KNOWN_BRANDS = ['google', 'facebook', 'amazon', 'paypal', 'netflix', 'nubank', 'itau'];

const checkTyposquatting = (domain: string): { isTyposquat: boolean; similarTo?: string } => {
  const domainName = domain.split('.')[0].toLowerCase();
  
  for (const brand of KNOWN_BRANDS) {
    if (domainName === brand) continue;
    
    const distance = levenshteinDistance(domainName, brand);
    if (distance <= 2 && distance > 0) {
      return { isTyposquat: true, similarTo: brand };
    }
  }
  
  return { isTyposquat: false };
};

const hasExcessiveNumbersOrHyphens = (domain: string): boolean => {
  const domainName = domain.split('.')[0];
  const numbers = (domainName.match(/\d/g) || []).length;
  const hyphens = (domainName.match(/-/g) || []).length;
  
  return numbers >= 3 || hyphens >= 2 || (numbers + hyphens >= 4);
};

describe('Email Syntax Validation', () => {
  it('should accept valid emails', () => {
    expect(isValidEmailSyntax('user@example.com')).toBe(true);
    expect(isValidEmailSyntax('user.name@example.com')).toBe(true);
    expect(isValidEmailSyntax('user+tag@example.com')).toBe(true);
    expect(isValidEmailSyntax('user@sub.example.com')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(isValidEmailSyntax('')).toBe(false);
    expect(isValidEmailSyntax('notanemail')).toBe(false);
    expect(isValidEmailSyntax('@example.com')).toBe(false);
    expect(isValidEmailSyntax('user@')).toBe(false);
    expect(isValidEmailSyntax('user@@example.com')).toBe(false);
  });

  it('should reject emails longer than 254 characters', () => {
    const longEmail = 'a'.repeat(250) + '@example.com';
    expect(isValidEmailSyntax(longEmail)).toBe(false);
  });
});

describe('Disposable Email Detection', () => {
  it('should detect disposable email domains', () => {
    expect(isDisposableEmail('mailinator.com')).toBe(true);
    expect(isDisposableEmail('guerrillamail.com')).toBe(true);
    expect(isDisposableEmail('10minutemail.com')).toBe(true);
    expect(isDisposableEmail('yopmail.com')).toBe(true);
  });

  it('should allow legitimate domains', () => {
    expect(isDisposableEmail('gmail.com')).toBe(false);
    expect(isDisposableEmail('outlook.com')).toBe(false);
    expect(isDisposableEmail('yahoo.com')).toBe(false);
    expect(isDisposableEmail('empresa.com.br')).toBe(false);
  });
});

describe('Suspicious TLD Detection', () => {
  it('should detect suspicious TLDs', () => {
    expect(hasSuspiciousTLD('evil.zip')).toBe(true);
    expect(hasSuspiciousTLD('phishing.click')).toBe(true);
    expect(hasSuspiciousTLD('scam.xyz')).toBe(true);
    expect(hasSuspiciousTLD('fake.top')).toBe(true);
  });

  it('should allow common TLDs', () => {
    expect(hasSuspiciousTLD('example.com')).toBe(false);
    expect(hasSuspiciousTLD('example.com.br')).toBe(false);
    expect(hasSuspiciousTLD('example.org')).toBe(false);
    expect(hasSuspiciousTLD('example.net')).toBe(false);
  });
});

describe('Typosquatting Detection', () => {
  it('should detect typosquatting attempts', () => {
    expect(checkTyposquatting('googel.com').isTyposquat).toBe(true);
    expect(checkTyposquatting('gooogle.com').isTyposquat).toBe(true);
    expect(checkTyposquatting('paypa1.com').isTyposquat).toBe(true);
    expect(checkTyposquatting('facebok.com').isTyposquat).toBe(true);
    expect(checkTyposquatting('amazom.com').isTyposquat).toBe(true);
  });

  it('should allow legitimate domains', () => {
    expect(checkTyposquatting('google.com').isTyposquat).toBe(false);
    expect(checkTyposquatting('amazon.com').isTyposquat).toBe(false);
    expect(checkTyposquatting('randomcompany.com').isTyposquat).toBe(false);
  });

  it('should identify similar brand', () => {
    const result = checkTyposquatting('nubamk.com');
    expect(result.isTyposquat).toBe(true);
    expect(result.similarTo).toBe('nubank');
  });
});

describe('Excessive Numbers/Hyphens Detection', () => {
  it('should detect excessive numbers', () => {
    expect(hasExcessiveNumbersOrHyphens('abc123.com')).toBe(true);
    expect(hasExcessiveNumbersOrHyphens('test12345.com')).toBe(true);
  });

  it('should detect excessive hyphens', () => {
    expect(hasExcessiveNumbersOrHyphens('my--domain.com')).toBe(true);
    expect(hasExcessiveNumbersOrHyphens('a-b-c.com')).toBe(true);
  });

  it('should allow normal domains', () => {
    expect(hasExcessiveNumbersOrHyphens('example.com')).toBe(false);
    expect(hasExcessiveNumbersOrHyphens('my-domain.com')).toBe(false);
    expect(hasExcessiveNumbersOrHyphens('test1.com')).toBe(false);
  });
});

describe('Levenshtein Distance', () => {
  it('should calculate correct distance', () => {
    expect(levenshteinDistance('cat', 'cat')).toBe(0);
    expect(levenshteinDistance('cat', 'bat')).toBe(1);
    expect(levenshteinDistance('google', 'googel')).toBe(2);
    expect(levenshteinDistance('abc', 'xyz')).toBe(3);
  });
});

describe('Risk Score Thresholds', () => {
  const THRESHOLDS = {
    ALLOW: 29,      // 0-29: Allow
    CHALLENGE: 59,  // 30-59: Challenge (CAPTCHA/MFA)
    BLOCK: 60,      // 60-100: Block
  };

  it('should have correct threshold values', () => {
    expect(THRESHOLDS.ALLOW).toBe(29);
    expect(THRESHOLDS.CHALLENGE).toBe(59);
    expect(THRESHOLDS.BLOCK).toBe(60);
  });

  it('should categorize scores correctly', () => {
    const getStatus = (score: number) => {
      if (score >= 60) return 'BLOQUEADO';
      if (score >= 30) return 'DESAFIO';
      return 'PERMITIDO';
    };

    expect(getStatus(0)).toBe('PERMITIDO');
    expect(getStatus(29)).toBe('PERMITIDO');
    expect(getStatus(30)).toBe('DESAFIO');
    expect(getStatus(59)).toBe('DESAFIO');
    expect(getStatus(60)).toBe('BLOQUEADO');
    expect(getStatus(100)).toBe('BLOQUEADO');
  });
});


/**
 * Utilities for handling PII (Personally Identifiable Information)
 * This module provides functions for anonymizing and sanitizing PII data
 */

import { v4 as uuidv4 } from "uuid";

// Regular expressions for common PII patterns
const PII_PATTERNS = {
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  PHONE: /(\+?[\d\s]{10,15})|(\b\d{3}[-.]?\d{3}[-.]?\d{4}\b)/g,
  NAME_PATTERN: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, // Basic name pattern (First Last)
};

// Interface for a anonymization mapping
interface AnonymizationMapping {
  original: string;
  replacement: string;
  type: string;
}

/**
 * Gets or creates an anonymous token for a lead
 */
export async function getOrCreateAnonymousToken(leadId: string): Promise<string | null> {
  try {
    // Make API call to an endpoint that handles the token creation/retrieval
    const apiEndpoint = import.meta.env.VITE_API_BASE_URL || 'https://web-production-01457.up.railway.app';
    const response = await fetch(`${apiEndpoint}/api/v1/tokens/anonymous`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ lead_id: leadId })
    });
    
    if (!response.ok) {
      throw new Error(`Error retrieving anonymous token: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.token_anonimo;
  } catch (error) {
    console.error("Error managing anonymous token:", error);
    return null;
  }
}

/**
 * Sanitize a message to remove PII
 */
export function sanitizeMessage(
  message: string, 
  mappings: AnonymizationMapping[] = []
): { sanitizedText: string, mappings: AnonymizationMapping[] } {
  let sanitizedText = message;
  const updatedMappings = [...mappings];
  
  // Replace emails
  sanitizedText = sanitizedText.replace(PII_PATTERNS.EMAIL, (match) => {
    // Check if we already have a mapping for this email
    const existingMapping = updatedMappings.find(
      m => m.original === match && m.type === 'EMAIL'
    );
    
    if (existingMapping) {
      return existingMapping.replacement;
    }
    
    // Create a new mapping
    const replacement = '[EMAIL]';
    updatedMappings.push({
      original: match,
      replacement,
      type: 'EMAIL'
    });
    
    return replacement;
  });
  
  // Replace phone numbers
  sanitizedText = sanitizedText.replace(PII_PATTERNS.PHONE, (match) => {
    // Check if we already have a mapping for this phone
    const existingMapping = updatedMappings.find(
      m => m.original === match && m.type === 'PHONE'
    );
    
    if (existingMapping) {
      return existingMapping.replacement;
    }
    
    // Create a new mapping
    const replacement = '[TELÉFONO]';
    updatedMappings.push({
      original: match,
      replacement,
      type: 'PHONE'
    });
    
    return replacement;
  });
  
  // Replace names (this is more complex and may need refinement)
  sanitizedText = sanitizedText.replace(PII_PATTERNS.NAME_PATTERN, (match) => {
    // Check if we already have a mapping for this name
    const existingMapping = updatedMappings.find(
      m => m.original === match && m.type === 'NAME'
    );
    
    if (existingMapping) {
      return existingMapping.replacement;
    }
    
    // Create a new mapping
    const replacement = '[NOMBRE]';
    updatedMappings.push({
      original: match,
      replacement,
      type: 'NAME'
    });
    
    return replacement;
  });
  
  return { sanitizedText, mappings: updatedMappings };
}

/**
 * Store a sanitized message in the database
 */
export async function storeSanitizedMessage(
  messageId: string, 
  tokenAnonimo: string,
  contentSanitized: string,
  metadataSanitized: any = {}
): Promise<boolean> {
  try {
    // Use an API endpoint instead of direct Supabase client to avoid type issues
    const apiEndpoint = import.meta.env.VITE_API_BASE_URL || 'https://web-production-01457.up.railway.app';
    const response = await fetch(`${apiEndpoint}/api/v1/messages/sanitized`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mensaje_id: messageId,
        token_anonimo: tokenAnonimo,
        contenido_sanitizado: contentSanitized,
        metadata_sanitizada: metadataSanitized
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error storing sanitized message: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error("Error storing sanitized message:", error);
    return false;
  }
}

/**
 * Restore PII in a message using mappings
 */
export function restorePII(sanitizedText: string, mappings: AnonymizationMapping[]): string {
  let restoredText = sanitizedText;
  
  // Apply all mappings in reverse
  mappings.forEach(mapping => {
    restoredText = restoredText.replace(
      new RegExp(mapping.replacement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
      mapping.original
    );
  });
  
  return restoredText;
}

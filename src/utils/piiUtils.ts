
/**
 * Utilities for handling PII (Personally Identifiable Information)
 * This module provides functions for anonymizing and sanitizing PII data
 */

import { supabase } from "@/integrations/supabase/client";
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
    // Check if token already exists
    const { data: existingToken, error: fetchError } = await supabase
      .from("pii_tokens")
      .select("token_anonimo")
      .eq("lead_id", leadId)
      .eq("is_active", true)
      .maybeSingle();
    
    if (fetchError) throw fetchError;
    
    // Return existing token if found
    if (existingToken) {
      return existingToken.token_anonimo;
    }
    
    // Create a new token if none exists
    const newTokenId = uuidv4();
    
    const { data: newToken, error: insertError } = await supabase
      .from("pii_tokens")
      .insert({
        lead_id: leadId,
        token_anonimo: newTokenId,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      })
      .select("token_anonimo")
      .single();
    
    if (insertError) throw insertError;
    
    return newToken.token_anonimo;
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
    const { error } = await supabase
      .from("mensajes_sanitizados")
      .insert({
        mensaje_id: messageId,
        token_anonimo: tokenAnonimo,
        contenido_sanitizado: contentSanitized,
        metadata_sanitizada: metadataSanitized
      });
    
    if (error) throw error;
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

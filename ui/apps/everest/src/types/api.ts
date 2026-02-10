/**
 * Re-export layer for OpenAPI-generated types
 * This provides cleaner imports and gradual migration from manual types
 */
import type { components } from '@generated/api-types';

export type EverestVersion = components['schemas']['Version'];

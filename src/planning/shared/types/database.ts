/**
 * Database Type Utilities
 *
 * Type helpers for WatermelonDB models and withObservables HOC.
 * Provides better type safety than raw `as any` casts.
 *
 * @version 1.0.0
 * @since Phase 4 TypeScript Improvements
 */

import { Model } from '@nozbe/watermelondb';
import { Observable } from 'rxjs';
import type { ComponentType } from 'react';

// ==================== Model Types ====================

/**
 * Extract the raw data type from a WatermelonDB model.
 * Useful when you need the plain object representation.
 */
export type ModelData<T extends Model> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};

// ==================== withObservables Types ====================

/**
 * Type for the observable factory result.
 * Maps property names to Observable types.
 */
export type ObservableFactory<T> = {
  [K in keyof T]: Observable<T[K]>;
};

/**
 * Props that come from withObservables enhancement.
 * These are the resolved (non-observable) values passed to the component.
 */
export type EnhancedComponentProps<TModels extends Record<string, Model[]>> = {
  [K in keyof TModels]: TModels[K];
};

/**
 * Helper type for components enhanced with withObservables.
 * Use this to type the enhanced component more specifically than `as any`.
 *
 * @example
 * ```typescript
 * interface InputProps { projectId: string }
 * interface ObservedProps { sites: SiteModel[]; projects: ProjectModel[] }
 *
 * const EnhancedComponent = enhance(
 *   Component as EnhancedComponent<InputProps, ObservedProps>
 * );
 * ```
 */
export type EnhancedComponent<InputProps, ObservedProps> = ComponentType<
  InputProps & ObservedProps
>;

/**
 * Type for withObservables result when we need to cast.
 * More descriptive than bare `any` while still allowing flexibility.
 *
 * @example
 * ```typescript
 * const Enhanced = enhance(Component as WithObservablesEnhanced);
 * ```
 */
export type WithObservablesEnhanced = ComponentType<Record<string, unknown>>;

// ==================== Record Access Types ====================

/**
 * Type guard to check if a record has a specific property.
 */
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

/**
 * Safe property accessor for WatermelonDB model records.
 * Returns undefined if property doesn't exist, avoiding runtime errors.
 */
export function getModelProperty<T>(
  record: Model | null | undefined,
  property: string
): T | undefined {
  if (!record) return undefined;
  return (record as unknown as Record<string, unknown>)[property] as T | undefined;
}

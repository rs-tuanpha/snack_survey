import { ref, watch } from "vue";
import { logger } from "@/core/utils/logger";

/**
 * Type-safe localStorage hook
 * Similar to useCookie.ts but for localStorage
 * Provides reactive localStorage operations with type safety
 */

export interface LocalStorageValueMap {
  [key: string]: any;
}

export function useLocalStorage<K extends keyof LocalStorageValueMap>(
  name: K,
  defaultValue: LocalStorageValueMap[K]
) {
  const initialRaw = localStorage.getItem(name as string);
  let parsed: LocalStorageValueMap[K];

  try {
    parsed = initialRaw !== null ? JSON.parse(initialRaw) : defaultValue;
  } catch (error) {
    logger.storage.warn(`Failed to parse localStorage value for ${name}:`, error);
    parsed = defaultValue;
  }

  const storageValue = ref<LocalStorageValueMap[K]>(parsed);

  // Sync to localStorage when value changes
  watch(storageValue, (newVal) => {
    try {
      if (newVal === null || newVal === undefined) {
        localStorage.removeItem(name as string);
        logger.storage.debug(`Removed localStorage key: ${name}`);
      } else {
        localStorage.setItem(name as string, JSON.stringify(newVal));
        logger.storage.debug(`Updated localStorage key: ${name}`, newVal);
      }
    } catch (error) {
      logger.storage.error(`Failed to update localStorage key ${name}:`, error);
    }
  }, { deep: true });

  const set = (val: LocalStorageValueMap[K]) => {
    storageValue.value = val;
  };

  const remove = () => {
    storageValue.value = defaultValue;
    localStorage.removeItem(name as string);
  };

  const exists = () => {
    return localStorage.getItem(name as string) !== null;
  };

  return {
    value: storageValue,
    set,
    remove,
    exists,
  };
}

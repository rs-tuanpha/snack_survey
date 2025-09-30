import { ref, watch } from "vue";
import { getCookieRaw, setCookieRaw, deleteCookieRaw, type CookieKey, type CookieValueMap } from "../utils/cookieUtils";
import { logger } from "@/core/utils/logger";

/**
 * Enhanced cookie hook with better error handling and logging
 * Provides reactive cookie operations with type safety
 */
export function useCookie<K extends CookieKey>(
  name: K,
  defaultValue: CookieValueMap[K]
) {
  const initialRaw = getCookieRaw(name);
  let parsed: CookieValueMap[K];

  try {
    parsed = initialRaw !== null ? JSON.parse(initialRaw) : defaultValue;
  } catch (error) {
    logger.storage.warn(`Failed to parse cookie value for ${name}:`, error);
    parsed = defaultValue;
  }

  const cookieValue = ref<CookieValueMap[K]>(parsed);

  // Sync to cookie when value changes
  watch(cookieValue, (newVal) => {
    try {
      if (newVal === null || newVal === ("" as any)) {
        deleteCookieRaw(name);
        logger.storage.debug(`Removed cookie: ${name}`);
      } else {
        setCookieRaw(name, JSON.stringify(newVal));
        logger.storage.debug(`Updated cookie: ${name}`, newVal);
      }
    } catch (error) {
      logger.storage.error(`Failed to update cookie ${name}:`, error);
    }
  });

  const set = (val: CookieValueMap[K], days = 7) => {
    cookieValue.value = val;
    try {
      setCookieRaw(name, JSON.stringify(val), days);
      logger.storage.debug(`Set cookie: ${name}`, val);
    } catch (error) {
      logger.storage.error(`Failed to set cookie ${name}:`, error);
    }
  };

  const remove = () => {
    cookieValue.value = defaultValue;
    try {
      deleteCookieRaw(name);
      logger.storage.debug(`Removed cookie: ${name}`);
    } catch (error) {
      logger.storage.error(`Failed to remove cookie ${name}:`, error);
    }
  };

  const exists = () => {
    return getCookieRaw(name) !== null;
  };

  return {
    value: cookieValue,
    set,
    remove,
    exists,
  };
}

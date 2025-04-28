/**
 * Utility functions for API services
 */

/**
 * Process special data types in API responses (UUID and MetaData)
 * @param data - The data to process
 * @returns The processed data with UUIDs and MetaData converted to strings
 */
export function processSpecialDataTypes(data: any): any {
  if (!data) return data;

  // If it's a UUID object, convert to string
  if (data && typeof data === 'object' && data.constructor && data.constructor.name === 'UUID') {
    return data.toString();
  }

  // If it's a MetaData object, convert to plain object
  if (data && typeof data === 'object' && data.constructor && data.constructor.name === 'MetaData') {
    return { ...data };
  }

  // If it's an array, process each item
  if (Array.isArray(data)) {
    return data.map((item) => processSpecialDataTypes(item));
  }

  // If it's an object, process each property
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = processSpecialDataTypes(value);
      return acc;
    }, {} as Record);
  }

  // Otherwise return the data as is
  return data;
}

/**
 * Build clean params object, filtering out undefined values
 * @param params - Object with parameters
 * @returns Clean params object with all undefined values removed
 */
export function buildParams<T extends Record>(params: T): Partial {
  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as Partial);
}

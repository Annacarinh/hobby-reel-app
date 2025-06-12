import { useState, useEffect } from 'react';

function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) { // Item not found in localStorage
        return initialValue;
      }
      const parsedItem = JSON.parse(item);
      // If parsedItem is null or undefined, but initialValue is not, prefer initialValue.
      // This handles cases like localStorage storing the string "null".
      if ((parsedItem === null || parsedItem === undefined) && initialValue !== null && initialValue !== undefined) {
        return initialValue;
      }
      return parsedItem;
    } catch (error) {
      console.error("Error reading localStorage key “" + key + "”:", error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      const valueToStore = storedValue;
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error)      {
      console.error("Error setting localStorage key “" + key + "”:", error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
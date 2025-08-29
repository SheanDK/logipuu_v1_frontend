// src/utils/useMessage.ts
'use client';

import { useEffect, useState } from 'react';

/**
 * Custom hook to manage temporary success and error messages.
 */
export function useMessage(timeout = 4000) {
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), timeout);
      return () => clearTimeout(timer);
    }
  }, [successMessage, timeout]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), timeout);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, timeout]);

  return {
    successMessage,
    errorMessage,
    setSuccessMessage,
    setErrorMessage,
  };
}
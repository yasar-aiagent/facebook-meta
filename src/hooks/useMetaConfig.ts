// === src/hooks/useMetaConfig.ts ===
import { useState, useEffect } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';

export function useMetaConfig() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        const configDoc = await getDoc(doc(db, 'config', 'meta'));
        
        if (!configDoc.exists()) {
          throw new Error('Meta configuration not found');
        }
        
        const accessToken = configDoc.data().accessToken;
        
        if (!accessToken) {
          throw new Error('Meta token is empty');
        }
        
        setToken(accessToken);
      } catch (err) {
        console.error('Error loading Meta token:', err);
        setError(err instanceof Error ? err.message : 'Failed to load token');
      } finally {
        setLoading(false);
      }
    }

    fetchToken();
  }, []);

  return { token, loading, error };
}
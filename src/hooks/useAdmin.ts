import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/components/Auth/AuthProvider';

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user || !user.email) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Checking admin status for:', user.email);
        
        // Query admins collection by email
        const adminsRef = collection(db, 'admins');
        const q = query(adminsRef, where('email', '==', user.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const adminData = querySnapshot.docs[0].data();
          console.log('✅ Admin document found:', adminData);
          setIsAdmin(adminData?.isAdmin === true);
        } else {
          console.log('❌ No admin document found for email:', user.email);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('❌ Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user]);

  return { isAdmin, loading };
};
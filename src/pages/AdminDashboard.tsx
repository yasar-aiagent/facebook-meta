import React, { useState, useEffect,useRef } from 'react';
import { signOut } from 'firebase/auth';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { useAuth } from '@/components/Auth/AuthProvider';
import { RefreshCw, Trash2, Plus, Database, Users, Loader2, Video, Settings,Search, X } from 'lucide-react';
import AdminElementalAnalysisTab from '@/components/features/ElementalAnalysis/AdminElementalAnalysisTab';
import AdminSettings from '@/components/features/AdminSettings/AdminSettings';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface AdAccountInfo {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  adIds?: string[];
  adAccounts?: AdAccountInfo[];
  emailVerified: boolean;
  createdAt?: any;
}

interface AdAccount {
  id: string;
  name: string;
  status?: string;
  lastSynced?: string;
}

interface AdminDashboardProps {
  onSwitchToUserDashboard?: () => void;
}

interface PopupProps {
  message: string;
  type: 'success' | 'error' | 'confirm';
  onClose: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const Popup: React.FC<PopupProps> = ({ message, type, onClose, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-start gap-4">
          {type === 'success' && (
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          {type === 'error' && (
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          {type === 'confirm' && (
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          )}
          <div className="flex-1">
            <p className="text-gray-800 text-sm">{message}</p>
          </div>
        </div>
        
        <div className="mt-6 flex gap-3 justify-end">
          {type === 'confirm' ? (
            <>
              <button
                onClick={() => {
                  if (onCancel) {
                    onCancel();
                  } else {
                    onClose();
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirm
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface ProgressPopupProps {
  currentPage: number;
  totalFound: number;
  isLoading: boolean;
}

const ProgressPopup: React.FC<ProgressPopupProps> = ({ currentPage, totalFound, isLoading }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 sm:p-6">
        <div className="flex flex-col items-center">
          {/* Icon */}
          <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-indigo-100 rounded-full mb-3 sm:mb-4">
            {isLoading ? (
              <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600 animate-spin" />
            ) : (
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          
          {/* Title */}
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            {isLoading ? (currentPage > 0 ? 'Fetching Accounts...' : 'Saving Accounts...') : 'Complete!'}
          </h3>
          
          {/* Content */}
          <div className="text-center space-y-2 w-full">
            <p className="text-xl sm:text-2xl font-bold text-indigo-600">{totalFound}</p>
            <p className="text-xs sm:text-sm text-gray-600">
              {isLoading ? (currentPage > 0 ? 'accounts found' : 'accounts saved') : 'accounts synced'}
            </p>
            
            {/* Progress Details */}
            {isLoading && currentPage > 0 && (
              <>
                <div className="pt-3 sm:pt-4 border-t border-gray-200 mt-3 sm:mt-4">
                  <p className="text-xs sm:text-sm text-gray-500">Page {currentPage}</p>
                  <p className="text-xs text-gray-400 mt-1">Loading more accounts...</p>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3 sm:mt-4">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((currentPage / 20) * 100, 100)}%` }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface LoaderPopupProps {
  message: string;
  count?: number;
}

const LoaderPopup: React.FC<LoaderPopupProps> = ({ message, count }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 sm:p-6">
        <div className="flex flex-col items-center">
          {/* Loader Icon */}
          <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full mb-3 sm:mb-4">
            <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 text-red-600 animate-spin" />
          </div>
          
          {/* Title */}
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 text-center">
            {message}
          </h3>
          
          {/* Count (if provided) */}
          {count !== undefined && (
            <p className="text-xs sm:text-sm text-gray-600 text-center">
              Processing {count} account{count !== 1 ? 's' : ''}...
            </p>
          )}
          
          {/* Wait Message */}
          <p className="text-xs text-gray-500 mt-3 sm:mt-4 text-center">
            Please wait, this may take a moment
          </p>
        </div>
      </div>
    </div>
  );
};

interface DeleteConfirmationPopupProps {
  accounts: AdAccount[];
  onConfirm: (selectedIds: string[]) => void;
  onCancel: () => void;
}

const DeleteConfirmationPopup: React.FC<DeleteConfirmationPopupProps> = ({ accounts, onConfirm, onCancel }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleAccount = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(accId => accId !== id)
        : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === accounts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(accounts.map(acc => acc.id));
    }
  };

return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col">
      
      {/* Header */}
      <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-6">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
            Found {accounts.length} account(s) not in n8n
          </h3>
          <p className="text-xs sm:text-sm text-gray-600">
            Select the accounts you want to delete from the database:
          </p>
        </div>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto border-t border-gray-200">
        {/* Select All Header */}
        <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
          <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.length === accounts.length}
              onChange={toggleAll}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
            />
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              Select All ({selectedIds.length}/{accounts.length})
            </span>
          </label>
        </div>
        
        {/* Account List */}
        <div className="divide-y divide-gray-200">
          {accounts.map((account) => (
            <label
              key={account.id}
              className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(account.id)}
                onChange={() => toggleAccount(account.id)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                  {account.id}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 truncate">
                  {account.name}
                </div>
                {account.lastSynced && (
                  <div className="text-xs text-gray-500 mt-1">
                    Last synced: {new Date(account.lastSynced).toLocaleString()}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end border-t border-gray-200 p-4 sm:p-6">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          No, Keep All
        </button>
        <button
          onClick={() => onConfirm(selectedIds)}
          disabled={selectedIds.length === 0}
          className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Yes, Delete Selected ({selectedIds.length})
        </button>
      </div>
    </div>
  </div>
);
};

export default function AdminDashboard({ onSwitchToUserDashboard }: AdminDashboardProps) {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'accounts' | 'elemental' | 'settings'>('users');

  // Add these with your other state declarations around line 30
const [accountDropdownSearchQuery, setAccountDropdownSearchQuery] = useState('');
const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
const accountDropdownRef = useRef<HTMLDivElement>(null);
  
  // Users management state
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newAdId, setNewAdId] = useState('');
  const [isAddingAdId, setIsAddingAdId] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isDeletingUsers, setIsDeletingUsers] = useState(false);

  // Ad accounts state
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [newAccountId, setNewAccountId] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [accountSearchTerm, setAccountSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState<{ 
    message: string; 
    type: 'success' | 'error' | 'confirm'; 
    onConfirm?: () => void;
    onCancel?: () => void;
  } | null>(null);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    accounts: AdAccount[];
    validAccounts: AdAccount[];
  } | null>(null);

  const [progressPopup, setProgressPopup] = useState<{
    currentPage: number;
    totalFound: number;
    isLoading: boolean;
  } | null>(null);

  const [loaderPopup, setLoaderPopup] = useState<{
    message: string;
    count?: number;
  } | null>(null);

  // Toggle single account selection
  const toggleAccountSelection = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  // Toggle all accounts selection
  const toggleSelectAll = () => {
    if (selectedAccounts.length === filteredAccounts.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(filteredAccounts.map(acc => acc.id));
    }
  };

  // Bulk delete selected accounts
  const handleBulkDelete = () => {
    if (selectedAccounts.length === 0) return;
    
    setPopup({
      message: `Delete ${selectedAccounts.length} selected account(s)? This will also remove them from all users.`,
      type: 'confirm',
      onConfirm: async () => {
        setPopup(null);
        setLoaderPopup({
          message: 'Deleting Accounts',
          count: selectedAccounts.length
        });
        
        try {
          for (const accountId of selectedAccounts) {
            await deleteDoc(doc(db, 'adAccounts', accountId));
            
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const updatePromises: Promise<void>[] = [];
            
            usersSnapshot.forEach((userDoc) => {
              const userData = userDoc.data() as User;
              
              if (userData.adAccounts && userData.adAccounts.length > 0) {
                const accountToRemove = userData.adAccounts.find(acc => acc.id === accountId);
                if (accountToRemove) {
                  updatePromises.push(
                    updateDoc(doc(db, 'users', userDoc.id), {
                      adAccounts: arrayRemove(accountToRemove)
                    })
                  );
                }
              }
              
              if (userData.adIds && userData.adIds.includes(accountId)) {
                updatePromises.push(
                  updateDoc(doc(db, 'users', userDoc.id), {
                    adIds: arrayRemove(accountId)
                  })
                );
              }
            });
            
            await Promise.all(updatePromises);
          }
          
          await fetchAdAccounts();
          await fetchUsers();
          setSelectedAccounts([]);
          
          setLoaderPopup(null);
          setPopup({ 
            message: `Successfully deleted ${selectedAccounts.length} account(s)!`, 
            type: 'success' 
          });
        } catch (error) {
          console.error('Error bulk deleting accounts:', error);
          setLoaderPopup(null);
          setPopup({ message: 'Failed to delete accounts', type: 'error' });
        }
      }
    });
  };

  const getUserAdAccounts = (user: User): AdAccountInfo[] => {
    if (user.adAccounts && user.adAccounts.length > 0) {
      return user.adAccounts;
    }
    if (user.adIds && user.adIds.length > 0) {
      return user.adIds.map(id => {
        const account = adAccounts.find(acc => acc.id === id);
        return { id, name: account?.name || 'Unknown' };
      });
    }
    return [];
  };

  useEffect(() => {
    fetchUsers();
    fetchAdAccounts();
  }, []);

  // Add this useEffect with your other useEffects
useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
      setIsAccountDropdownOpen(false);
    }
  }
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

  const filteredAccounts = adAccounts.filter(account =>
    account.id.toLowerCase().includes(accountSearchTerm.toLowerCase()) ||
    account.name.toLowerCase().includes(accountSearchTerm.toLowerCase())
  );


  // Add this before the return statement, around line 280
const filteredAccountsForDropdown = adAccounts.filter(account => {
  const searchLower = accountDropdownSearchQuery.toLowerCase();
  return (
    account.id.toLowerCase().includes(searchLower) ||
    account.name.toLowerCase().includes(searchLower)
  );
});

// Get selected account display text
const selectedAccountForUser = adAccounts.find(acc => acc.id === newAdId);
const selectedAccountText = selectedAccountForUser 
  ? `${selectedAccountForUser.id} - ${selectedAccountForUser.name}`
  : '';

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [accountSearchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList: User[] = [];
      
      usersSnapshot.forEach((doc) => {
        usersList.push({
          id: doc.id,
          ...doc.data()
        } as User);
      });

      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdAccounts = async () => {
    try {
      console.log('📥 Fetching accounts from Firestore...');
      
      const accountsSnapshot = await getDocs(collection(db, 'adAccounts'));
      
      console.log('📊 Total documents in Firestore:', accountsSnapshot.size);
      
      const accountsList: AdAccount[] = [];
      
      accountsSnapshot.forEach((doc) => {
        console.log('📄 Found document:', doc.id, doc.data());
        accountsList.push({
          id: doc.id,
          ...doc.data()
        } as AdAccount);
      });

      console.log('✅ Final accountsList:', accountsList.length, 'accounts');
      console.log('📋 Account IDs:', accountsList.map(a => a.id));

      setAdAccounts(accountsList);
      
      console.log('💾 State updated with', accountsList.length, 'accounts');
    } catch (error) {
      console.error('❌ Error fetching ad accounts:', error);
    }
  };

  const syncWithN8N = async () => {
    setSyncing(true);
    
    try {
      const configDoc = await getDoc(doc(db, 'config', 'meta'));
      if (!configDoc.exists()) throw new Error('Meta token not found');
      
      const accessToken = configDoc.data().accessToken;
      if (!accessToken) throw new Error('Meta token is empty');
      
      let allAccounts: any[] = [];
      let url: string | null = `https://graph.facebook.com/v22.0/me/adaccounts?fields=id,name,account_id,account_status&limit=500&access_token=${accessToken}`;
      let pageCount = 0;
      
      while (url && pageCount < 20) {
        pageCount++;
        
        setProgressPopup({
          currentPage: pageCount,
          totalFound: allAccounts.length,
          isLoading: true
        });
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Meta API error: ${response.status}`);

        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
          allAccounts = allAccounts.concat(data.data);
        }
        
        url = data.paging?.next || null;
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setProgressPopup({
        currentPage: pageCount,
        totalFound: allAccounts.length,
        isLoading: false
      });

      await new Promise(resolve => setTimeout(resolve, 1500));
      setProgressPopup(null);

      if (allAccounts.length === 0) {
        setPopup({ message: 'No ad accounts found', type: 'error' });
        return;
      }

      const metaAccounts: AdAccount[] = allAccounts.map((account: any) => ({
        id: account.id,
        name: account.name || account.account_id || 'Unnamed Account',
        status: account.account_status === 1 ? 'active' : 'inactive'
      }));

      const accountsToDelete = adAccounts.filter(acc => 
        !metaAccounts.some(newAcc => newAcc.id === acc.id)
      );

      if (accountsToDelete.length > 0) {
        setDeleteConfirmation({
          accounts: accountsToDelete,
          validAccounts: metaAccounts
        });
      } else {
        await performSync(metaAccounts);
      }
      
    } catch (error: any) {
      setProgressPopup(null);
      setPopup({ 
        message: error.message || 'Failed to sync accounts', 
        type: 'error' 
      });
    } finally {
      setSyncing(false);
    }
  };

  const performSync = async (n8nAccounts: AdAccount[]) => {
    try {
      console.log('💾 Starting to save', n8nAccounts.length, 'accounts to Firestore...');
      
      setProgressPopup({
        currentPage: 0,
        totalFound: 0,
        isLoading: true
      });
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const account of n8nAccounts) {
        try {
          console.log('💾 Attempting to save:', account.id, '-', account.name);
          
          await setDoc(doc(db, 'adAccounts', account.id), {
            name: account.name,
            status: account.status || 'active',
            lastSynced: new Date().toISOString()
          });
          
          successCount++;
          
          setProgressPopup({
            currentPage: 0,
            totalFound: successCount,
            isLoading: true
          });
          
          console.log('✅ Successfully saved:', account.id);
        } catch (saveError) {
          errorCount++;
          console.error('❌ Failed to save:', account.id, saveError);
        }
      }
      
      setProgressPopup({
        currentPage: 0,
        totalFound: successCount,
        isLoading: false
      });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProgressPopup(null);
      
      console.log(`📊 Save summary: ${successCount} successful, ${errorCount} failed`);
      console.log('🔄 Refreshing local account list...');
      
      await fetchAdAccounts();
      
      console.log('✅ Sync completed!');
      setPopup({ 
        message: `Successfully synced ${successCount} account(s)!${errorCount > 0 ? ` (${errorCount} failed)` : ''}`, 
        type: 'success' 
      });
    } catch (error) {
      setProgressPopup(null);
      console.error('❌ Error in performSync:', error);
      setPopup({ message: 'Failed to save accounts to database', type: 'error' });
    }
  };

  const handleManualAddAccount = async () => {
    if (!newAccountId.trim() || !newAccountName.trim()) {
      setPopup({ message: 'Please enter both ID and name', type: 'error' });
      return;
    }

    try {
      console.log('Attempting to add account:', { id: newAccountId, name: newAccountName });
      
      await setDoc(doc(db, 'adAccounts', newAccountId.trim()), {
        name: newAccountName.trim(),
        status: 'active',
        lastSynced: new Date().toISOString()
      });

      console.log('Account added successfully');
      setNewAccountId('');
      setNewAccountName('');
      await fetchAdAccounts();
      setPopup({ message: 'Ad account added successfully!', type: 'success' });
    } catch (error: any) {
      console.error('Error adding ad account:', error);
      setPopup({ 
        message: `Failed to add ad account: ${error.message || 'Unknown error'}`, 
        type: 'error' 
      });
    }
  };

 const handleDeleteAccount = (accountId: string, accountName: string) => {
  setPopup({
    message: `Delete account "${accountName}" (${accountId})? This will also remove it from all users.`,
    type: 'confirm',
    onConfirm: () => {
      // ✅ Show loader immediately and close confirmation
      setPopup(null);
      setLoaderPopup({
        message: 'Deleting Account',
        count: 1
      });
      
      // ✅ Process in background (non-blocking)
      Promise.resolve().then(async () => {
        try {
          // Delete account
          await deleteDoc(doc(db, 'adAccounts', accountId));
          
          // Remove from all users
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const updatePromises: Promise<void>[] = [];
          
          usersSnapshot.forEach((userDoc) => {
            const userData = userDoc.data() as User;
            
            if (userData.adAccounts && userData.adAccounts.length > 0) {
              const hasAccount = userData.adAccounts.some(acc => acc.id === accountId);
              if (hasAccount) {
                const accountToRemove = userData.adAccounts.find(acc => acc.id === accountId);
                if (accountToRemove) {
                  updatePromises.push(
                    updateDoc(doc(db, 'users', userDoc.id), {
                      adAccounts: arrayRemove(accountToRemove)
                    })
                  );
                }
              }
            }
            
            if (userData.adIds && userData.adIds.length > 0) {
              const hasAccountLegacy = userData.adIds.includes(accountId);
              if (hasAccountLegacy) {
                updatePromises.push(
                  updateDoc(doc(db, 'users', userDoc.id), {
                    adIds: arrayRemove(accountId)
                  })
                );
              }
            }
          });
          
          await Promise.all(updatePromises);
          await fetchAdAccounts();
          await fetchUsers();
          
          if (selectedUser) {
            const updatedUser = users.find(u => u.id === selectedUser.id);
            if (updatedUser) {
              setSelectedUser(updatedUser);
            }
          }
          
          // ✅ Hide loader and show success
          setLoaderPopup(null);
          setPopup({ 
            message: `Account deleted successfully! Removed from ${updatePromises.length} user(s).`, 
            type: 'success' 
          });
        } catch (error) {
          console.error('Error deleting account:', error);
          setLoaderPopup(null);
          setPopup({ message: 'Failed to delete account', type: 'error' });
        }
      });
    }
  });
};

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

//  const handleDeleteUser = (userId: string, userName: string, userEmail: string) => {
//   setPopup({
//     message: `Delete user "${userName}" (${userEmail})? This will permanently remove their account from both Firestore and Firebase Authentication.`,
//     type: 'confirm',
//     onConfirm: async () => {
//       setPopup(null);
//       setLoaderPopup({
//         message: 'Deleting User',
//         count: 1
//       });
      
//       try {
//         // Call the Cloud Function to delete from both Auth and Firestore
//         const functions = getFunctions();
//         const deleteAuthUser = httpsCallable(functions, 'deleteAuthUser');
        
//         console.log('🗑️ Calling deleteAuthUser function for:', userId);
//         const result = await deleteAuthUser({ uid: userId });
        
//         console.log('✅ Cloud Function result:', result.data);
        
//         // Refresh the users list
//         await fetchUsers();
        
//         if (selectedUser?.id === userId) {
//           setSelectedUser(null);
//         }
        
//         setLoaderPopup(null);
//         setPopup({ 
//           message: 'User deleted successfully from both Authentication and Database!', 
//           type: 'success' 
//         });
//       } catch (error: any) {
//         console.error('❌ Error deleting user:', error);
//         setLoaderPopup(null);
        
//         let errorMessage = 'Failed to delete user';
//         if (error.code === 'permission-denied') {
//           errorMessage = 'You do not have permission to delete users';
//         } else if (error.message) {
//           errorMessage = error.message;
//         }
        
//         setPopup({ 
//           message: errorMessage, 
//           type: 'error' 
//         });
//       }
//     }
//   });
// };


const handleDeleteUser = (userId: string, userName: string, userEmail: string) => {
  setPopup({
    message: `Delete user "${userName}" (${userEmail})? This will permanently remove their account from Firestore.`,
    type: 'confirm',
    onConfirm: async () => {
      setPopup(null);
      setLoaderPopup({
        message: 'Deleting User',
        count: 1
      });
      
      try {
        await deleteDoc(doc(db, 'users', userId));
        console.log('✅ User deleted from Firestore');
        
        await fetchUsers();
        
        if (selectedUser?.id === userId) {
          setSelectedUser(null);
        }
        
        setLoaderPopup(null);
        setPopup({ 
          message: 'User deleted successfully!', 
          type: 'success' 
        });
      } catch (error) {
        console.error('❌ Error deleting user:', error);
        setLoaderPopup(null);
        setPopup({ 
          message: `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`, 
          type: 'error' 
        });
      }
    }
  });
};

//  const handleBulkDeleteUsers = () => {
//   if (selectedUsers.length === 0) return;
  
//   setPopup({
//     message: `Delete ${selectedUsers.length} selected user(s)? This will permanently remove their accounts from both Firestore and Firebase Authentication.`,
//     type: 'confirm',
//     onConfirm: async () => {
//       setPopup(null);
//       setLoaderPopup({
//         message: 'Deleting Users',
//         count: selectedUsers.length
//       });
      
//       try {
//         const functions = getFunctions();
//         const deleteAuthUser = httpsCallable(functions, 'deleteAuthUser');
        
//         let successCount = 0;
//         let errorCount = 0;
        
//         for (const userId of selectedUsers) {
//           try {
//             await deleteAuthUser({ uid: userId });
//             console.log('✅ User deleted:', userId);
//             successCount++;
//           } catch (error) {
//             console.error('❌ Failed to delete user:', userId, error);
//             errorCount++;
//           }
//         }
        
//         await fetchUsers();
//         setSelectedUsers([]);
        
//         if (selectedUser && selectedUsers.includes(selectedUser.id)) {
//           setSelectedUser(null);
//         }
        
//         setLoaderPopup(null);
//         setPopup({ 
//           message: `Successfully deleted ${successCount} user(s)!${errorCount > 0 ? ` (${errorCount} failed)` : ''}`, 
//           type: 'success' 
//         });
//       } catch (error) {
//         console.error('❌ Error bulk deleting users:', error);
//         setLoaderPopup(null);
//         setPopup({ 
//           message: `Failed to delete users: ${error instanceof Error ? error.message : 'Unknown error'}`, 
//           type: 'error' 
//         });
//       }
//     }
//   });
// };




const handleBulkDeleteUsers = () => {
  if (selectedUsers.length === 0) return;
  
  setPopup({
    message: `Delete ${selectedUsers.length} selected user(s)? This will permanently remove their accounts from Firestore.`,
    type: 'confirm',
    onConfirm: async () => {
      setPopup(null);
      setLoaderPopup({
        message: 'Deleting Users',
        count: selectedUsers.length
      });
      
      try {
        let successCount = 0;
        let errorCount = 0;
        
        for (const userId of selectedUsers) {
          try {
            await deleteDoc(doc(db, 'users', userId));
            console.log('✅ User deleted from Firestore:', userId);
            successCount++;
          } catch (error) {
            console.error('❌ Failed to delete user:', userId, error);
            errorCount++;
          }
        }
        
        await fetchUsers();
        setSelectedUsers([]);
        
        if (selectedUser && selectedUsers.includes(selectedUser.id)) {
          setSelectedUser(null);
        }
        
        setLoaderPopup(null);
        setPopup({ 
          message: `Successfully deleted ${successCount} user(s)!${errorCount > 0 ? ` (${errorCount} failed)` : ''}`, 
          type: 'success' 
        });
      } catch (error) {
        console.error('❌ Error bulk deleting users:', error);
        setLoaderPopup(null);
        setPopup({ 
          message: `Failed to delete users: ${error instanceof Error ? error.message : 'Unknown error'}`, 
          type: 'error' 
        });
      }
    }
  });
};

  const handleAddAdId = async () => {
    if (!selectedUser || !newAdId.trim()) return;

    const trimmedAdId = newAdId.trim();
    const userAdAccounts = getUserAdAccounts(selectedUser);
    
    if (userAdAccounts.some(acc => acc.id === trimmedAdId)) {
      setPopup({ message: 'This Ad Account is already assigned to this user!', type: 'error' });
      return;
    }

    const selectedAccount = adAccounts.find(acc => acc.id === trimmedAdId);
    if (!selectedAccount) {
      setPopup({ message: 'Ad Account not found!', type: 'error' });
      return;
    }

    setIsAddingAdId(true);
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      const newAccountInfo: AdAccountInfo = {
        id: selectedAccount.id,
        name: selectedAccount.name
      };
      
      await updateDoc(userRef, {
        adAccounts: arrayUnion(newAccountInfo)
      });

      const updatedUsersSnapshot = await getDocs(collection(db, 'users'));
      const updatedUsersList: User[] = [];
      
      updatedUsersSnapshot.forEach((doc) => {
        updatedUsersList.push({
          id: doc.id,
          ...doc.data()
        } as User);
      });

      setUsers(updatedUsersList);

      const updatedSelectedUser = updatedUsersList.find(u => u.id === selectedUser.id);
      if (updatedSelectedUser) {
        setSelectedUser(updatedSelectedUser);
      }

      setNewAdId('');
      setPopup({ message: 'Ad Account added successfully!', type: 'success' });
    } catch (error) {
      console.error('Error adding ad account:', error);
      setPopup({ message: 'Error adding ad account. Please try again.', type: 'error' });
    } finally {
      setIsAddingAdId(false);
    }
  };


  // Add these around line 400 with other handlers
const handleSelectAccountForUser = (accountId: string) => {
  setNewAdId(accountId);
  setIsAccountDropdownOpen(false);
  setAccountDropdownSearchQuery('');
};

const handleClearAccountSelection = () => {
  setNewAdId('');
  setAccountDropdownSearchQuery('');
};

  const handleRemoveAdId = async (userId: string, accountInfo: AdAccountInfo) => {
    setPopup({
      message: `Remove ad account "${accountInfo.name}" (${accountInfo.id})?`,
      type: 'confirm',
      onConfirm: async () => {
        setPopup(null);
        try {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            adAccounts: arrayRemove(accountInfo)
          });

          setUsers(users.map(u => 
            u.id === userId 
              ? { ...u, adAccounts: (u.adAccounts || []).filter(acc => acc.id !== accountInfo.id) }
              : u
          ));

          if (selectedUser?.id === userId) {
            setSelectedUser({
              ...selectedUser,
              adAccounts: (selectedUser.adAccounts || []).filter(acc => acc.id !== accountInfo.id)
            });
          }

          setPopup({ message: 'Ad Account removed successfully!', type: 'success' });
        } catch (error) {
          console.error('Error removing ad account:', error);
          setPopup({ message: 'Error removing ad account. Please try again.', type: 'error' });
        }
      }
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {popup && (
        <Popup
          message={popup.message}
          type={popup.type}
          onClose={() => setPopup(null)}
          onConfirm={popup.onConfirm}
          onCancel={popup.onCancel}
        />
      )}

     {deleteConfirmation && (
  <DeleteConfirmationPopup
    accounts={deleteConfirmation.accounts}
    onConfirm={async (selectedIds) => {
      console.log('🗑️ User selected to delete:', selectedIds);
      
      // ✅ Show loader immediately and hide confirmation
      setLoaderPopup({
        message: 'Deleting Accounts',
        count: selectedIds.length
      });
      setDeleteConfirmation(null);
      
      // ✅ Run deletion asynchronously (non-blocking)
      (async () => {
        try {
          // Delete selected accounts
          for (const accountId of selectedIds) {
            await deleteDoc(doc(db, 'adAccounts', accountId));
            console.log('🗑️ Deleted:', accountId);
          }
          
          // Sync new accounts
          await performSync(deleteConfirmation.validAccounts);
          
          // Hide loader and show success
          setLoaderPopup(null);
          setPopup({
            message: `Successfully deleted ${selectedIds.length} account(s) and synced new accounts!`,
            type: 'success'
          });
        } catch (error) {
          console.error('❌ Error during deletion:', error);
          setLoaderPopup(null);
          setPopup({
            message: 'Failed to complete operation',
            type: 'error'
          });
        }
      })();
    }}
    onCancel={async () => {
      console.log('ℹ️ User chose to keep all accounts');
      
      // ✅ Show loader immediately and hide confirmation
      setLoaderPopup({
        message: 'Saving Accounts',
        count: deleteConfirmation.validAccounts.length
      });
      setDeleteConfirmation(null);
      
      // ✅ Run sync asynchronously (non-blocking)
      (async () => {
        try {
          await performSync(deleteConfirmation.validAccounts);
          
          setLoaderPopup(null);
          setPopup({
            message: 'Accounts synced successfully!',
            type: 'success'
          });
        } catch (error) {
          console.error('❌ Error during sync:', error);
          setLoaderPopup(null);
          setPopup({
            message: 'Failed to sync accounts',
            type: 'error'
          });
        }
      })();
    }}
  />
)}

      {progressPopup && (
        <ProgressPopup
          currentPage={progressPopup.currentPage}
          totalFound={progressPopup.totalFound}
          isLoading={progressPopup.isLoading}
        />
      )}

      {loaderPopup && (
        <LoaderPopup
          message={loaderPopup.message}
          count={loaderPopup.count}
        />
      )}
    {/* Header */}
<div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-14 sm:h-16">
      {/* Logo & Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div className="bg-indigo-600 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
          <svg width="20" height="20" className="sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">Admin Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Manage users and ad accounts</p>
        </div>
      </div>
      
      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
  {onSwitchToUserDashboard && (
    <button
      onClick={onSwitchToUserDashboard}
      className="flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 text-xs sm:text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
    >
      <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
      <span className="hidden sm:inline">Dashboard</span>
    </button>
  )}
  
  <div className="text-right hidden md:block">
    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[150px]">
      {currentUser?.displayName || currentUser?.email}
    </p>
    <p className="text-xs text-indigo-600">Administrator</p>
  </div>
  
  <button
    onClick={handleLogout}
    className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
  >
    <span className="hidden sm:inline">Logout</span>
    <svg className="w-4 h-4 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  </button>
</div>
    </div>

    {/* Tabs */}
    <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-px -mb-px scrollbar-hide">
      <button
        onClick={() => setActiveTab('users')}
        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
          activeTab === 'users'
            ? 'border-indigo-600 text-indigo-600 font-medium'
            : 'border-transparent text-gray-600 hover:text-gray-900'
        }`}
      >
        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="text-xs sm:text-sm">User Management</span>
      </button>
      
      <button
        onClick={() => setActiveTab('accounts')}
        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
          activeTab === 'accounts'
            ? 'border-indigo-600 text-indigo-600 font-medium'
            : 'border-transparent text-gray-600 hover:text-gray-900'
        }`}
      >
        <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="text-xs sm:text-sm">Ad Accounts</span>
      </button>

      <button
        onClick={() => setActiveTab('elemental')}
        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
          activeTab === 'elemental'
            ? 'border-indigo-600 text-indigo-600 font-medium'
            : 'border-transparent text-gray-600 hover:text-gray-900'
        }`}
      >
        <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="text-xs sm:text-sm">Elemental Analyse</span>
      </button>

      <button
        onClick={() => setActiveTab('settings')}
        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
          activeTab === 'settings'
            ? 'border-indigo-600 text-indigo-600 font-medium'
            : 'border-transparent text-gray-600 hover:text-gray-900'
        }`}
      >
        <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="text-xs sm:text-sm">Settings</span>
      </button>
    </div>
  </div>
</div>
  {/* Content */}
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
  {activeTab === 'users' ? (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
      {/* Users List - Left Side */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  All Users ({users.length})
                </h2>
                {selectedUsers.length > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {selectedUsers.length} selected
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {selectedUsers.length > 0 && (
                  <button
                    onClick={handleBulkDeleteUsers}
                    disabled={isDeletingUsers}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isDeletingUsers ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                        <span className="hidden sm:inline">Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </>
                    )}
                  </button>
                )}
                
                <button
                  onClick={fetchUsers}
                  className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-medium px-2"
                >
                  Refresh
                </button>
              </div>
            </div>
            
            {/* Search */}
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* User List */}
          <div className="max-h-[500px] sm:max-h-[600px] overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-sm text-gray-500">No users found</div>
            ) : (
              <>
                {/* Select All Header */}
                <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 z-10">
                  <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={toggleSelectAllUsers}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">
                      Select All ({selectedUsers.length}/{filteredUsers.length})
                    </span>
                  </label>
                </div>

                {/* Users */}
                <div className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => {
                    const userAdAccounts = getUserAdAccounts(user);
                    const isSelected = selectedUsers.includes(user.id);
                    
                    return (
                      <div
                        key={user.id}
                        className={`transition-colors ${
                          isSelected 
                            ? 'bg-indigo-50' 
                            : selectedUser?.id === user.id
                              ? 'bg-indigo-50 border-l-4 border-indigo-600'
                              : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleUserSelection(user.id)}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer mt-0.5 sm:mt-1"
                            onClick={(e) => e.stopPropagation()}
                          />
                          
                          {/* User Info */}
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => setSelectedUser(user)}
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium text-sm sm:text-base text-gray-900 truncate">{user.name}</h3>
                              {user.emailVerified && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  ✓ Verified
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">{user.email}</p>
                            {userAdAccounts.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {userAdAccounts.slice(0, 3).map((account, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-0.5 sm:py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                                    title={account.name}
                                  >
                                    {account.id}
                                  </span>
                                ))}
                                {userAdAccounts.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-0.5 sm:py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                    +{userAdAccounts.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-right hidden sm:block">
                              <p className="text-xs text-gray-500">
                                {userAdAccounts.length} account{userAdAccounts.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUser(user.id, user.name, user.email);
                              }}
                              className="text-red-600 hover:text-red-700 p-1.5 sm:p-2"
                              title="Delete this user"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Manage Ad Accounts - Right Side */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 lg:sticky lg:top-8">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Manage Ad Accounts</h2>
          </div>

          {selectedUser ? (
            <div className="p-4 sm:p-6">
              {/* User Info */}
              <div className="mb-4 sm:mb-6">
                <h3 className="font-medium text-sm sm:text-base text-gray-900 mb-1 truncate">{selectedUser.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600 truncate">{selectedUser.email}</p>
              </div>

              {/* Add New Account */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Add New Ad Account
                </label>
        {adAccounts.length > 0 ? (
  <div className="space-y-2">
    {/* Searchable Dropdown */}
    <div className="relative" ref={accountDropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder={newAdId ? selectedAccountText : "Search ad accounts..."}
          value={isAccountDropdownOpen ? accountDropdownSearchQuery : (newAdId ? selectedAccountText : '')}
          onChange={(e) => {
            setAccountDropdownSearchQuery(e.target.value);
            setIsAccountDropdownOpen(true);
          }}
          onFocus={() => setIsAccountDropdownOpen(true)}
        />
        {newAdId && (
          <button
            onClick={handleClearAccountSelection}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown List */}
      {isAccountDropdownOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredAccountsForDropdown.length > 0 ? (
            filteredAccountsForDropdown.map((account) => (
              <button
                key={account.id}
                className={`w-full text-left px-3 sm:px-4 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
                  newAdId === account.id ? 'bg-indigo-50 text-indigo-700' : ''
                }`}
                onClick={() => handleSelectAccountForUser(account.id)}
              >
                <div className="font-medium text-xs sm:text-sm text-gray-900">{account.id}</div>
                {account.name && (
                  <div className="text-xs text-gray-500 mt-0.5">{account.name}</div>
                )}
              </button>
            ))
          ) : (
            <div className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-500 text-center">
              No accounts found for "{accountDropdownSearchQuery}"
            </div>
          )}
        </div>
      )}
    </div>

    {/* Add Button */}
    <button
      onClick={handleAddAdId}
      disabled={isAddingAdId || !newAdId.trim()}
      className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isAddingAdId ? (
        <>
          <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
          Adding...
        </>
      ) : (
        <>
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Add Account
        </>
      )}
    </button>
  </div>
                ) : (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs sm:text-sm text-yellow-800">
                    No ad accounts available. Please add accounts in the "Ad Accounts" tab first.
                  </div>
                )}
              </div>

              {/* Current Accounts */}
              <div>
                {(() => {
                  const userAdAccounts = getUserAdAccounts(selectedUser);
                  return (
                    <>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Current Ad Accounts ({userAdAccounts.length})
                      </label>
                      {userAdAccounts.length > 0 ? (
                        <div className="space-y-2">
                          {userAdAccounts.map((account, idx) => (
                            <div
                              key={idx}
                              className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-xs sm:text-sm text-gray-900 truncate">{account.id}</div>
                                <div className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">{account.name}</div>
                              </div>
                              <button
                                onClick={() => handleRemoveAdId(selectedUser.id, account)}
                                className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium ml-2 flex-shrink-0"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 sm:py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                          <p className="text-xs sm:text-sm">No ad accounts assigned yet</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 text-center text-gray-500">
              <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <p className="text-xs sm:text-sm">Select a user to manage their ad accounts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : activeTab === 'accounts' ? (
    // Ad Accounts Tab
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
      {/* Accounts List - Left Side */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  All Ad Accounts ({adAccounts.length})
                </h2>
                {selectedAccounts.length > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {selectedAccounts.length} selected
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {selectedAccounts.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                        <span className="hidden sm:inline">Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </>
                    )}
                  </button>
                )}
                
                <button
                  onClick={syncWithN8N}
                  disabled={syncing}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Sync'}</span>
                </button>
              </div>
            </div>
            
            {/* Search */}
            <input
              type="text"
              placeholder="Search by account ID or name..."
              value={accountSearchTerm}
              onChange={(e) => setAccountSearchTerm(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Accounts List */}
          <div className="max-h-[500px] sm:max-h-[600px] overflow-y-auto">
            {filteredAccounts.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-sm text-gray-500">
                {accountSearchTerm ? 'No accounts match your search' : 'No ad accounts found'}
              </div>
            ) : (
              <>
                {/* Select All Header */}
                <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 z-10">
                  <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAccounts.length === filteredAccounts.length && filteredAccounts.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">
                      Select All ({selectedAccounts.length}/{filteredAccounts.length})
                    </span>
                  </label>
                </div>

                {/* Accounts */}
                <div className="divide-y divide-gray-200">
                  {paginatedAccounts.map((account) => (
                    <div 
                      key={account.id} 
                      className={`p-3 sm:p-4 transition-colors ${
                        selectedAccounts.includes(account.id) ? 'bg-indigo-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedAccounts.includes(account.id)}
                          onChange={() => toggleAccountSelection(account.id)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer mt-0.5 sm:mt-1"
                        />
                        
                        {/* Account Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm sm:text-base text-gray-900 truncate">{account.id}</div>
                          <div className="text-xs sm:text-sm text-gray-600 mt-1 truncate">{account.name}</div>
                          {account.lastSynced && (
                            <div className="text-xs text-gray-500 mt-1">
                              Last synced: {new Date(account.lastSynced).toLocaleString()}
                            </div>
                          )}
                        </div>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteAccount(account.id, account.name)}
                          className="text-red-600 hover:text-red-700 p-1.5 sm:p-2 flex-shrink-0"
                          title="Delete this account"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAccounts.length)} of {filteredAccounts.length}
                      </div>
                      
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Prev
                        </button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                              return page === 1 || 
                                     page === totalPages || 
                                     (page >= currentPage - 1 && page <= currentPage + 1);
                            })
                            .map((page, index, array) => (
                              <React.Fragment key={page}>
                                {index > 0 && array[index - 1] !== page - 1 && (
                                  <span className="px-1 sm:px-2 text-xs sm:text-sm text-gray-500">...</span>
                                )}
                                <button
                                  onClick={() => setCurrentPage(page)}
                                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg ${
                                    currentPage === page
                                      ? 'bg-indigo-600 text-white'
                                      : 'border border-gray-300 hover:bg-gray-100'
                                  }`}
                                >
                                  {page}
                                </button>
                              </React.Fragment>
                            ))
                          }
                        </div>
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Manually - Right Side */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 lg:sticky lg:top-8">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Add Manually</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Account ID
              </label>
              <input
                type="text"
                value={newAccountId}
                onChange={(e) => setNewAccountId(e.target.value)}
                placeholder="act_123456789"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Account Name
              </label>
              <input
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="Campaign Name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleManualAddAccount}
              className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Add Account
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : activeTab === 'elemental' ? (
    // Elemental Analyse Tab
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-4 sm:-my-6 lg:-my-8">
      <AdminElementalAnalysisTab adAccounts={adAccounts}/>
    </div>
  ) : activeTab === 'settings' ? (
    // Settings Tab
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-4 sm:-my-6 lg:-my-8">
      <AdminSettings/>
    </div>
  ) : null}
</div>
    </div>
  );
}


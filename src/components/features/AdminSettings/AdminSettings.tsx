import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Key, Save, Loader2, Eye, EyeOff, Check } from 'lucide-react';

interface ApiConfig {
  openai?: string;
  claude?: string;
  gemini?: string;
}

interface PopupProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ message, type, onClose }) => {
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
          <div className="flex-1">
            <p className="text-gray-800 text-sm">{message}</p>
          </div>
        </div>
        
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [savingOpenai, setSavingOpenai] = useState(false);
  const [savingClaude, setSavingClaude] = useState(false);
  const [savingGemini, setSavingGemini] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [popup, setPopup] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // API Keys state
  const [openaiKey, setOpenaiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [metaToken, setMetaToken] = useState('');
  const [defaultModel, setDefaultModel] = useState('openai');
  
  // Show/Hide password state
  const [showOpenai, setShowOpenai] = useState(false);
  const [showClaude, setShowClaude] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [showMeta, setShowMeta] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      console.log('Fetching API keys from Firestore...');
      
      let currentDefault = 'openai'; // Default fallback
      
      // Fetch OpenAI key
      try {
        const openaiDoc = await getDoc(doc(db, 'config', 'openai'));
        if (openaiDoc.exists()) {
          const data = openaiDoc.data();
          console.log('OpenAI key found');
          setOpenaiKey(data.apiKey || '');
          if (data.default === true) {
            console.log('✅ OpenAI is set as default');
            currentDefault = 'openai';
          }
        } else {
          console.log('No OpenAI key found');
        }
      } catch (err) {
        console.error('Error fetching OpenAI key:', err);
      }
      
      // Fetch Claude key
      try {
        const claudeDoc = await getDoc(doc(db, 'config', 'claude'));
        if (claudeDoc.exists()) {
          const data = claudeDoc.data();
          console.log('Claude key found');
          setClaudeKey(data.apiKey || '');
          if (data.default === true) {
            console.log('✅ Claude is set as default');
            currentDefault = 'claude';
          }
        } else {
          console.log('No Claude key found');
        }
      } catch (err) {
        console.error('Error fetching Claude key:', err);
      }
      
      // Fetch Gemini key
      try {
        const geminiDoc = await getDoc(doc(db, 'config', 'gemini'));
        if (geminiDoc.exists()) {
          const data = geminiDoc.data();
          console.log('Gemini key found');
          setGeminiKey(data.apiKey || '');
          if (data.default === true) {
            console.log('✅ Gemini is set as default');
            currentDefault = 'gemini';
          }
        } else {
          console.log('No Gemini key found');
        }
      } catch (err) {
        console.error('Error fetching Gemini key:', err);
      }
      
      // Set the default model based on what we found
      console.log('🎯 Setting default model to:', currentDefault);
      setDefaultModel(currentDefault);
      
      // Fetch Meta token
      try {
        const metaDoc = await getDoc(doc(db, 'config', 'meta'));
        if (metaDoc.exists()) {
          console.log('Meta token found');
          setMetaToken(metaDoc.data().accessToken || '');
        } else {
          console.log('No Meta token found');
        }
      } catch (err) {
        console.error('Error fetching Meta token:', err);
      }
      
      console.log('Finished fetching API keys');
    } catch (error: any) {
      console.error('Error in fetchApiKeys:', error);
      setPopup({ 
        message: `Failed to load API keys: ${error.message || 'Unknown error'}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };


const handleSaveOpenai = async (setAsDefault: boolean = false) => {
  if (!openaiKey.trim()) {
    setPopup({ message: 'Please enter OpenAI API key', type: 'error' });
    return;
  }

  setSavingOpenai(true);
  try {
    await setDoc(doc(db, 'config', 'openai'), {
      apiKey: openaiKey.trim(),
      default: setAsDefault,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    if (setAsDefault) {
      // Set other models' default to false
      await setDoc(doc(db, 'config', 'claude'), {
        default: false
      }, { merge: true });
      await setDoc(doc(db, 'config', 'gemini'), {
        default: false
      }, { merge: true });
      
      await setDoc(doc(db, 'config', 'settings'), {
        defaultModel: 'openai',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setDefaultModel('openai');
    }

    setPopup({ message: setAsDefault ? 'OpenAI saved and set as default!' : 'OpenAI API key saved!', type: 'success' });
  } catch (error: any) {
    setPopup({ message: `Failed to save: ${error.message}`, type: 'error' });
  } finally {
    setSavingOpenai(false);
  }
};

const handleSaveClaude = async (setAsDefault: boolean = false) => {
  if (!claudeKey.trim()) {
    setPopup({ message: 'Please enter Claude API key', type: 'error' });
    return;
  }

  setSavingClaude(true);
  try {
    await setDoc(doc(db, 'config', 'claude'), {
      apiKey: claudeKey.trim(),
      default: setAsDefault,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    if (setAsDefault) {
      // Set other models' default to false
      await setDoc(doc(db, 'config', 'openai'), {
        default: false
      }, { merge: true });
      await setDoc(doc(db, 'config', 'gemini'), {
        default: false
      }, { merge: true });
      
      await setDoc(doc(db, 'config', 'settings'), {
        defaultModel: 'claude',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setDefaultModel('claude');
    }

    setPopup({ message: setAsDefault ? 'Claude saved and set as default!' : 'Claude API key saved!', type: 'success' });
  } catch (error: any) {
    setPopup({ message: `Failed to save: ${error.message}`, type: 'error' });
  } finally {
    setSavingClaude(false);
  }
};

const handleSaveGemini = async (setAsDefault: boolean = false) => {
  if (!geminiKey.trim()) {
    setPopup({ message: 'Please enter Gemini API key', type: 'error' });
    return;
  }

  setSavingGemini(true);
  try {
    await setDoc(doc(db, 'config', 'gemini'), {
      apiKey: geminiKey.trim(),
      default: setAsDefault,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    if (setAsDefault) {
      // Set other models' default to false
      await setDoc(doc(db, 'config', 'openai'), {
        default: false
      }, { merge: true });
      await setDoc(doc(db, 'config', 'claude'), {
        default: false
      }, { merge: true });
      
      await setDoc(doc(db, 'config', 'settings'), {
        defaultModel: 'gemini',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setDefaultModel('gemini');
    }

    setPopup({ message: setAsDefault ? 'Gemini saved and set as default!' : 'Gemini API key saved!', type: 'success' });
  } catch (error: any) {
    setPopup({ message: `Failed to save: ${error.message}`, type: 'error' });
  } finally {
    setSavingGemini(false);
  }
};


  const handleSaveMeta = async () => {
    if (!metaToken.trim()) {
      setPopup({ message: 'Please enter Meta access token', type: 'error' });
      return;
    }

    setSavingMeta(true);
    try {
      await setDoc(doc(db, 'config', 'meta'), {
        accessToken: metaToken.trim(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setPopup({ message: 'Meta access token saved!', type: 'success' });
    } catch (error: any) {
      setPopup({ message: `Failed to save: ${error.message}`, type: 'error' });
    } finally {
      setSavingMeta(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
    {popup && (
      <Popup
        message={popup.message}
        type={popup.type}
        onClose={() => setPopup(null)}
      />
    )}

    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-indigo-100 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
            <Key className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">API Configuration</h2>
            <p className="text-xs sm:text-sm text-gray-600">Configure API keys for AI models</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* OpenAI Configuration */}
        <div className={`border rounded-lg p-3 sm:p-4 ${defaultModel === 'openai' ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 004.981 4.18a5.985 5.985 0 00-3.998 2.9 6.046 6.046 0 00.743 7.097 5.98 5.98 0 00.51 4.911 6.051 6.051 0 006.515 2.9A5.985 5.985 0 0013.26 24a6.056 6.056 0 005.772-4.206 5.99 5.99 0 003.997-2.9 6.056 6.056 0 00-.747-7.073zM13.26 22.43a4.476 4.476 0 01-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 00.392-.681v-6.737l2.02 1.168a.071.071 0 01.038.052v5.583a4.504 4.504 0 01-4.494 4.494zM3.6 18.304a4.47 4.47 0 01-.535-3.014l.142.085 4.783 2.759a.771.771 0 00.78 0l5.843-3.369v2.332a.08.08 0 01-.033.062L9.74 19.95a4.5 4.5 0 01-6.14-1.646zM2.34 7.896a4.485 4.485 0 012.366-1.973V11.6a.766.766 0 00.388.676l5.815 3.355-2.02 1.168a.076.076 0 01-.071 0l-4.83-2.786A4.504 4.504 0 012.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 01.071 0l4.83 2.791a4.494 4.494 0 01-.676 8.105v-5.678a.79.79 0 00-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 00-.785 0L9.409 9.23V6.897a.066.066 0 01.028-.061l4.83-2.787a4.5 4.5 0 016.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 01-.038-.057V6.075a4.5 4.5 0 017.375-3.453l-.142.08L8.704 5.46a.795.795 0 00-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-sm sm:text-base text-gray-900">OpenAI</h3>
                {defaultModel === 'openai' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Check className="w-3 h-3" />
                    Default
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">GPT-4o-mini API Key</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showOpenai ? "text" : "password"}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenai(!showOpenai)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showOpenai ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleSaveOpenai(false)}
                disabled={savingOpenai}
                className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {savingOpenai ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                Save
              </button>
              <button
                onClick={() => handleSaveOpenai(true)}
                disabled={savingOpenai}
                className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {savingOpenai ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                <span className="hidden sm:inline">Save & Set Default</span>
                <span className="sm:hidden">Set Default</span>
              </button>
            </div>
          </div>
        </div>

        {/* Claude Configuration */}
        <div className={`border rounded-lg p-3 sm:p-4 ${defaultModel === 'claude' ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.5 3A3.5 3.5 0 0121 6.5v11a3.5 3.5 0 01-3.5 3.5h-11A3.5 3.5 0 013 17.5v-11A3.5 3.5 0 016.5 3h11zm0 2h-11A1.5 1.5 0 005 6.5v11A1.5 1.5 0 006.5 19h11a1.5 1.5 0 001.5-1.5v-11A1.5 1.5 0 0017.5 5zM12 7a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-sm sm:text-base text-gray-900">Claude (Anthropic)</h3>
                {defaultModel === 'claude' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    <Check className="w-3 h-3" />
                    Default
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">Claude Sonnet API Key</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showClaude ? "text" : "password"}
                  value={claudeKey}
                  onChange={(e) => setClaudeKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowClaude(!showClaude)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showClaude ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleSaveClaude(false)}
                disabled={savingClaude}
                className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {savingClaude ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                Save
              </button>
              <button
                onClick={() => handleSaveClaude(true)}
                disabled={savingClaude}
                className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {savingClaude ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                <span className="hidden sm:inline">Save & Set Default</span>
                <span className="sm:hidden">Set Default</span>
              </button>
            </div>
          </div>
        </div>

        {/* Gemini Configuration */}
        <div className={`border rounded-lg p-3 sm:p-4 ${defaultModel === 'gemini' ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-sm sm:text-base text-gray-900">Gemini (Google)</h3>
                {defaultModel === 'gemini' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Check className="w-3 h-3" />
                    Default
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">Google Gemini API Key</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showGemini ? "text" : "password"}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowGemini(!showGemini)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showGemini ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleSaveGemini(false)}
                disabled={savingGemini}
                className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {savingGemini ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                Save
              </button>
              <button
                onClick={() => handleSaveGemini(true)}
                disabled={savingGemini}
                className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {savingGemini ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                <span className="hidden sm:inline">Save & Set Default</span>
                <span className="sm:hidden">Set Default</span>
              </button>
            </div>
          </div>
        </div>

        {/* Meta Configuration */}
        <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm sm:text-base text-gray-900">Meta (Facebook)</h3>
              <p className="text-xs text-gray-500">Facebook Ad Accounts Access Token</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Access Token
              </label>
              <div className="relative">
                <input
                  type={showMeta ? "text" : "password"}
                  value={metaToken}
                  onChange={(e) => setMetaToken(e.target.value)}
                  placeholder="EAAxxxxx..."
                  className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowMeta(!showMeta)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showMeta ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleSaveMeta}
              disabled={savingMeta}
              className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {savingMeta ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              Save Meta Token
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Information Notice */}
    <div className="mt-4 sm:mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-3 sm:p-4">
      <div className="flex gap-2 sm:gap-3">
        <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="text-xs sm:text-sm text-indigo-800">
          <p className="font-medium mb-1 sm:mb-2">Important Notes:</p>
          <ul className="list-disc list-inside space-y-0.5 sm:space-y-1">
            <li>Click "Save" to update the API key only</li>
            <li>Click "Save & Set Default" to save and make it the default model</li>
            <li>The default model is pre-selected in Elemental Analysis</li>
            <li>API keys are stored securely in Firestore</li>
            <li>Keep your API keys confidential</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);
}
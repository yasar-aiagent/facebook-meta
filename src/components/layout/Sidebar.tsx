import React, { useState, useEffect, useRef } from 'react'
import { Save, Settings, Activity, Bot, Search, X } from 'lucide-react'
import { doc, onSnapshot, collection, getDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuth } from '@/components/Auth/AuthProvider'
import { useAdmin } from '@/hooks/useAdmin'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { StatusIndicator } from './StatusIndicator'
import { useConfigStore } from '@/stores/configStore'
import { useAnalysis } from '@/hooks/useAnalysis'

/**
 * Configuration sidebar with form inputs and status indicators
 */

interface SidebarProps {
  onClose?: () => void  // Optional close function for mobile
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user } = useAuth()
  const { isAdmin } = useAdmin()
  const { config, updateConfig } = useConfigStore()
  const { analyzeAds, isLoading } = useAnalysis()
  const [userAdAccounts, setUserAdAccounts] = useState<Array<{ id: string; name?: string }>>([])
  const [loadingAdIds, setLoadingAdIds] = useState(true)
  const [loadingToken, setLoadingToken] = useState(true)
  
  // Search state for ad accounts
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // ✅ UPDATED - Load from sessionStorage (excluding sensitive data)
  const [formData, setFormData] = useState(() => {
    // Try to load from sessionStorage first
    try {
      const storedConfig = sessionStorage.getItem('sidebarConfig')
      if (storedConfig) {
        console.log('📦 Loading config from sessionStorage')
        const parsed = JSON.parse(storedConfig)
        
        // Merge with config store to get tokens (sensitive data)
        return {
          n8nWebhookUrl: config.n8nWebhookUrl,      // ✅ Get from store (not sessionStorage)
          facebookToken: config.facebookToken,      // ✅ Get from store (not sessionStorage)
          adAccountId: parsed.adAccountId || config.adAccountId,
          targetCpa: parsed.targetCpa || config.targetCpa,
          dateFrom: parsed.dateFrom || config.dateFrom || '',
          dateTo: parsed.dateTo || config.dateTo || '',
          funnelType: parsed.funnelType || config.funnelType || 'Leads',
        }
      }
    } catch (error) {
      console.error('Error loading config from sessionStorage:', error)
    }
    
    // Fallback to config store
    return {
      n8nWebhookUrl: config.n8nWebhookUrl,
      facebookToken: config.facebookToken,
      adAccountId: config.adAccountId,
      targetCpa: config.targetCpa,
      dateFrom: config.dateFrom || '',
      dateTo: config.dateTo || '',
      funnelType: config.funnelType || 'Leads',
    }
  })

  // Filter accounts based on search query
  const filteredAccounts = userAdAccounts.filter(account => {
    const searchLower = searchQuery.toLowerCase()
    return (
      account.id.toLowerCase().includes(searchLower) ||
      (account.name && account.name.toLowerCase().includes(searchLower))
    )
  })

  // Get selected account display text
  const selectedAccount = userAdAccounts.find(acc => acc.id === formData.adAccountId)
  const selectedAccountText = selectedAccount 
    ? `${selectedAccount.id}${selectedAccount.name ? ` - ${selectedAccount.name}` : ''}`
    : ''

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load Meta token from Firestore on mount
  useEffect(() => {
    async function loadMetaToken() {
      try {
        console.log('🔑 Loading Meta token from Firestore...')
        
        const configDoc = await getDoc(doc(db, 'config', 'meta'))
        
        if (!configDoc.exists()) {
          console.warn('⚠️ Meta configuration not found in Firestore')
          setLoadingToken(false)
          return
        }
        
        const data = configDoc.data()
        const accessToken = data?.accessToken
        
        if (!accessToken) {
          console.warn('⚠️ Meta access token is missing')
          setLoadingToken(false)
          return
        }
        
        console.log('✅ Meta token loaded successfully')
        
        // Update both form data and config store
        setFormData(prev => ({
          ...prev,
          facebookToken: accessToken
        }))
        
        updateConfig({ facebookToken: accessToken })
        
      } catch (err) {
        console.error('❌ Error loading Meta token:', err)
      } finally {
        setLoadingToken(false)
      }
    }

    loadMetaToken()
  }, [updateConfig])

  // Real-time listener for user's ad accounts
  useEffect(() => {
    if (!user?.uid) {
      setLoadingAdIds(false)
      return
    }

    let unsubscribeUser: (() => void) | null = null
    let unsubscribeAccounts: (() => void) | null = null

    const setupListeners = async () => {
      try {
        if (isAdmin) {
          // Admin: Listen to ALL ad accounts in real-time
          unsubscribeAccounts = onSnapshot(
            collection(db, 'adAccounts'),
            (snapshot) => {
              const accountsList: Array<{ id: string; name?: string }> = []
              snapshot.forEach((doc) => {
                accountsList.push({
                  id: doc.id,
                  name: doc.data().name
                })
              })
              setUserAdAccounts(accountsList)
              setLoadingAdIds(false)
            },
            (error) => {
              console.error('Error listening to ad accounts:', error)
              setLoadingAdIds(false)
            }
          )
        } else {
          // Regular user: Listen to their user document for assigned accounts
          unsubscribeUser = onSnapshot(
            doc(db, 'users', user.uid),
            (userDoc) => {
              if (userDoc.exists()) {
                const userData = userDoc.data()
                const adAccounts = userData.adAccounts || []
                const adIds = userData.adIds || []
                
                // If adAccounts array exists with name, use it directly
                if (adAccounts.length > 0) {
                  setUserAdAccounts(adAccounts)
                  setLoadingAdIds(false)
                } else if (adIds.length > 0) {
                  // Legacy support: fetch names from adAccounts collection
                  unsubscribeAccounts = onSnapshot(
                    collection(db, 'adAccounts'),
                    (accountsSnapshot) => {
                      const accountsList: Array<{ id: string; name?: string }> = []
                      accountsSnapshot.forEach((accountDoc) => {
                        if (adIds.includes(accountDoc.id)) {
                          accountsList.push({
                            id: accountDoc.id,
                            name: accountDoc.data().name
                          })
                        }
                      })
                      setUserAdAccounts(accountsList)
                      setLoadingAdIds(false)
                    },
                    (error) => {
                      console.error('Error listening to ad accounts:', error)
                      setLoadingAdIds(false)
                    }
                  )
                } else {
                  setUserAdAccounts([])
                  setLoadingAdIds(false)
                }
              } else {
                setUserAdAccounts([])
                setLoadingAdIds(false)
              }
            },
            (error) => {
              console.error('Error listening to user document:', error)
              setLoadingAdIds(false)
            }
          )
        }
      } catch (error) {
        console.error('Error setting up listeners:', error)
        setLoadingAdIds(false)
      }
    }

    setupListeners()

    // Cleanup function to unsubscribe from listeners
    return () => {
      if (unsubscribeUser) unsubscribeUser()
      if (unsubscribeAccounts) unsubscribeAccounts()
    }
  }, [user, isAdmin])

  // ✅ UPDATED - Save formData to sessionStorage (exclude sensitive data)
  useEffect(() => {
    try {
      // Create a copy without sensitive data
      const { facebookToken, n8nWebhookUrl, ...safeData } = formData
      
      sessionStorage.setItem('sidebarConfig', JSON.stringify(safeData))
      console.log('✅ Config saved to sessionStorage (without sensitive data)')
    } catch (error) {
      console.error('❌ Error saving config to sessionStorage:', error)
    }
  }, [formData])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSelectAccount = (accountId: string) => {
    handleInputChange('adAccountId', accountId)
    setIsDropdownOpen(false)
    setSearchQuery('')
  }

  const handleClearSelection = () => {
    handleInputChange('adAccountId', '')
    setSearchQuery('')
  }

  const [responseStatus, setResponseStatus] = useState<string>('')

  // ✅ Auto-close sidebar on mobile after successful data fetch
  useEffect(() => {
    const isMobile = window.innerWidth < 1024 // lg breakpoint
    
    if (isMobile && responseStatus.includes('✅ Success') && onClose) {
      const timer = setTimeout(() => {
        onClose()
        console.log('📱 Sidebar auto-closed on mobile after success')
      }, 1500) // 1.5 second delay to show success message
      
      return () => clearTimeout(timer)
    }
  }, [responseStatus, onClose])

  const handleSaveAndAnalyze = async () => {
    setResponseStatus('Configuring...')
    
    // Update config store
    updateConfig(formData)
    
    // ✅ UPDATED - Save to sessionStorage (exclude sensitive data)
    try {
      const { facebookToken, n8nWebhookUrl, ...safeData } = formData
      
      sessionStorage.setItem('sidebarConfig', JSON.stringify(safeData))
      sessionStorage.setItem('sidebarConfigTimestamp', new Date().toISOString())
      console.log('✅ Config saved to sessionStorage (without sensitive data)')
    } catch (error) {
      console.error('Error saving to sessionStorage:', error)
    }
    
    // Check if configuration is complete
    const isConfigured = !!(
      formData.n8nWebhookUrl &&
      formData.facebookToken &&
      formData.adAccountId &&
      formData.dateFrom &&
      formData.dateTo
    )
    
    updateConfig({ isConfigured })

    if (isConfigured) {
      try {
        setResponseStatus('Sending request...')
        const result = await analyzeAds(formData)
        
        if (result?.adsData?.length || result?.reviewsData?.length) {
          setResponseStatus(`✅ Success! Found ${result.adsData?.length || 0} ads, ${result.reviewsData?.length || 0} reviews`)
        } else {
          setResponseStatus('⚠️ Request successful but no data returned')
        }
      } catch (error) {
        console.error('Analysis failed:', error)
        setResponseStatus(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } else {
      setResponseStatus('❌ Please fill all configuration fields')
    }
  }

  // Show loading state while token is being fetched
  if (loadingToken) {
    return (
      <Card className="flex flex-col">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-600">Loading configuration...</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col">
      {/* Logo Section */}
      <div className="text-center pb-6 border-b border-gray-100">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">AI Agent</h2>
        </div>
        <p className="text-sm text-gray-600">Facebook Ads Analyzer Pro</p>
      </div>

      {/* Configuration Form */}
      <div className="flex-1 py-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-gray-600" />
            <h3 className="font-medium text-gray-900">Configuration</h3>
          </div>

          <div className="space-y-4">
            {/* Token Status Indicator */}
            {formData.facebookToken && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Meta Token: Active</span>
                </div>
              </div>
            )}

            {/* Searchable Ad Account Dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Ad Account ID
                {!loadingAdIds && userAdAccounts.length > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                    Live ({userAdAccounts.length})
                  </span>
                )}
              </label>
              
              {loadingAdIds ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 text-sm">
                  Loading ad accounts...
                </div>
              ) : userAdAccounts.length > 0 ? (
                <div className="relative" ref={dropdownRef}>
                  {/* Selected Account Display / Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder={formData.adAccountId ? selectedAccountText : "Search ad accounts..."}
                      value={isDropdownOpen ? searchQuery : (formData.adAccountId ? selectedAccountText : '')}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setIsDropdownOpen(true)
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                    />
                    {formData.adAccountId && (
                      <button
                        onClick={handleClearSelection}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown List */}
                  {isDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto">
                      {filteredAccounts.length > 0 ? (
                        filteredAccounts.map((account) => (
                          <button
                            key={account.id}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                              formData.adAccountId === account.id ? 'bg-primary-50 text-primary-700' : ''
                            }`}
                            onClick={() => handleSelectAccount(account.id)}
                          >
                            <div className="font-medium text-sm">{account.id}</div>
                            {account.name && (
                              <div className="text-xs text-gray-500 mt-0.5">{account.name}</div>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                          No accounts found for "{searchQuery}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-yellow-50 text-yellow-800 text-sm">
                  ⚠️ No ad accounts assigned. Contact admin.
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="From"
                type="date"
                value={formData.dateFrom}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => handleInputChange('dateFrom', e.target.value)}
              />
              <Input
                label="To"
                type="date"
                value={formData.dateTo}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => handleInputChange('dateTo', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Funnel Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={formData.funnelType}
                  onChange={(e) => handleInputChange('funnelType', e.target.value)}
                >
                  <option value="Leads">Leads</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>
              <Input
                label="Target CPA"
                type="number"
                step="0.01"
                placeholder="50.00"
                value={formData.targetCpa}
                onChange={(e) => handleInputChange('targetCpa', parseFloat(e.target.value) || 0)}
              />
            </div>

            <Button
              onClick={handleSaveAndAnalyze}
              disabled={isLoading || !formData.adAccountId}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Config & Analyze
                </>
              )}
            </Button>

            {responseStatus && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                responseStatus.includes('✅') ? 'bg-green-50 text-green-800' :
                responseStatus.includes('❌') ? 'bg-red-50 text-red-800' :
                'bg-yellow-50 text-yellow-800'
              }`}>
                <strong>Status:</strong> {responseStatus}
              </div>
            )}
          </div>
        </div>

        {/* Status Section */}
        <div className='hidden'>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-gray-600" />
            <h3 className="font-medium text-gray-900">System Status</h3>
          </div>

          <div className="space-y-3">
            <StatusIndicator
              isOnline={!!formData.n8nWebhookUrl}
              label={formData.n8nWebhookUrl ? 'n8n: Configured' : 'n8n: Not Configured'}
            />
            <StatusIndicator
              isOnline={!!formData.facebookToken}
              label={formData.facebookToken ? 'Facebook: Configured' : 'Facebook: Not Configured'}
            />
            <StatusIndicator
              isOnline={!!(formData.dateFrom && formData.dateTo)}
              label={formData.dateFrom && formData.dateTo ? 'Date Range: Set' : 'Date Range: Not Set'}
            />
            <StatusIndicator
              isOnline={config.isConfigured}
              label={config.isConfigured ? 'Analysis: Ready' : 'Analysis: Not Ready'}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}
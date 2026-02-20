import React, { useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '@/firebase/config'
import { useAuth } from '@/components/Auth/AuthProvider'
import { useAdmin } from '@/hooks/useAdmin'
import { Card } from '@/components/ui/Card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { AdPerformanceTab } from '@/components/features/AdPerformance/AdPerformanceTab'
import { AgentReviewsTab } from '@/components/features/AgentReviews/AgentReviewsTab'
import { ChatTab } from '@/components/features/Chat/ChatTab'
import AdDiscoveryComponent from '@/components/features/AdsDiscovery/AdDiscoveryComponent'
import ElementalAnalysisTab from '@/components/features/ElementalAnalysis/ElementalAnalysisTab'
import { Menu, X, LogOut, Shield, ChevronDown } from 'lucide-react'

interface DashboardProps {
  onSwitchToAdminDashboard?: () => void;
}

export default function Dashboard({ onSwitchToAdminDashboard }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('ads-performance')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user } = useAuth()
  const { isAdmin } = useAdmin()

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile-Optimized User Info Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Left side - Menu button & User info */}
            <div className="flex items-center gap-3 flex-1">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* User Info - Responsive */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm text-gray-600 hidden sm:inline">Welcome,</span>
                  <span className="text-sm font-semibold text-gray-900 truncate max-w-[150px] sm:max-w-none">
                    {user?.displayName || user?.email?.split('@')[0]}
                  </span>
                </div>
                
                {/* Admin Badge - Mobile Optimized */}
                {isAdmin && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 whitespace-nowrap">
                    <Shield className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Admin</span>
                  </span>
                )}
              </div>
            </div>
            
            {/* Right side - Desktop buttons / Mobile menu */}
            <div className="flex items-center gap-2">
              {/* Desktop View */}
              <div className="hidden md:flex items-center gap-2">
                {isAdmin && onSwitchToAdminDashboard && (
                  <button
                    onClick={onSwitchToAdminDashboard}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Dashboard</span>
                  </button>
                )}
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>

              {/* Mobile Menu Dropdown */}
              <div className="md:hidden relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="User menu"
                >
                  <ChevronDown className={`w-5 h-5 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Mobile Dropdown Menu */}
                {isUserMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      {isAdmin && onSwitchToAdminDashboard && (
                        <button
                          onClick={() => {
                            onSwitchToAdminDashboard()
                            setIsUserMenuOpen(false)
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Dashboard
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleLogout()
                          setIsUserMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar - Mobile Drawer / Desktop Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-88 lg:w-96
          bg-white lg:bg-transparent
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          overflow-y-auto
          lg:border-r lg:border-gray-200
        `}>
          {/* Mobile Sidebar Header */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Configuration</h2>
            <button
              onClick={closeSidebar}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 lg:p-6">
<Sidebar onClose={() => setIsSidebarOpen(false)} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="h-full p-4 lg:p-6">
            <Card padding="none" className="h-full flex flex-col shadow-sm">
              <Header />
              
              <Tabs 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Mobile-Optimized Tab List */}
                <div className="border-b border-gray-200 overflow-x-auto">
                  <TabsList className="mx-4 mt-4 lg:mx-6 lg:mt-6 inline-flex min-w-full lg:min-w-0">
                    <TabsTrigger value="ads-performance" className="text-xs sm:text-sm whitespace-nowrap">
                      📊 Performance
                    </TabsTrigger>
                    <TabsTrigger value="elemental-analysis" className="text-xs sm:text-sm whitespace-nowrap">
                      🧬 Analysis
                    </TabsTrigger>
                    <TabsTrigger value="chatbot" className="text-xs sm:text-sm whitespace-nowrap">
                      💬 Chat
                    </TabsTrigger>
                    {/* <TabsTrigger value="adsdiscovery" className="text-xs sm:text-sm whitespace-nowrap">
                      🔍 Discovery
                    </TabsTrigger> */}
                  </TabsList>
                </div>

                {/* Tab Content Area */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 lg:p-6">
                    <TabsContent value="ads-performance" className="mt-0">
                      <AdPerformanceTab />
                    </TabsContent>

                    <TabsContent value="elemental-analysis" className="mt-0">
                      <ElementalAnalysisTab />
                    </TabsContent>
                    
                    {/* <TabsContent value="agent-reviews" className="mt-0">
                      <AgentReviewsTab />
                    </TabsContent> */}
                    
                    <TabsContent value="chatbot" className="mt-0">
                      <ChatTab />
                    </TabsContent>

                    {/* <TabsContent value="adsdiscovery" className="mt-0">
                      <AdDiscoveryComponent />
                    </TabsContent> */}
                  </div>
                </div>
              </Tabs>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
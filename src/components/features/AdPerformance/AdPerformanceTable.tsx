// === src/components/features/AdPerformance/AdPerformanceTable.tsx (MODIFIED) ===
import React, { useState, useMemo, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatHeader, formatCurrency } from '@/lib/utils'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Settings, X, GripVertical, Plus,Eye, Check, ExternalLink, Image as ImageIcon, Video, FileText } from 'lucide-react'
import type { AdData } from '@/lib/types'
import { useConfigStore } from '@/stores/configStore'
import { useAdDataStore } from '@/stores/adDataStore'


interface AdPerformanceTableProps {
  data: AdData[]
}

interface AdSetGroup {
  adSetName: string
  ads: AdData[]
  totalSpend: number
  totalImpressions: number
  totalOutboundClicks: number
  totalLandingPageViews: number
  totalLeads: number
  totalPurchases: number
  totalRegistrations: number
  cpa: number
  isTopPerformer: boolean
}

interface CampaignGroup {
  campaignName: string
  adSets: AdSetGroup[]
  totalSpend: number
  totalImpressions: number
  totalOutboundClicks: number
  totalLandingPageViews: number
  totalLeads: number
  totalPurchases: number
  totalRegistrations: number
  cpa: number
  isTopPerformer: boolean
}

export function AdPerformanceTable({ data: propData }: AdPerformanceTableProps) {
  const { config } = useConfigStore()
   const { setAdData } = useAdDataStore() 
  const targetCPA = config.targetCpa || 500

  // Load data from sessionStorage on mount or use propData
const [data, setData] = useState<AdData[]>(() => {
  if (propData && propData.length > 0) {
    return propData
  }
  
  try {
    const storedData = sessionStorage.getItem('adPerformanceData')
    if (storedData) {
      console.log('📦 Loading data from sessionStorage')
      return JSON.parse(storedData)
    }
  } catch (error) {
    console.error('Error loading data from sessionStorage:', error)
  }
  
  return []
})

  
  const [sortColumn, setSortColumn] = useState<string>('totalLeads')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set())
  const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set())
  const [showTopPerformersOnly, setShowTopPerformersOnly] = useState(false)
  const [selectedAd, setSelectedAd] = useState<AdData | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused'>('all')
  const [minSpend, setMinSpend] = useState<number>(0)
  const [showFilters, setShowFilters] = useState(false)
  
  const [minLeads, setMinLeads] = useState<number>(0)
  const [maxLeads, setMaxLeads] = useState<number>(0)
  const [minPurchases, setMinPurchases] = useState<number>(0)
  const [maxPurchases, setMaxPurchases] = useState<number>(0)
  const [minCPA, setMinCPA] = useState<number>(0)
  const [maxCPA, setMaxCPA] = useState<number>(0)
  
  // NEW: Column customization states
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false)
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null)
  const [dragOverColumnIndex, setDragOverColumnIndex] = useState<number | null>(null)
  const [columnSearchQuery, setColumnSearchQuery] = useState('')
  
  // NEW: Checkbox selection states
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  
  const itemsPerPage = 10

  // Get all available columns from data
  const allAvailableColumns = useMemo(() => {
    if (!data || data.length === 0) return []
    return Object.keys(data[0]).filter(h => 
      h !== 'Campaign Name' && 
      h !== 'AdSet Name' && 
      h !== 'Thumbnail URL' &&
      h !== 'Image URL' &&
      h !== 'Video ID'
    )
  }, [data])


  
  // Default visible columns (only these will be active by default)
  const defaultColumns = [
    "Ad Name",
    "Ad ID",
    'Spend',
    'CPM',
    'CTR',
    'Outbound Clicks',
    'CPC',
    'Clicks > LPV',
    'LPV > lead',
    'Clicks > lead',
    'Cost / Click',
    'Cost / LPV',
    'Purchases',
    'Cost Per Acquisition',
    'Leads',
    'ROAS'
  ]

const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns)

// Save to sessionStorage whenever new data arrives
useEffect(() => {
  if (propData && propData.length > 0) {
    setData(propData)
    
    try {
      sessionStorage.setItem('adPerformanceData', JSON.stringify(propData))
      sessionStorage.setItem('adPerformanceDataTimestamp', new Date().toISOString())
      console.log('✅ New data saved to sessionStorage')
    } catch (error) {
      console.error('❌ Error saving to sessionStorage:', error)
    }
  }
}, [propData])

   useEffect(() => {
     if (allAvailableColumns.length > 0 && !hasInitialized) {
       const filtered = defaultColumns.filter(col => allAvailableColumns.includes(col))
       if (filtered.length > 0) {
         setVisibleColumns(filtered)
         setHasInitialized(true)
       }
     }
   }, [allAvailableColumns.length, hasInitialized])
  // Build Campaign > AdSet > Ads hierarchy
  const campaignGroups = useMemo(() => {
    if (!data || data.length === 0) {
      return []
    }

    const totalAccountSpend = data.reduce((sum, ad) => sum + (parseFloat(String(ad.Spend)) || 0), 0)
    const campaigns = new Map<string, CampaignGroup>()
    
    data.forEach(ad => {
      const campaignName = String(ad['Campaign Name'] || 'Unknown Campaign')
      const adSetName = String(ad['AdSet Name'] || 'Unknown AdSet')
      
      if (!campaigns.has(campaignName)) {
        campaigns.set(campaignName, {
          campaignName,
          adSets: [],
          totalSpend: 0,
          totalImpressions: 0,
          totalOutboundClicks: 0,
          totalLandingPageViews: 0,
          totalLeads: 0,
          totalPurchases: 0,
          totalRegistrations: 0,
          cpa: 0,
          isTopPerformer: false
        })
      }
      
      const campaign = campaigns.get(campaignName)!
      let adSet = campaign.adSets.find(as => as.adSetName === adSetName)
      if (!adSet) {
        adSet = {
          adSetName,
          ads: [],
          totalSpend: 0,
          totalImpressions: 0,
          totalOutboundClicks: 0,
          totalLandingPageViews: 0,
          totalLeads: 0,
          totalPurchases: 0,
          totalRegistrations: 0,
          cpa: 0,
          isTopPerformer: false
        }
        campaign.adSets.push(adSet)
      }
      
      adSet.ads.push(ad)
      
      const spend = parseFloat(String(ad.Spend)) || 0
      const impressions = parseInt(String(ad.Impressions)) || 0
      const clicks = parseInt(String(ad['Outbound Clicks'])) || 0
      const lpv = parseInt(String(ad['Landing Page Views'])) || 0
      const leads = parseInt(String(ad.Leads)) || 0
      const purchases = parseInt(String(ad.Purchases)) || 0
      const registrations = parseInt(String(ad.Registrations)) || 0
      
      adSet.totalSpend += spend
      adSet.totalImpressions += impressions
      adSet.totalOutboundClicks += clicks
      adSet.totalLandingPageViews += lpv
      adSet.totalLeads += leads
      adSet.totalPurchases += purchases
      adSet.totalRegistrations += registrations
      
      campaign.totalSpend += spend
      campaign.totalImpressions += impressions
      campaign.totalOutboundClicks += clicks
      campaign.totalLandingPageViews += lpv
      campaign.totalLeads += leads
      campaign.totalPurchases += purchases
      campaign.totalRegistrations += registrations
    })
    
    const campaignsArray = Array.from(campaigns.values())
    
    campaignsArray.forEach(campaign => {
      campaign.cpa = campaign.totalLeads > 0 ? campaign.totalSpend / campaign.totalLeads : 0
      const campaignSpendPercent = (campaign.totalSpend / totalAccountSpend) * 100
      campaign.isTopPerformer = campaign.cpa > 0 && campaign.cpa <= targetCPA * 1.2 && campaignSpendPercent >= 10
      
      campaign.adSets.forEach(adSet => {
        adSet.cpa = adSet.totalLeads > 0 ? adSet.totalSpend / adSet.totalLeads : 0
        const adSetSpendPercent = (adSet.totalSpend / totalAccountSpend) * 100
        adSet.isTopPerformer = adSet.cpa > 0 && adSet.cpa <= targetCPA * 1.2 && adSetSpendPercent >= 3
        
        adSet.ads.forEach(ad => {
          const adSpend = parseFloat(String(ad.Spend)) || 0
          const adLeads = parseInt(String(ad.Leads)) || 0
          const adCPA = adLeads > 0 ? adSpend / adLeads : 0
          const adSpendPercent = (adSpend / totalAccountSpend) * 100
          
          ad.isTopPerformer = adCPA > 0 && adCPA <= targetCPA * 1.2 && adSpendPercent >= 1
        })
      })
    })
    
    return campaignsArray
  }, [data, targetCPA])

  const sortedCampaigns = useMemo(() => {
    if (campaignGroups.length === 0) return []

    let filtered = campaignGroups

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      filtered = filtered.map(campaign => ({
        ...campaign,
        adSets: campaign.adSets.map(adSet => ({
          ...adSet,
          ads: adSet.ads.filter(ad => 
            String(ad['Ad Name']).toLowerCase().includes(query) ||
            String(ad['Campaign Name']).toLowerCase().includes(query) ||
            String(ad['AdSet Name']).toLowerCase().includes(query)
          )
        })).filter(adSet => adSet.ads.length > 0)
      })).filter(campaign => 
        campaign.adSets.length > 0 || 
        campaign.campaignName.toLowerCase().includes(query)
      )
    }

    if (filterStatus !== 'all') {
      const statusValue = filterStatus === 'active' ? 'ACTIVE' : 'PAUSED'
      filtered = filtered.map(campaign => ({
        ...campaign,
        adSets: campaign.adSets.map(adSet => ({
          ...adSet,
          ads: adSet.ads.filter(ad => ad['Active Status'] === statusValue)
        })).filter(adSet => adSet.ads.length > 0)
      })).filter(campaign => campaign.adSets.length > 0)
    }

    if (minSpend > 0) {
      filtered = filtered.map(campaign => ({
        ...campaign,
        adSets: campaign.adSets.map(adSet => ({
          ...adSet,
          ads: adSet.ads.filter(ad => (parseFloat(String(ad.Spend)) || 0) >= minSpend)
        })).filter(adSet => adSet.ads.length > 0)
      })).filter(campaign => campaign.adSets.length > 0)
    }

    if (minLeads > 0 || maxLeads > 0) {
      filtered = filtered.map(campaign => ({
        ...campaign,
        adSets: campaign.adSets.map(adSet => ({
          ...adSet,
          ads: adSet.ads.filter(ad => {
            const leads = parseInt(String(ad.Leads)) || 0
            const meetsMin = minLeads === 0 || leads >= minLeads
            const meetsMax = maxLeads === 0 || leads <= maxLeads
            return meetsMin && meetsMax
          })
        })).filter(adSet => adSet.ads.length > 0)
      })).filter(campaign => campaign.adSets.length > 0)
    }

    if (minPurchases > 0 || maxPurchases > 0) {
      filtered = filtered.map(campaign => ({
        ...campaign,
        adSets: campaign.adSets.map(adSet => ({
          ...adSet,
          ads: adSet.ads.filter(ad => {
            const purchases = parseInt(String(ad.Purchases)) || 0
            const meetsMin = minPurchases === 0 || purchases >= minPurchases
            const meetsMax = maxPurchases === 0 || purchases <= maxPurchases
            return meetsMin && meetsMax
          })
        })).filter(adSet => adSet.ads.length > 0)
      })).filter(campaign => campaign.adSets.length > 0)
    }

    if (minCPA > 0 || maxCPA > 0) {
      filtered = filtered.map(campaign => ({
        ...campaign,
        adSets: campaign.adSets.map(adSet => ({
          ...adSet,
          ads: adSet.ads.filter(ad => {
            const adSpend = parseFloat(String(ad.Spend)) || 0
            const adLeads = parseInt(String(ad.Leads)) || 0
            const cpa = adLeads > 0 ? adSpend / adLeads : 0
            
            if (cpa === 0 && (minCPA > 0 || maxCPA > 0)) return false
            
            const meetsMin = minCPA === 0 || cpa >= minCPA
            const meetsMax = maxCPA === 0 || cpa <= maxCPA
            return meetsMin && meetsMax
          })
        })).filter(adSet => adSet.ads.length > 0)
      })).filter(campaign => campaign.adSets.length > 0)
    }

    if (showTopPerformersOnly) {
      filtered = filtered.map(campaign => ({
        ...campaign,
        adSets: campaign.adSets.map(adSet => ({
          ...adSet,
          ads: adSet.ads.filter(ad => ad.isTopPerformer)
        })).filter(adSet => adSet.ads.length > 0)
      })).filter(campaign => campaign.adSets.length > 0)
    }

    filtered.forEach(campaign => {
      campaign.totalSpend = 0
      campaign.totalImpressions = 0
      campaign.totalOutboundClicks = 0
      campaign.totalLandingPageViews = 0
      campaign.totalLeads = 0
      campaign.totalPurchases = 0
      campaign.totalRegistrations = 0
      
      campaign.adSets.forEach(adSet => {
        adSet.totalSpend = 0
        adSet.totalImpressions = 0
        adSet.totalOutboundClicks = 0
        adSet.totalLandingPageViews = 0
        adSet.totalLeads = 0
        adSet.totalPurchases = 0
        adSet.totalRegistrations = 0
        
        adSet.ads.forEach(ad => {
          const spend = parseFloat(String(ad.Spend)) || 0
          const impressions = parseInt(String(ad.Impressions)) || 0
          const clicks = parseInt(String(ad['Outbound Clicks'])) || 0
          const lpv = parseInt(String(ad['Landing Page Views'])) || 0
          const leads = parseInt(String(ad.Leads)) || 0
          const purchases = parseInt(String(ad.Purchases)) || 0
          const registrations = parseInt(String(ad.Registrations)) || 0
          
          adSet.totalSpend += spend
          adSet.totalImpressions += impressions
          adSet.totalOutboundClicks += clicks
          adSet.totalLandingPageViews += lpv
          adSet.totalLeads += leads
          adSet.totalPurchases += purchases
          adSet.totalRegistrations += registrations
        })
        
        adSet.cpa = adSet.totalLeads > 0 ? adSet.totalSpend / adSet.totalLeads : 0
        
        campaign.totalSpend += adSet.totalSpend
        campaign.totalImpressions += adSet.totalImpressions
        campaign.totalOutboundClicks += adSet.totalOutboundClicks
        campaign.totalLandingPageViews += adSet.totalLandingPageViews
        campaign.totalLeads += adSet.totalLeads
        campaign.totalPurchases += adSet.totalPurchases
        campaign.totalRegistrations += adSet.totalRegistrations
      })
      
      campaign.cpa = campaign.totalLeads > 0 ? campaign.totalSpend / campaign.totalLeads : 0
    })

    return [...filtered].sort((a, b) => {
      let primaryComparison = 0
      
      if (sortColumn === 'totalSpend') {
        primaryComparison = a.totalSpend - b.totalSpend
      } else if (sortColumn === 'totalLeads') {
        primaryComparison = a.totalLeads - b.totalLeads
      } else if (sortColumn === 'totalPurchases') {
        primaryComparison = a.totalPurchases - b.totalPurchases
      } else if (sortColumn === 'cpa') {
        primaryComparison = a.cpa - b.cpa
      } else {
        primaryComparison = a.campaignName.localeCompare(b.campaignName)
      }
      
      const primaryResult = sortDirection === 'asc' ? primaryComparison : -primaryComparison
      
      if (primaryResult === 0 && sortColumn !== 'cpa') {
        const aCPA = a.cpa > 0 ? a.cpa : Infinity
        const bCPA = b.cpa > 0 ? b.cpa : Infinity
        return aCPA - bCPA
      }
      
      return primaryResult
    })
  }, [campaignGroups, sortColumn, sortDirection, showTopPerformersOnly, searchQuery, filterStatus, minSpend, minLeads, maxLeads, minPurchases, maxPurchases, minCPA, maxCPA])

  const filteredStats = useMemo(() => {
    const totalSpend = sortedCampaigns.reduce((sum, c) => sum + c.totalSpend, 0)
    const totalLeads = sortedCampaigns.reduce((sum, c) => sum + c.totalLeads, 0)
    const totalPurchases = sortedCampaigns.reduce((sum, c) => sum + c.totalPurchases, 0)
    const totalImpressions = sortedCampaigns.reduce((sum, c) => sum + c.totalImpressions, 0)
    const avgCPA = totalLeads > 0 ? totalSpend / totalLeads : 0
    const totalTopPerformers = sortedCampaigns.reduce((sum, c) => 
      sum + c.adSets.reduce((adSum, as) => 
        adSum + as.ads.filter(ad => ad.isTopPerformer).length, 0), 0)

    return {
      totalSpend,
      totalLeads,
      totalPurchases,
      totalImpressions,
      avgCPA,
      totalTopPerformers
    }
  }, [sortedCampaigns])

const totalPages = Math.ceil(sortedCampaigns.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCampaigns = sortedCampaigns.slice(startIndex, startIndex + itemsPerPage)

// Filter columns based on search query - MUST be before any conditional returns
  const filteredAvailableColumns = useMemo(() => {
    if (!allAvailableColumns || allAvailableColumns.length === 0) return []
    if (!columnSearchQuery.trim()) return allAvailableColumns
    const query = columnSearchQuery.toLowerCase()
    return allAvailableColumns.filter(col => 
      col.toLowerCase().includes(query) || 
      formatHeader(col).toLowerCase().includes(query)
    )
  }, [allAvailableColumns, columnSearchQuery])

  // Early return check AFTER all hooks
  if (!data || data.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center">
          <h3 className="text-lg font-medium text-red-600 mb-2">No Data Available</h3>
          <p className="text-gray-600">No ads data to display</p>
        </div>
      </Card>
    )
  }

  const toggleCampaign = (campaignName: string) => {
    const newExpanded = new Set(expandedCampaigns)
    if (newExpanded.has(campaignName)) {
      newExpanded.delete(campaignName)
    } else {
      newExpanded.add(campaignName)
    }
    setExpandedCampaigns(newExpanded)
  }

  const toggleAdSet = (campaignName: string, adSetName: string) => {
    const key = `${campaignName}::${adSetName}`
    const newExpanded = new Set(expandedAdSets)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedAdSets(newExpanded)
  }



  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
    setCurrentPage(1)
  }

  const formatCellValue = (header: string, value: any) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400">-</span>
    }

    if (header === 'Active Status') {
      return (
        <Badge variant={value === 'ACTIVE' ? 'success' : 'neutral'}>
          {value}
        </Badge>
      )
    }
    
    if (header === 'Link U R L' || header === 'Link URL' || header === 'Link' || header === 'Landing Page URL' || header === 'Destination URL') {
      if (!value || String(value).trim() === '' || String(value).trim() === '-') {
        return <span className="text-gray-400">-</span>
      }
      return (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded hover:bg-blue-100 transition-all"
        >
          <ExternalLink className="w-3 h-3" />
          View
        </a>
      )
    }

    if (['Spend', 'CPC', 'CPM', 'Cost Per Acquisition', 'Cost / Click', 'Cost / LPV'].includes(header)) {
      return (
        <span className="font-medium text-gray-900">
          {formatCurrency(parseFloat(value) || 0)}
        </span>
      )
    }

    if (['CTR', 'ROAS', 'Clicks > LPV', 'LPV > lead', 'Clicks > lead'].includes(header)) {
      return (
        <span className="font-medium text-gray-900">
          {parseFloat(value || 0).toFixed(2)}%
        </span>
      )
    }
    
    if (['Impressions', 'Outbound Clicks', 'Landing Page Views', 'Leads', 'Purchases', 'Registrations'].includes(header)) {
      return (
        <span className="font-medium text-gray-900">
          {(parseInt(value) || 0).toLocaleString()}
        </span>
      )
    }

    if (['Campaign Name', 'AdSet Name', 'Ad Name'].includes(header)) {
      return (
        <span className="font-medium text-gray-900" title={String(value)}>
          {String(value)}
        </span>
      )
    }

    if (header === 'Best Ads?') {
      return (
        <Badge variant={value === true || value === 'true' ? 'success' : 'neutral'}>
          {value === true || value === 'true' ? 'Yes' : 'No'}
        </Badge>
      )
    }
    
    return String(value)
  }

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return null
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />
  }

  const exportToCSV = () => {
    // Always include Campaign Name, AdSet Name, and Ad Name in CSV export
    const exportHeaders = ['Campaign Name', 'AdSet Name', 'Ad Name', ...visibleColumns]
    const headers = exportHeaders.join(',')
    
    // Get all ads from sorted campaigns
    const allAds = sortedCampaigns.flatMap(campaign =>
      campaign.adSets.flatMap(adSet => adSet.ads)
    )
    
    // Filter ads based on selection
    const adsToExport = selectedAds.size > 0 
      ? allAds.filter(ad => selectedAds.has(ad['Ad ID']))
      : allAds
    
    const rows = adsToExport.map(ad => {
      return exportHeaders.map(header => {
        const value = ad[header]
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value
      }).join(',')
    })
    
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const filename = selectedAds.size > 0 
      ? `ads-performance-selected-${new Date().toISOString().split('T')[0]}.csv`
      : `ads-performance-${new Date().toISOString().split('T')[0]}.csv`
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const hasActiveFilters = searchQuery || filterStatus !== 'all' || minSpend > 0 || minLeads > 0 || maxLeads > 0 || minPurchases > 0 || maxPurchases > 0 || minCPA > 0 || maxCPA > 0 || showTopPerformersOnly

  // Column drag and drop handlers
  const handleColumnDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColumnIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleColumnDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverColumnIndex(index)
  }

  const handleColumnDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedColumnIndex === null) return
    
    const newColumns = [...visibleColumns]
    const [draggedColumn] = newColumns.splice(draggedColumnIndex, 1)
    newColumns.splice(dropIndex, 0, draggedColumn)
    
    setVisibleColumns(newColumns)
    setDraggedColumnIndex(null)
    setDragOverColumnIndex(null)
  }

  const handleColumnDragEnd = () => {
    setDraggedColumnIndex(null)
    setDragOverColumnIndex(null)
  }

  // Checkbox handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedAds(new Set())
      setSelectAll(false)
    } else {
      const allAdIds = sortedCampaigns.flatMap(campaign =>
        campaign.adSets.flatMap(adSet =>
          adSet.ads.map(ad => ad['Ad ID'])
        )
      )
      setSelectedAds(new Set(allAdIds))
      setSelectAll(true)
    }
  }

  const handleSelectAd = (adId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    const newSelected = new Set(selectedAds)
    if (newSelected.has(adId)) {
      newSelected.delete(adId)
    } else {
      newSelected.add(adId)
    }
    setSelectedAds(newSelected)
    
    // Update selectAll state
    const totalAds = sortedCampaigns.reduce((sum, c) => 
      sum + c.adSets.reduce((s, as) => s + as.ads.length, 0), 0)
    setSelectAll(newSelected.size === totalAds && totalAds > 0)
  }

  const handleSelectCampaign = (campaign: CampaignGroup, event: React.MouseEvent) => {
    event.stopPropagation()
    const campaignAdIds = campaign.adSets.flatMap(adSet =>
      adSet.ads.map(ad => ad['Ad ID'])
    )
    const newSelected = new Set(selectedAds)
    const allSelected = campaignAdIds.every(id => newSelected.has(id))
    
    if (allSelected) {
      campaignAdIds.forEach(id => newSelected.delete(id))
    } else {
      campaignAdIds.forEach(id => newSelected.add(id))
    }
    
    setSelectedAds(newSelected)
    const totalAds = sortedCampaigns.reduce((sum, c) => 
      sum + c.adSets.reduce((s, as) => s + as.ads.length, 0), 0)
    setSelectAll(newSelected.size === totalAds && totalAds > 0)
  }

  const handleSelectAdSet = (campaign: CampaignGroup, adSet: AdSetGroup, event: React.MouseEvent) => {
    event.stopPropagation()
    const adSetAdIds = adSet.ads.map(ad => ad['Ad ID'])
    const newSelected = new Set(selectedAds)
    const allSelected = adSetAdIds.every(id => newSelected.has(id))
    
    if (allSelected) {
      adSetAdIds.forEach(id => newSelected.delete(id))
    } else {
      adSetAdIds.forEach(id => newSelected.add(id))
    }
    
    setSelectedAds(newSelected)
    const totalAds = sortedCampaigns.reduce((sum, c) => 
      sum + c.adSets.reduce((s, as) => s + as.ads.length, 0), 0)
    setSelectAll(newSelected.size === totalAds && totalAds > 0)
  }

  const isCampaignSelected = (campaign: CampaignGroup) => {
    const campaignAdIds = campaign.adSets.flatMap(adSet =>
      adSet.ads.map(ad => ad['Ad ID'])
    )
    return campaignAdIds.length > 0 && campaignAdIds.every(id => selectedAds.has(id))
  }

  const isCampaignPartiallySelected = (campaign: CampaignGroup) => {
    const campaignAdIds = campaign.adSets.flatMap(adSet =>
      adSet.ads.map(ad => ad['Ad ID'])
    )
    const selectedCount = campaignAdIds.filter(id => selectedAds.has(id)).length
    return selectedCount > 0 && selectedCount < campaignAdIds.length
  }

  const isAdSetSelected = (adSet: AdSetGroup) => {
    const adSetAdIds = adSet.ads.map(ad => ad['Ad ID'])
    return adSetAdIds.length > 0 && adSetAdIds.every(id => selectedAds.has(id))
  }

  const isAdSetPartiallySelected = (adSet: AdSetGroup) => {
    const adSetAdIds = adSet.ads.map(ad => ad['Ad ID'])
    const selectedCount = adSetAdIds.filter(id => selectedAds.has(id)).length
    return selectedCount > 0 && selectedCount < adSetAdIds.length
  }

  const toggleColumn = (column: string) => {
    if (visibleColumns.includes(column)) {
      setVisibleColumns(visibleColumns.filter(c => c !== column))
    } else {
      setVisibleColumns([...visibleColumns, column])
    }
  }



 return (
    <div className="space-y-4">
      {/* Controls Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        {/* Top Row - Stats and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
          {/* Stats */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-50 rounded-md border border-gray-200">
              <span className="text-xs sm:text-sm font-medium text-gray-900">
                {sortedCampaigns.length} <span className="text-gray-500 font-normal hidden sm:inline">campaigns</span>
              </span>
            </div>
            <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-50 rounded-md border border-gray-200">
              <span className="text-xs sm:text-sm font-medium text-gray-900">
                {sortedCampaigns.reduce((sum, c) => sum + c.adSets.length, 0)} <span className="text-gray-500 font-normal hidden sm:inline">ad sets</span>
              </span>
            </div>
            <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-50 rounded-md border border-gray-200">
              <span className="text-xs sm:text-sm font-medium text-gray-900">
                {sortedCampaigns.reduce((sum, c) => sum + c.adSets.reduce((s, as) => s + as.ads.length, 0), 0)} <span className="text-gray-500 font-normal hidden sm:inline">ads</span>
              </span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowColumnCustomizer(true)}
              className="bg-gray-50 hover:bg-gray-100 text-xs sm:text-sm flex-1 sm:flex-initial"
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Columns</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={exportToCSV}
              className="bg-green-50 text-green-700 hover:bg-green-100 text-xs sm:text-sm flex-1 sm:flex-initial"
            >
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden">CSV</span>
              {selectedAds.size > 0 && <span className="ml-1">({selectedAds.size})</span>}
            </Button>
            {selectedAds.size > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSelectedAds(new Set())
                  setSelectAll(false)
                }}
                className="bg-red-50 text-red-700 hover:bg-red-100 text-xs sm:text-sm"
              >
                Clear
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className={`${showFilters ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-50 hover:bg-gray-100'} text-xs sm:text-sm`}
            >
              Filters
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 border border-gray-200 space-y-3">
            {/* Basic Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Search campaigns, ad sets, ads..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value as 'all' | 'active' | 'paused')
                    setCurrentPage(1)
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="paused">Paused Only</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Min Spend</label>
                <input
                  type="number"
                  value={minSpend}
                  onChange={(e) => {
                    setMinSpend(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Ad-Level Filters */}
            <div className="border-t pt-3">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Ad-Level Filters</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Leads Range */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700 block">Leads Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={minLeads}
                      onChange={(e) => {
                        setMinLeads(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      placeholder="Min"
                      min="0"
                      className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      value={maxLeads}
                      onChange={(e) => {
                        setMaxLeads(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      placeholder="Max"
                      min="0"
                      className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Purchases Range */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700 block">Purchases Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={minPurchases}
                      onChange={(e) => {
                        setMinPurchases(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      placeholder="Min"
                      min="0"
                      className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="number"
                      value={maxPurchases}
                      onChange={(e) => {
                        setMaxPurchases(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      placeholder="Max"
                      min="0"
                      className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* CPA Range */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700 block">CPA Range (₹)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={minCPA}
                      onChange={(e) => {
                        setMinCPA(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      placeholder="Min"
                      min="0"
                      className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      type="number"
                      value={maxCPA}
                      onChange={(e) => {
                        setMaxCPA(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      placeholder="Max"
                      min="0"
                      className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilterStatus('all')
                    setMinSpend(0)
                    setMinLeads(0)
                    setMaxLeads(0)
                    setMinPurchases(0)
                    setMaxPurchases(0)
                    setMinCPA(0)
                    setMaxCPA(0)
                    setShowTopPerformersOnly(false)
                    setCurrentPage(1)
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          <input
            type="checkbox"
            id="topPerformersFilter"
            checked={showTopPerformersOnly}
            onChange={(e) => {
              setShowTopPerformersOnly(e.target.checked)
              setCurrentPage(1)
            }}
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="topPerformersFilter" className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer">
            Show Top Performers Only
          </label>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {sortedCampaigns.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-gray-500">
              <p className="text-base font-medium mb-2">No ads found</p>
              <p className="text-sm">
                {hasActiveFilters
                  ? 'Try adjusting your filters to see more results'
                  : 'No data available to display'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {paginatedCampaigns.map((campaign) => (
              <div key={campaign.campaignName} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Campaign Header */}
                <div 
                  className="bg-indigo-50 p-3 border-b border-indigo-100 cursor-pointer"
                  onClick={() => toggleCampaign(campaign.campaignName)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 mt-1 flex-shrink-0"
                        checked={isCampaignSelected(campaign)}
                        ref={el => {
                          if (el) el.indeterminate = isCampaignPartiallySelected(campaign)
                        }}
                        onChange={(e) => handleSelectCampaign(campaign, e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-gray-900 break-words">{campaign.campaignName}</span>
                          {campaign.isTopPerformer && (
                            <Badge variant="success" className="text-xs">Top</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {campaign.adSets.length} ad sets • {campaign.adSets.reduce((sum, as) => sum + as.ads.length, 0)} ads
                        </div>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform flex-shrink-0 ${expandedCampaigns.has(campaign.campaignName) ? '' : '-rotate-90'}`} />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                    <div className="bg-white rounded p-2">
                      <div className="text-gray-500">Spend</div>
                      <div className="font-semibold text-gray-900">{formatCurrency(campaign.totalSpend)}</div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="text-gray-500">Leads</div>
                      <div className="font-semibold text-gray-900">{campaign.totalLeads}</div>
                    </div>
                    {campaign.cpa > 0 && (
                      <div className="bg-white rounded p-2">
                        <div className="text-gray-500">CPA</div>
                        <div className="font-semibold text-gray-900">{formatCurrency(campaign.cpa)}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ad Sets */}
                {expandedCampaigns.has(campaign.campaignName) && campaign.adSets.map((adSet) => {
                  const adSetKey = `${campaign.campaignName}::${adSet.adSetName}`
                  return (
                    <div key={adSetKey} className="border-t border-gray-200">
                      <div 
                        className="bg-gray-50 p-3 cursor-pointer"
                        onClick={() => toggleAdSet(campaign.campaignName, adSet.adSetName)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 mt-1 flex-shrink-0"
                              checked={isAdSetSelected(adSet)}
                              ref={el => {
                                if (el) el.indeterminate = isAdSetPartiallySelected(adSet)
                              }}
                              onChange={(e) => handleSelectAdSet(campaign, adSet, e)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm text-gray-900 break-words">{adSet.adSetName}</span>
                                {adSet.isTopPerformer && (
                                  <Badge variant="success" className="text-xs">Top</Badge>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{adSet.ads.length} ads</div>
                            </div>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform flex-shrink-0 ${expandedAdSets.has(adSetKey) ? '' : '-rotate-90'}`} />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                          <div className="bg-white rounded p-2">
                            <div className="text-gray-500">Spend</div>
                            <div className="font-semibold">{formatCurrency(adSet.totalSpend)}</div>
                          </div>
                          <div className="bg-white rounded p-2">
                            <div className="text-gray-500">Leads</div>
                            <div className="font-semibold">{adSet.totalLeads}</div>
                          </div>
                          {adSet.cpa > 0 && (
                            <div className="bg-white rounded p-2">
                              <div className="text-gray-500">CPA</div>
                              <div className="font-semibold">{formatCurrency(adSet.cpa)}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ads */}
                      {expandedAdSets.has(adSetKey) && adSet.ads.map((ad, adIndex) => (
                        <div 
                          key={adIndex}
                          className={`p-3 border-t border-gray-100 ${ad.isTopPerformer ? 'bg-green-50' : 'bg-white'}`}
                          onClick={() => setSelectedAd(ad)}
                        >
                          <div className="flex items-start gap-3">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 mt-1 flex-shrink-0"
                              checked={selectedAds.has(ad['Ad ID'])}
                              onChange={(e) => handleSelectAd(ad['Ad ID'], e)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            
                            {/* Thumbnail */}
                            <div className="flex-shrink-0">
                              {ad['Video ID'] && String(ad['Video ID']).trim() !== '' && String(ad['Video ID']) !== '0' ? (
                                <div className="relative w-12 h-12 rounded overflow-hidden bg-black">
                                  <iframe
                                    src={`https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/facebook/videos/${ad['Video ID']}/&show_text=false&width=48&height=48&t=0`}
                                    className="absolute top-0 left-0 w-full h-full"
                                    style={{ border: 'none', overflow: 'hidden', pointerEvents: 'none' }}
                                    scrolling="no"
                                    frameBorder="0"
                                  />
                                </div>
                              ) : ad['Image URL'] ? (
                                <img src={String(ad['Image URL'])} alt="" className="w-12 h-12 rounded object-cover" />
                              ) : (
                                <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            {/* Ad Info */}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900 break-words line-clamp-2">
                                {String(ad['Ad Name'])}
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                <div>
                                  <span className="text-gray-500">Spend:</span>
                                  <span className="ml-1 font-semibold">{formatCurrency(ad['Spend'])}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Leads:</span>
                                  <span className="ml-1 font-semibold">{ad['Leads']}</span>
                                </div>
                                {ad['Cost Per Acquisition'] > 0 && (
                                  <div>
                                    <span className="text-gray-500">CPA:</span>
                                    <span className="ml-1 font-semibold">{formatCurrency(ad['Cost Per Acquisition'])}</span>
                                  </div>
                                )}
                                {ad['Purchases'] > 0 && (
                                  <div>
                                    <span className="text-gray-500">Purchases:</span>
                                    <span className="ml-1 font-semibold">{ad['Purchases']}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-300px)] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-10 bg-gray-50 sticky left-0 z-30">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-10 bg-gray-50 sticky left-10 z-30"></th>
                {visibleColumns.map((column, index) => (
                  <th
                    key={column}
                    draggable
                    onDragStart={(e) => handleColumnDragStart(e, index)}
                    onDragOver={(e) => handleColumnDragOver(e, index)}
                    onDrop={(e) => handleColumnDrop(e, index)}
                    onDragEnd={handleColumnDragEnd}
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-move bg-gray-50 whitespace-nowrap ${
                      dragOverColumnIndex === index ? 'bg-indigo-100 border-2 border-indigo-400' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <button
                        onClick={() => handleSort(column)}
                        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                      >
                        <span className="font-semibold">{formatHeader(column)}</span>
                        {getSortIcon(column)}
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 2} className="px-4 py-12 text-center">
                    <div className="text-gray-500">
                      <p className="text-lg font-medium mb-2">No ads found</p>
                      <p className="text-sm">
                        {hasActiveFilters
                          ? 'Try adjusting your filters to see more results'
                          : 'No data available to display'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedCampaigns.map((campaign) => (
                    <React.Fragment key={campaign.campaignName}>
                      {/* Campaign Row */}
                      <tr className="bg-indigo-50 hover:bg-indigo-100 cursor-pointer transition-colors" onClick={() => toggleCampaign(campaign.campaignName)}>
                        <td className="px-4 py-3 sticky left-0 bg-indigo-50 z-10">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300"
                            checked={isCampaignSelected(campaign)}
                            ref={el => {
                              if (el) el.indeterminate = isCampaignPartiallySelected(campaign)
                            }}
                            onChange={(e) => handleSelectCampaign(campaign, e)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-4 py-3 sticky left-10 bg-indigo-50 z-10">
                          <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${expandedCampaigns.has(campaign.campaignName) ? '' : '-rotate-90'}`} />
                        </td>
                        <td colSpan={visibleColumns.length} className="px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{campaign.campaignName}</span>
                              {campaign.isTopPerformer && (
                                <Badge variant="success" className="text-xs">Top Performer</Badge>
                              )}
                              <span className="text-xs text-gray-500">
                                {campaign.adSets.length} ad sets • {campaign.adSets.reduce((sum, as) => sum + as.ads.length, 0)} ads
                              </span>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                              <span>Spend: <strong>{formatCurrency(campaign.totalSpend)}</strong></span>
                              <span>Leads: <strong>{campaign.totalLeads}</strong></span>
                              {campaign.cpa > 0 && <span>CPA: <strong>{formatCurrency(campaign.cpa)}</strong></span>}
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* AdSet Rows */}
                      {expandedCampaigns.has(campaign.campaignName) && campaign.adSets.map((adSet) => {
                        const adSetKey = `${campaign.campaignName}::${adSet.adSetName}`
                        return (
                          <React.Fragment key={adSetKey}>
                            <tr className="bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => toggleAdSet(campaign.campaignName, adSet.adSetName)}>
                              <td className="px-4 py-2 pl-8 sticky left-0 bg-gray-50 z-10">
                                <input 
                                  type="checkbox" 
                                  className="rounded border-gray-300"
                                  checked={isAdSetSelected(adSet)}
                                  ref={el => {
                                    if (el) el.indeterminate = isAdSetPartiallySelected(adSet)
                                  }}
                                  onChange={(e) => handleSelectAdSet(campaign, adSet, e)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                              <td className="px-4 py-2 sticky left-10 bg-gray-50 z-10">
                                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${expandedAdSets.has(adSetKey) ? '' : '-rotate-90'}`} />
                              </td>
                              <td colSpan={visibleColumns.length} className="px-4 py-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{adSet.adSetName}</span>
                                    {adSet.isTopPerformer && (
                                      <Badge variant="success" className="text-xs">Top</Badge>
                                    )}
                                    <span className="text-xs text-gray-500">{adSet.ads.length} ads</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs">
                                    <span>Spend: <strong>{formatCurrency(adSet.totalSpend)}</strong></span>
                                    <span>Leads: <strong>{adSet.totalLeads}</strong></span>
                                    {adSet.cpa > 0 && <span>CPA: <strong>{formatCurrency(adSet.cpa)}</strong></span>}
                                  </div>
                                </div>
                              </td>
                            </tr>

                            {/* Ad Rows */}
                            {expandedAdSets.has(adSetKey) && adSet.ads.map((ad, adIndex) => (
                              <tr 
                                key={adIndex}
                                className={`hover:bg-gray-50 cursor-pointer transition-colors ${ad.isTopPerformer ? 'bg-green-50 hover:bg-green-100' : ''}`}
                                onClick={() => setSelectedAd(ad)}
                              >
                                <td className="px-4 py-2 pl-12 sticky left-0 bg-inherit z-10">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300"
                                    checked={selectedAds.has(ad['Ad ID'])}
                                    onChange={(e) => handleSelectAd(ad['Ad ID'], e)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </td>
                                <td className="px-4 py-2 sticky left-10 bg-inherit z-10">
                                  {ad['Video ID'] && String(ad['Video ID']).trim() !== '' && String(ad['Video ID']) !== '0' ? (
                                    <div className="relative w-8 h-8 rounded overflow-hidden bg-black">
                                      <iframe
                                        src={`https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/facebook/videos/${ad['Video ID']}/&show_text=false&width=32&height=32&t=0`}
                                        className="absolute top-0 left-0 w-full h-full"
                                        style={{ border: 'none', overflow: 'hidden', pointerEvents: 'none' }}
                                        scrolling="no"
                                        frameBorder="0"
                                      />
                                    </div>
                                  ) : ad['Image URL'] ? (
                                    <img src={String(ad['Image URL'])} alt="" className="w-8 h-8 rounded object-cover" />
                                  ) : (
                                    <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                                      <FileText className="w-4 h-4 text-gray-400" />
                                    </div>
                                  )}
                                </td>
                                {visibleColumns.map((column) => (
                                  <td key={column} className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                                    {formatCellValue(column, ad[column])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </React.Fragment>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-3 sm:p-4 rounded-lg border border-gray-200 gap-3">
          <div className="text-xs sm:text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, campaignGroups.length)} of {campaignGroups.length}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
              disabled={currentPage === 1}
              className="text-xs sm:text-sm"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" /> 
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page = i + 1
                if (totalPages > 5) {
                  page = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i))
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded text-xs sm:text-sm font-medium transition-all ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
              disabled={currentPage === totalPages}
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Column Customizer Modal */}
      {showColumnCustomizer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowColumnCustomizer(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Customize Columns</h3>
              <button onClick={() => setShowColumnCustomizer(false)} className="p-1 hover:bg-gray-200 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                Select columns to display and drag to reorder them
              </p>
              
              <div className="mb-4">
                <input
                  type="text"
                  value={columnSearchQuery}
                  onChange={(e) => setColumnSearchQuery(e.target.value)}
                  placeholder="Search columns..."
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2">
                {filteredAvailableColumns.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No columns found matching "{columnSearchQuery}"</p>
                  </div>
                ) : (
                  filteredAvailableColumns.map((column) => (
                    <div
                      key={column}
                      className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border-2 transition-all ${
                        visibleColumns.includes(column)
                          ? 'bg-indigo-50 border-indigo-200'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(column)}
                        onChange={() => toggleColumn(column)}
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <GripVertical className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      <span className="text-xs sm:text-sm font-medium text-gray-900 flex-1">
                        {formatHeader(column)}
                      </span>
                      {visibleColumns.includes(column) && (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 flex-shrink-0">
              <button
                onClick={() => {
                  setVisibleColumns(defaultColumns.filter(col => allAvailableColumns.includes(col)))
                  setColumnSearchQuery('')
                }}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 order-2 sm:order-1"
              >
                Reset to Default
              </button>
              <button
                onClick={() => {
                  setShowColumnCustomizer(false)
                  setColumnSearchQuery('')
                }}
                className="px-4 py-2 bg-indigo-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-indigo-700 order-1 sm:order-2"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ad Preview Modal - Responsive */}
      {selectedAd && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAd(null)}>
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gray-50 p-4 sm:p-6 border-b border-gray-200 flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-xl font-bold text-gray-900 break-words">{String(selectedAd['Ad Name'])}</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Ad Details</p>
              </div>
              <button onClick={() => setSelectedAd(null)} className="p-2 hover:bg-gray-200 rounded-lg flex-shrink-0">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Ad Creative */}
              {selectedAd && ((selectedAd['Video ID'] && String(selectedAd['Video ID']).trim() !== '' && String(selectedAd['Video ID']) !== '0') || selectedAd['Image URL']) ? (
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-3">Ad Creative</h4>
                  
                  <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                    {/* Creative Content */}
                    <div className="flex-1 space-y-3 sm:space-y-4 order-2 lg:order-1">
                      {selectedAd['Video Title'] && String(selectedAd['Video Title']).trim() !== '' && (
                        <div>
                          <h5 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Title</h5>
                          <p className="text-sm sm:text-base text-gray-900">{String(selectedAd['Video Title'])}</p>
                        </div>
                      )}
                      
                      {selectedAd['Video Body'] && String(selectedAd['Video Body']).trim() !== '' && (
                        <div>
                          <h5 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Body</h5>
                          <p className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">{String(selectedAd['Video Body'])}</p>
                        </div>
                      )}
                      
                      {selectedAd['Link URL'] && String(selectedAd['Link URL']).trim() !== '' && (
                        <div className="pt-2">
                          <a
                            href={String(selectedAd['Link URL'])}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                            {selectedAd['CTA Type'] ? String(selectedAd['CTA Type']).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : 'View Landing Page'}
                          </a>
                        </div>
                      )}
                    </div>
                    
                    {/* Video/Image */}
                    <div className="flex-shrink-0 order-1 lg:order-2">
                      {selectedAd['Video ID'] && String(selectedAd['Video ID']).trim() !== '' && String(selectedAd['Video ID']) !== '0' ? (
                        <div className="flex flex-col items-center gap-3 sm:gap-4">
                          <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl w-full max-w-[380px] mx-auto" style={{ aspectRatio: '9/16', maxHeight: '70vh' }}>
                            <iframe
                              src={`https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/facebook/videos/${selectedAd['Video ID']}/&show_text=false&width=380&height=676&t=0`}
                              className="absolute top-0 left-0 w-full h-full"
                              style={{ border: 'none', overflow: 'hidden' }}
                              scrolling="no"
                              frameBorder="0"
                              allowFullScreen={true}
                              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                            />
                          </div>
                          
                          <div className="text-center space-y-2 w-full">
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                              <a
                                href={`https://www.facebook.com/${selectedAd['Video ID']}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all"
                              >
                                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                                Open in Facebook
                              </a>
                              {/* <a
                                href={`https://ai-video-analytics-scalex.streamlit.app/?video_id=${encodeURIComponent(selectedAd['Video ID'] || '')}&ad_name=${encodeURIComponent(selectedAd['Ad Name'] || '')}&campaign=${encodeURIComponent(selectedAd['Campaign Name'] || '')}&adset=${encodeURIComponent(selectedAd['AdSet Name'] || '')}&status=${encodeURIComponent(selectedAd['Active Status'] || '')}&title=${encodeURIComponent(selectedAd['Video Title'] || '')}&body=${encodeURIComponent(selectedAd['Video Body'] || '')}&link=${encodeURIComponent(selectedAd['Link URL'] || '')}&cta=${encodeURIComponent(selectedAd['CTA Type'] || '')}&spend=${encodeURIComponent(selectedAd['Spend'] || '')}&impressions=${encodeURIComponent(selectedAd['Impressions'] || '')}&clicks=${encodeURIComponent(selectedAd['Outbound Clicks'] || '')}&leads=${encodeURIComponent(selectedAd['Leads'] || '')}&cpa=${encodeURIComponent(selectedAd['Cost Per Acquisition'] || '')}&roas=${encodeURIComponent(selectedAd['ROAS'] || '')}&ctr=${encodeURIComponent(selectedAd['CTR'] || '')}&cpc=${encodeURIComponent(selectedAd['CPC'] || '')}&video_id=${encodeURIComponent(selectedAd['Video ID'] || '')}&purchases=${encodeURIComponent(selectedAd['Purchases'] || '')}&registrations=${encodeURIComponent(selectedAd['Registrations'] || '')}&landing_page_views=${encodeURIComponent(selectedAd['Landing Page Views'] || '')}&target_cpa=${encodeURIComponent(targetCPA || '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                              >
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                Analyze Video
                              </a> */}
                            </div>
                            <p className="text-xs text-gray-500">Video ID: {selectedAd['Video ID']}</p>
                          </div>
                        </div>
                      ) : selectedAd['Image URL'] ? (
                        <img
                          src={String(selectedAd['Image URL'])}
                          alt={String(selectedAd['Ad Name'])}
                          className="w-full max-w-md rounded-lg shadow-lg mx-auto"
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* All Metrics */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-3">All Metrics</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {allAvailableColumns
                    .filter(column => !['Video Title', 'Video Body', 'Link URL', 'CTA Type'].includes(column))
                    .map((column) => (
                    <div key={column} className="bg-white rounded p-2 sm:p-3 border border-gray-200">
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        {formatHeader(column)}
                      </div>
                      <div className="text-xs sm:text-sm font-semibold break-words">
                        {formatCellValue(column, selectedAd[column])}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
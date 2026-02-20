import React, { useState } from 'react';
import { Search, TrendingUp, Eye, Image, ExternalLink, BarChart3, Globe, Building, ChevronLeft, ChevronRight } from 'lucide-react';

const AdDiscoveryComponent = ({ apiEndpoint = 'http://localhost:5678/webhook-test/ad-discovery-6months' }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const adsPerPage = 5;

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentPage(1);
    
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: query })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Handle array response - take first element
      const resultData = Array.isArray(data) ? data[0] : data;
      setResults(resultData);
    } catch (err) {
      setError(`Failed to fetch ads: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Get ads from correct data structure
  const allAds = results?.googleAdsData?.ads || [];
  const totalPages = Math.ceil(allAds.length / adsPerPage);
  const startIndex = (currentPage - 1) * adsPerPage;
  const endIndex = startIndex + adsPerPage;
  const currentAds = allAds.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ad Discovery Dashboard</h1>
        <p className="text-gray-600">Discover top-performing ads and insights from across the web</p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter brand name or search query (e.g., 'nike', 'adidas')"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Searching...' : 'Discover Ads'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            Analyzing ads and gathering insights...
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Query Info */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <h3 className="font-semibold text-gray-900 mb-2">
              Search Results for: "{results.metadata?.brandName || query}"
            </h3>
            <div className="text-sm text-gray-600 space-x-4">
              <span><strong>Country:</strong> {results.metadata?.country || 'India'}</span>
              <span><strong>Date Range:</strong> {results.metadata?.dateRange?.durationMonths || 6} months</span>
              <span><strong>Analyzed:</strong> {new Date(results.metadata?.processedAt).toLocaleString()}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {results.summary?.totalAdsFound || 0}
              </div>
              <div className="text-sm text-gray-500">Total Ads Found</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {results.summary?.googleAds || 0}
              </div>
              <div className="text-sm text-gray-500">Google Ads</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {results.summary?.metaAds || 0}
              </div>
              <div className="text-sm text-gray-500">Meta Ads</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {results.metaAdsData?.statistics?.totalSpend || 0}
              </div>
              <div className="text-sm text-gray-500">Total Spend (USD)</div>
            </div>
          </div>

          {/* Top Performing Ads */}
          {allAds.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Ad Results
                </h3>
                {totalPages > 1 && (
                  <div className="text-sm text-gray-500">
                    Showing {startIndex + 1}-{Math.min(endIndex, allAds.length)} of {allAds.length} ads
                  </div>
                )}
              </div>
              <div className="grid gap-4">
                {currentAds.map((ad, index) => (
                  <div key={startIndex + index} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-blue-500">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                            #{ad.rank || ad.searchRank}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              {ad.platform}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 leading-tight">
                        {ad.title}
                      </h4>
                      
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {ad.snippet}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span>Search Rank: #{ad.searchRank}</span>
                        </div>
                        <a
                          href={ad.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Original
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, index) => {
                      const page = index + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-3 py-2 text-sm rounded-lg ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              No ads found for this search query. Try a different brand name.
            </div>
          )}

          {/* Key Findings */}
          {results.keyFindings && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Key Findings
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Average Campaign Duration</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {results.keyFindings.averageCampaignDuration}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Total Spend</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {results.keyFindings.totalSpend}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Total Impressions</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {results.keyFindings.totalImpressions}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdDiscoveryComponent;
// === src/components/features/AgentReviews/AgentReviewsTab.tsx (WITH PAGINATION) ===
import React, { useEffect } from 'react'
import { Users, RefreshCw, Loader2, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { ReviewCard } from './ReviewCard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAgentReviews } from '@/hooks/useAgentReviews'

export function AgentReviewsTab() {
  const {
    reviewsData, // Current page data (8 items)
    responseInfo,
    isLoading,
    error,
    generateReviews,
    hasReviews,
    reviewsCount, // Total count
    currentPageCount, // Current page count
    pagination
  } = useAgentReviews()

  // Generate reviews when tab is clicked
  useEffect(() => {
    console.log('🎯 Agent Reviews tab opened - generating reviews')
    generateReviews().catch(console.error)
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Generating Agent Reviews...</h3>
        <p className="text-gray-600 text-center">
          AI is analyzing your ads and generating detailed reviews<br/>
          <span className="text-sm text-gray-500">This may take a few moments...</span>
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <AlertCircle className="w-16 h-16 text-red-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Reviews Generation Failed</h3>
        <p className="text-red-600 mb-4 max-w-md">{error}</p>
        <Button onClick={() => generateReviews().catch(console.error)} className="mb-2">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <p className="text-xs text-gray-500">
          Make sure n8n is running and the agent-reviews workflow is active
        </p>
      </div>
    )
  }

  if (!hasReviews) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Users className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Available</h3>
        <p className="text-gray-600 mb-4">
          No agent reviews were generated
          {responseInfo?.message && (
            <><br/><span className="text-sm italic">"{responseInfo.message}"</span></>
          )}
        </p>
        <Button onClick={() => generateReviews().catch(console.error)}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Generate Reviews
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Agent Reviews ({reviewsCount} total)
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => generateReviews().catch(console.error)}
          disabled={isLoading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Reviews
        </Button>
      </div>

      {/* Response Info */}
      {responseInfo && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="text-sm text-blue-800">
            <div className="flex items-center justify-between">
              {responseInfo.status && (
                <span><strong>Analysis Status:</strong> {responseInfo.status}</span>
              )}
              {responseInfo.timestamp && (
                <span className="text-xs text-blue-600">
                  {new Date(responseInfo.timestamp).toLocaleString()}
                </span>
              )}
            </div>
            {responseInfo.message && (
              <p className="mt-1 text-blue-700">{responseInfo.message}</p>
            )}
            {responseInfo.totalAds && (
              <p className="mt-1 text-blue-600">
                <strong>{responseInfo.totalAds}</strong> ads processed by AI agent
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Pagination Info */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-600">
            Showing {pagination.startIndex + 1} to {Math.min(pagination.endIndex, reviewsCount)} of {reviewsCount} reviews
          </div>
          <div className="text-sm text-gray-500">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviewsData.map((review, index) => (
          <ReviewCard 
            key={`page-${pagination.currentPage}-review-${pagination.startIndex + index}`} 
            review={review} 
            index={pagination.startIndex + index + 1} // Global index
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <Card className="bg-white border-gray-200">
          <div className="flex items-center justify-between">
            {/* Page Info */}
            <div className="text-sm text-gray-600">
              {currentPageCount} of {reviewsCount} reviews
            </div>

            {/* Pagination Buttons */}
            <div className="flex items-center space-x-2">
              {/* First Page */}
              <Button
                variant="ghost"
                size="sm"
                onClick={pagination.goToFirstPage}
                disabled={pagination.isFirstPage}
                className="p-2"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>

              {/* Previous Page */}
              <Button
                variant="ghost"
                size="sm"
                onClick={pagination.goToPrevPage}
                disabled={!pagination.hasPrevPage}
                className="p-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(pageNum => {
                    // Show current page, plus 2 pages before and after
                    return Math.abs(pageNum - pagination.currentPage) <= 2 ||
                           pageNum === 1 ||
                           pageNum === pagination.totalPages
                  })
                  .map((pageNum, idx, arr) => {
                    // Add ellipsis if there's a gap
                    const showEllipsis = idx > 0 && pageNum - arr[idx - 1] > 1

                    return (
                      <React.Fragment key={pageNum}>
                        {showEllipsis && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <Button
                          variant={pageNum === pagination.currentPage ? "default" : "ghost"}
                          size="sm"
                          onClick={() => pagination.goToPage(pageNum)}
                          className="min-w-[32px] h-8"
                        >
                          {pageNum}
                        </Button>
                      </React.Fragment>
                    )
                  })}
              </div>

              {/* Next Page */}
              <Button
                variant="ghost"
                size="sm"
                onClick={pagination.goToNextPage}
                disabled={!pagination.hasNextPage}
                className="p-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              {/* Last Page */}
              <Button
                variant="ghost"
                size="sm"
                onClick={pagination.goToLastPage}
                disabled={pagination.isLastPage}
                className="p-2"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Items per page info */}
            <div className="text-sm text-gray-500">
              {pagination.itemsPerPage} per page
            </div>
          </div>
        </Card>
      )}

      {/* Footer Stats */}
      <Card className="bg-gray-50 border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            <strong>{reviewsCount}</strong> reviews generated
            {pagination.totalPages > 1 && (
              <span className="ml-2 text-gray-500">
                • <strong>{pagination.totalPages}</strong> pages
              </span>
            )}
          </span>
          <span>
            Generated: {new Date().toLocaleString()}
          </span>
        </div>
      </Card>
    </div>
  )
}
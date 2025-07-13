import React, { useState, useEffect, useRef, useCallback } from 'react';
import './InfiniteScroll.css';

const InfiniteScroll = ({
  items = [],
  hasMore = true,
  loading = false,
  onLoadMore,
  renderItem,
  endMessage = "That's all folks!",
  loadingMessage = "Loading more...",
  className = "",
  threshold = 200, // pixels from bottom to trigger load more
  pageSize
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const loadingRef = useRef(false);
  const observerRef = useRef(null);

  // Update loading ref whenever loading state changes
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // Reset page when items array is cleared (new search)
  useEffect(() => {
    if (items.length === 0) {
      setCurrentPage(0);
    }
  }, [items.length === 0]);

  // Load more items when reaching the end
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) {
      console.log('🛑 InfiniteScroll: Not loading more - loading:', loadingRef.current, 'hasMore:', hasMore);
      return;
    }
    
    console.log('🔄 InfiniteScroll: Loading page:', currentPage);
    
    // Save the exact scroll position before loading
    const scrollPosition = window.scrollY;
    
    // ✅ FIX: Use currentPage directly, don't add 1
    await onLoadMore(currentPage);
    
    // ✅ FIX: Increment AFTER the call
    setCurrentPage(prev => prev + 1);

    // Restore the exact scroll position after content update
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPosition);
    });
  }, [currentPage, hasMore, onLoadMore]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '-100px 0px 0px 0px', // Trigger when last item is 100px past the bottom
      threshold: 0.1
    };

    const handleObserver = (entries) => {
      const [target] = entries;
      console.log('👁️ InfiniteScroll Observer:', {
        isIntersecting: target.isIntersecting,
        loading: loadingRef.current,
        hasMore: hasMore
      });
      
      if (target.isIntersecting && !loadingRef.current && hasMore) {
        console.log('✅ InfiniteScroll: Triggering loadMore');
        loadMore();
      }
    };

    observerRef.current = new IntersectionObserver(handleObserver, options);

    // Observe the last item
    const lastItem = document.querySelector('.infinite-scroll-item:last-child');
    if (lastItem) {
      console.log('🔗 InfiniteScroll: Observing last item');
      observerRef.current.observe(lastItem);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [items, hasMore, loadMore]);

  return (
    <div className={`infinite-scroll-container ${className}`}>
      {console.log('🔄 InfiniteScroll RENDER - loading:', loading, 'items.length:', items.length, 'hasMore:', hasMore)}
      
      {/* Items List */}
      <div className="infinite-scroll-items">
        {items.map((item, index) => (
          <div key={index} className="infinite-scroll-item">
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <>
          {console.log('🔄 InfiniteScroll RENDERING loading indicator')}
          <div className="infinite-scroll-loading">
            <div className="spinner"></div>
            <span>{loadingMessage}</span>
          </div>
        </>
      )}

      {/* End Message */}
      {!hasMore && items.length > 0 && (
        <div className="end-message">
          ——— {endMessage} ———
        </div>
      )}

      
    </div>
  );
};

export default InfiniteScroll;
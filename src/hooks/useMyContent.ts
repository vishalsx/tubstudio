import { useState, useCallback, useEffect } from 'react';
import { RepositoryItem, RepositoryResponse, UserContext } from '../types';
import { translationService } from '../services/translation.service';

// Helper to load settings
const getRepositorySettings = (): { limit: number; useVectorSearch: boolean } => {
    try {
        const settings = localStorage.getItem('repository_settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            return {
                limit: parsed.limit || 25,
                useVectorSearch: parsed.use_vector_search !== false // Default true
            };
        }
    } catch (e) {
        console.error('Failed to load repository settings:', e);
    }
    return { limit: 25, useVectorSearch: true };
};

export const useMyContent = (userContext: UserContext | null) => {
    const [items, setItems] = useState<RepositoryItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const initialSettings = getRepositorySettings();
    const [limit, setLimit] = useState(initialSettings.limit);
    const [useVectorSearch, setUseVectorSearch] = useState(initialSettings.useVectorSearch);
    const [pageCache, setPageCache] = useState<Map<number, string | null>>(new Map([[1, null]]));
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState(userContext?.languages_allowed[0] || 'English');
    const [selectedItem, setSelectedItem] = useState<RepositoryItem | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isJumping, setIsJumping] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Update settings when Changed
    useEffect(() => {
        const handleStorageChange = () => {
            const settings = getRepositorySettings();
            setLimit(settings.limit);
            setUseVectorSearch(settings.useVectorSearch);
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Fetch a specific page
    const fetchPage = useCallback(async (pageNumber: number, txnId?: string | null, queryOverride?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const effectiveQuery = queryOverride !== undefined ? queryOverride : searchQuery;

            // Calculate skip for search pagination
            const skip = effectiveQuery ? (pageNumber - 1) * limit : 0;
            // Use txnId only if NOT searching (browse mode)
            const effectiveTxnId = effectiveQuery ? undefined : (txnId || undefined);

            const response: RepositoryResponse = await translationService.getRepository(
                selectedLanguage,
                effectiveQuery || undefined,
                effectiveTxnId,
                limit,
                skip,
                useVectorSearch
            );

            setItems(response.items || []);
            setTotalCount(response.total || 0);
            setCurrentPage(pageNumber);
            setTotalPages(Math.ceil((response.total || 0) / limit));

            // Cache the transaction IDs for this page (only needed for browse mode)
            if (!effectiveQuery && response.items && response.items.length > 0) {
                // Store the last transaction ID for next page navigation
                const lastItem = response.items[response.items.length - 1];
                if (lastItem && lastItem.translation_id) {
                    setPageCache(prev => {
                        const newCache = new Map(prev);
                        // Cache the txnId for the NEXT page
                        if (pageNumber < Math.ceil((response.total || 0) / limit)) {
                            newCache.set(pageNumber + 1, lastItem.translation_id);
                        }
                        return newCache;
                    });
                }
            }

            return response;
        } catch (err: any) {
            console.error('Failed to fetch repository:', err);
            setError(err.message || 'Failed to fetch repository');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [selectedLanguage, searchQuery, limit, useVectorSearch]);

    // Navigate to next page
    const handleNext = useCallback(async () => {
        if (currentPage >= totalPages || isLoading) return;

        const nextPage = currentPage + 1;
        const txnId = pageCache.get(nextPage);

        await fetchPage(nextPage, txnId);
    }, [currentPage, totalPages, pageCache, fetchPage, isLoading]);

    // Navigate to previous page
    const handlePrevious = useCallback(async () => {
        if (currentPage <= 1 || isLoading) return;

        const prevPage = currentPage - 1;
        const txnId = pageCache.get(prevPage);

        await fetchPage(prevPage, txnId);
    }, [currentPage, pageCache, fetchPage, isLoading]);

    // Jump to a specific page
    const jumpToPage = useCallback(async (targetPage: number) => {
        if (targetPage === currentPage || targetPage < 1 || targetPage > totalPages || isLoading) return;

        // Check if we have this page cached
        if (pageCache.has(targetPage)) {
            const txnId = pageCache.get(targetPage);
            await fetchPage(targetPage, txnId);
            return;
        }

        // Need to fetch sequentially from current page to target
        setIsJumping(true);
        setError(null);

        try {
            let page = currentPage;
            const direction = targetPage > currentPage ? 1 : -1;

            while (page !== targetPage) {
                const nextPageNum = page + direction;
                // Use cached txnId if available, otherwise use from previous response
                const txnId = pageCache.get(nextPageNum);
                await fetchPage(nextPageNum, txnId);
                page = nextPageNum;
            }
        } catch (err) {
            console.error('Failed to jump to page:', err);
        } finally {
            setIsJumping(false);
        }
    }, [currentPage, totalPages, pageCache, fetchPage, isLoading]);

    // Handle search - reset to page 1
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
        setPageCache(new Map([[1, null]])); // Reset cache
        setSelectedItem(null);
        setItems([]); // Clear items before new search
        // Trigger fetch immediately on search
        fetchPage(1, null, query);
    }, [fetchPage]);

    // Handle language change - reset to page 1 but don't auto-fetch
    const handleLanguageChange = useCallback((lang: string) => {
        setSelectedLanguage(lang);
        setCurrentPage(1);
        setPageCache(new Map([[1, null]])); // Reset cache
        setSelectedItem(null);
        // Don't auto-fetch - wait for user to click search button
    }, []);

    const handleSelectItem = useCallback((item: RepositoryItem | null) => {
        setSelectedItem(item);
    }, []);

    return {
        items,
        totalCount,
        currentPage,
        totalPages,
        limit,
        pageCache,
        searchQuery,
        setSearchQuery,
        selectedLanguage,
        setSelectedLanguage: handleLanguageChange,
        selectedItem,
        setSelectedItem: handleSelectItem,
        isLoading,
        isJumping,
        error,
        handleSearch,
        handleNext,
        handlePrevious,
        jumpToPage,
        refresh: () => fetchPage(currentPage, pageCache.get(currentPage)),
    };
};

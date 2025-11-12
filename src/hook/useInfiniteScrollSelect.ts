import { useEffect, useState } from "react";

const useInfiniteScrollSelect = (
    fetchFn: (
        page: number,
        pageSize: number,
        search?: string
    ) => Promise<{ label: string; value: string }[]>,
    pageSize: number = 30,
    debounceDelay: number = 1000
) => {
    const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [searchInput, setSearchInputRaw] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [typing, setTyping] = useState(false); // 👈 new state

    const setSearchInput = (value: string) => {
        setSearchInputRaw(value);
        setTyping(true); // 👈 show loading while typing
    };

    const loadOptions = async (pageNumber: number, search?: string) => {
        setLoading(true);
        const newItems = await fetchFn(pageNumber, pageSize, search);
        setOptions((prev) => (pageNumber === 1 ? newItems : [...prev, ...newItems]));
        setHasMore(newItems.length === pageSize);
        setLoading(false);
        setTyping(false); // 👈 stop typing indicator after fetch
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (!loading && hasMore && scrollTop + clientHeight >= scrollHeight - 10) {
            setPage((prev) => prev + 1);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearch(searchInput);
            setPage(1);
        }, debounceDelay);

        return () => clearTimeout(timeout);
    }, [searchInput, debounceDelay]);

    useEffect(() => {
        loadOptions(page, debouncedSearch);
    }, [page, debouncedSearch]);

    // Use this function to reset states when necessary (e.g., after saving data or re-rendering the page).
    const resetInfiniteScrollStates = () => {
        setSearchInputRaw("");
    };

    return {
        searchInput,
        setSearchInput,
        options,
        loading,
        typing,
        handleScroll,
        resetInfiniteScrollStates,
    };
};

export default useInfiniteScrollSelect;

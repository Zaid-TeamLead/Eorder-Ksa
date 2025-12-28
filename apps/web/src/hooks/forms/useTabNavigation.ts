import { useState, useCallback, useMemo } from 'react';

interface UseTabNavigationParams<T extends string> {
  tabs: readonly { id: T; label: string }[];
  initialTab?: T;
}

interface UseTabNavigationReturn<T extends string> {
  currentTab: T;
  setCurrentTab: (tab: T) => void;
  handleNext: () => void;
  handlePrevious: () => void;
  currentIndex: number;
  totalTabs: number;
  isFirstTab: boolean;
  isLastTab: boolean;
}

/**
 * Custom hook for tab navigation in multi-step forms
 *
 * Manages tab state and provides navigation handlers with bounds checking.
 * Useful for any multi-step form or wizard-style interface.
 *
 * @example
 * ```tsx
 * const TABS = [
 *   { id: "step1", label: "Step 1" },
 *   { id: "step2", label: "Step 2" },
 *   { id: "step3", label: "Step 3" },
 * ] as const;
 *
 * const {
 *   currentTab,
 *   setCurrentTab,
 *   handleNext,
 *   handlePrevious,
 *   isFirstTab,
 *   isLastTab
 * } = useTabNavigation({
 *   tabs: TABS,
 *   initialTab: "step1"
 * });
 * ```
 */
export function useTabNavigation<T extends string>({
  tabs,
  initialTab,
}: UseTabNavigationParams<T>): UseTabNavigationReturn<T> {
  const [currentTab, setCurrentTab] = useState<T>(
    initialTab || tabs[0].id
  );

  // Get current tab index
  const currentIndex = useMemo(
    () => tabs.findIndex((tab) => tab.id === currentTab),
    [tabs, currentTab]
  );

  // Navigate to next tab
  const handleNext = useCallback(() => {
    if (currentIndex < tabs.length - 1) {
      setCurrentTab(tabs[currentIndex + 1].id);
    }
  }, [currentIndex, tabs]);

  // Navigate to previous tab
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentTab(tabs[currentIndex - 1].id);
    }
  }, [currentIndex, tabs]);

  // Computed properties
  const isFirstTab = currentIndex === 0;
  const isLastTab = currentIndex === tabs.length - 1;
  const totalTabs = tabs.length;

  return {
    currentTab,
    setCurrentTab,
    handleNext,
    handlePrevious,
    currentIndex,
    totalTabs,
    isFirstTab,
    isLastTab,
  };
}

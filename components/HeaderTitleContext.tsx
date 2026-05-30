"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type HeaderTitleContextValue = {
  titleOverride: string | null;
  setTitleOverride: (title: string | null) => void;
};

const HeaderTitleContext = createContext<HeaderTitleContextValue | null>(null);

export function HeaderTitleProvider({ children }: { children: React.ReactNode }) {
  const [titleOverride, setTitleOverrideState] = useState<string | null>(null);

  const setTitleOverride = useCallback((title: string | null) => {
    setTitleOverrideState(title);
  }, []);

  const value = useMemo(
    (): HeaderTitleContextValue => ({ titleOverride, setTitleOverride }),
    [titleOverride, setTitleOverride]
  );

  return (
    <HeaderTitleContext.Provider value={value}>{children}</HeaderTitleContext.Provider>
  );
}

export function useHeaderTitle(): HeaderTitleContextValue {
  const ctx = useContext(HeaderTitleContext);
  if (!ctx) {
    throw new Error("useHeaderTitle must be used within HeaderTitleProvider");
  }
  return ctx;
}

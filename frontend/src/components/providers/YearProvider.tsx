"use client";

import * as React from "react";

type YearContextValue = {
  yearId: number | null;
  setYearId: (id: number | null) => void;
};

const YearContext = React.createContext<YearContextValue>({ yearId: null, setYearId: () => {} });

export function YearProvider({
  children,
  yearId,
  setYearId,
}: {
  children: React.ReactNode;
  yearId: number | null;
  setYearId: (id: number | null) => void;
}) {
  const value = React.useMemo(() => ({ yearId, setYearId }), [yearId, setYearId]);
  return <YearContext.Provider value={value}>{children}</YearContext.Provider>;
}

export function useYearId() {
  return React.useContext(YearContext);
}

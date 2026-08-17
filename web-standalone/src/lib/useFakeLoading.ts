import { useEffect, useState } from "react";

// Simulates an async fetch so loading skeletons are visible in the demo.
// // TODO: backend — replace with real data fetching (react-query / loader).
export function useFakeLoading(ms = 650): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}

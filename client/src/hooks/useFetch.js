import { useState, useEffect, useCallback } from "react";

/**
 * useFetch Hook handles state management for API calls, including loading, error, and cancellation.
 *
 * @param {Function} fetchFn - Function that returns an Axios request Promise.
 * @param {Array} deps - Dependency array to trigger refetch.
 */
const useFetch = (fetchFn, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn(...args);
      setData(res.data);
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.error || err?.message || "Failed to load data";
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetchFn()
      .then((res) => {
        if (active) {
          setData(res.data);
        }
      })
      .catch((err) => {
        if (active) {
          const errMsg = err.response?.data?.error || err?.message || "Failed to load data";
          setError(errMsg);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, setData, refetch: execute };
};

export default useFetch;

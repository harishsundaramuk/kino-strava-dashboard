import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getActivities,
  getAthleteStats,
  getActivityStreams,
} from "@/lib/strava";

/**
 * useStrava — fetches and caches all data needed by the dashboard.
 *
 * Returns:
 *  - activities  : recent activities array
 *  - stats       : athlete totals (ytd, all_time)
 *  - streams     : { [activityId]: { heartrate, velocity_smooth } }
 *  - loading     : boolean
 *  - error       : string | null
 *  - refetch     : () => void
 */
export function useStrava() {
  const { athlete } = useAuth();
  const [activities, setActivities] = useState([]);
  const [stats,      setStats]      = useState(null);
  const [streams,    setStreams]     = useState({});
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const fetchAll = useCallback(async () => {
    if (!athlete) return;
    setLoading(true);
    setError(null);

    try {
      const [actsRaw, statsRaw] = await Promise.all([
        getActivities({ per_page: 10, page: 1 }),
        getAthleteStats(athlete.id),
      ]);

      setActivities(actsRaw);
      setStats(statsRaw);

      // Fetch heart-rate + velocity streams for the 3 most recent runs
      const runs = actsRaw
        .filter((a) => a.type === "Run")
        .slice(0, 3);

      const streamResults = await Promise.allSettled(
        runs.map((r) =>
          getActivityStreams(r.id, ["heartrate", "velocity_smooth", "distance"])
            .then((s) => [r.id, s])
        )
      );

      const streamMap = {};
      streamResults.forEach((res) => {
        if (res.status === "fulfilled") {
          const [id, data] = res.value;
          streamMap[id] = data;
        }
      });
      setStreams(streamMap);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [athlete]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { activities, stats, streams, loading, error, refetch: fetchAll };
}

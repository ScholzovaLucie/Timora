import { useEffect, useState } from "react";
import { Paper, Typography, CircularProgress, Box } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "../lib/supabaseClient";
import { format, subDays } from "date-fns";
import { useDataRefresh } from "../contexts/DataRefreshContext";

export default function StatsOverview({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { refreshKey } = useDataRefresh();

  useEffect(() => {
    if (!user?.id) return;

    const loadStats = async () => {
      const today = new Date();
      const startDate = subDays(today, 6);

      const { data: entries, error } = await supabase
        .from("time_entries")
        .select("start_time, duration_seconds")
        .eq("user_id", user.id)
        .gte("start_time", startDate.toISOString());

      if (error) {
        console.error("Chyba při načítání statistik:", error.message);
        setLoading(false);
        return;
      }

      // Agregace po dnech
      const dayMap = {};
      for (let i = 0; i < 7; i++) {
        const date = format(subDays(today, 6 - i), "yyyy-MM-dd");
        dayMap[date] = 0;
      }

      entries.forEach((e) => {
        const date = format(new Date(e.start_time), "yyyy-MM-dd");
        if (dayMap[date] !== undefined) {
          dayMap[date] += e.duration_seconds || 0;
        }
      });

      const chartData = Object.entries(dayMap).map(([date, seconds]) => ({
        date,
        hours: Math.round(seconds / 360) / 10, // jedna desetina hodiny
      }));

      setData(chartData);
      setLoading(false);
    };

    loadStats();
  }, [user?.id, refreshKey]);

  if (!user?.id) {
    return null; // nebo <Typography>Nejprve se přihlas</Typography>
  }

  return (
    <Paper sx={{ p: 3, mb: 4, width: "100%" }} elevation={4}>
      <Typography variant="h6" gutterBottom>
        Odpracováno za posledních 7 dní
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <Box height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="date" />
              <YAxis unit="h" />
              <Tooltip formatter={(v) => `${v} h`} />
              <Bar dataKey="hours" fill="#1ABC9C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
}

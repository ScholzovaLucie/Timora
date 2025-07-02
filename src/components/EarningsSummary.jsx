import { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  CircularProgress,
  Box,
  Stack,
  Divider,
} from "@mui/material";
import { supabase } from "../lib/supabaseClient";
import { useDataRefresh } from "../contexts/DataRefreshContext";

export default function EarningsSummary({ user }) {
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({ today: 0, month: 0 });
  const { refreshKey } = useDataRefresh();

  useEffect(() => {
    if (!user?.id) return;

    const fetchEarnings = async () => {
      setLoading(true);

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(
        startOfDay.getFullYear(),
        startOfDay.getMonth(),
        1
      );

      const [settingsRes, entriesRes] = await Promise.all([
        supabase
          .from("user_settings")
          .select("hourly_rate")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("time_entries")
          .select("start_time, duration_seconds")
          .eq("user_id", user.id)
          .gte("start_time", startOfMonth.toISOString()),
      ]);

      if (settingsRes.error) {
        console.error(
          "Chyba při načítání hodinovky:",
          settingsRes.error.message
        );
        setLoading(false);
        return;
      }

      const hourlyRate = settingsRes.data?.hourly_rate || 0;
      let todaySeconds = 0;
      let monthSeconds = 0;

      entriesRes.data?.forEach((e) => {
        const start = new Date(e.start_time);
        if (start >= startOfDay) todaySeconds += e.duration_seconds || 0;
        monthSeconds += e.duration_seconds || 0;
      });

      setEarnings({
        today: Math.round((todaySeconds / 3600) * hourlyRate),
        month: Math.round((monthSeconds / 3600) * hourlyRate),
      });

      setLoading(false);
    };

    fetchEarnings();
  }, [user.id, refreshKey]);

  return (
    <Paper sx={{ p: 3, mb: 4, width: "100%" }} elevation={4}>
      <Typography variant="h6" gutterBottom>
        Výdělek
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={2}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack direction="row" spacing={4} justifyContent="space-around">
          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Dnes
            </Typography>
            <Typography variant="h5" color="primary">
              {earnings.today} Kč
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem />

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Tento měsíc
            </Typography>
            <Typography variant="h5" color="primary">
              {earnings.month} Kč
            </Typography>
          </Box>
        </Stack>
      )}
    </Paper>
  );
}

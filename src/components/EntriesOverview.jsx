import { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Box,
  Stack,
} from "@mui/material";
import { supabase } from "../lib/supabaseClient";
import { format } from "date-fns";
import { useDataRefresh } from "../contexts/DataRefreshContext";

export default function EntriesOverview({ user }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [summary, setSummary] = useState({
    today: 0,
    month: 0,
    monthEarnings: 0,
  });

  const { refreshKey } = useDataRefresh();

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      const [entriesRes, settingsRes] = await Promise.all([
        supabase
          .from("time_entries")
          .select(
            "id, start_time, end_time, duration_seconds, task:tasks(name)"
          )
          .eq("user_id", user.id)
          .order("start_time", { ascending: false }),

        supabase
          .from("user_settings")
          .select("hourly_rate")
          .eq("user_id", user.id)
          .single(),
      ]);

      if (entriesRes.error) {
        console.error("Chyba při načítání záznamů:", entriesRes.error.message);
      } else {
        setEntries(entriesRes.data);
        computeSummary(entriesRes.data, settingsRes.data?.hourly_rate || 0);
      }

      if (settingsRes.error) {
        console.error(
          "Chyba při načítání hodinovky:",
          settingsRes.error.message
        );
      } else {
        setHourlyRate(settingsRes.data?.hourly_rate || 0);
      }

      setLoading(false);
    };

    const computeSummary = (data, rate) => {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      let todaySeconds = 0;
      let monthSeconds = 0;

      data.forEach((e) => {
        const start = new Date(e.start_time);
        if (start >= startOfDay) todaySeconds += e.duration_seconds || 0;
        if (start >= startOfMonth) monthSeconds += e.duration_seconds || 0;
      });

      const monthEarnings = ((monthSeconds / 3600) * rate).toFixed(0);

      setSummary({
        today: todaySeconds,
        month: monthSeconds,
        monthEarnings,
      });
    };

    fetchData();
  }, [user.id, refreshKey]);

  const formatDuration = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60) % 60;
    return `${h}h ${m}m`;
  };

  const formatCurrency = (amount) => `${amount} Kč`;

  return (
    <Paper sx={{ p: 3, mb: 4, width: "100%" }} elevation={4}>
      <Typography variant="h6" gutterBottom>
        Přehled záznamů
      </Typography>

      <Stack direction="row" spacing={4} sx={{ mb: 2 }}>
        <Typography variant="body1">
          Dnes: <strong>{formatDuration(summary.today)}</strong>
        </Typography>
        <Typography variant="body1">
          Tento měsíc: <strong>{formatDuration(summary.month)}</strong>
        </Typography>
        <Typography variant="body1">
          Výdělek tento měsíc:{" "}
          <strong>{formatCurrency(summary.monthEarnings)}</strong>
        </Typography>
      </Stack>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={2}>
          <CircularProgress />
        </Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Úkol</TableCell>
              <TableCell>Začátek</TableCell>
              <TableCell>Konec</TableCell>
              <TableCell>Trvání</TableCell>
              <TableCell>Výdělek</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => {
              const earning =
                ((entry.duration_seconds || 0) / 3600) * hourlyRate;
              return (
                <TableRow key={entry.id}>
                  <TableCell>{entry.task?.name || "Neznámý"}</TableCell>
                  <TableCell>
                    {entry.start_time
                      ? format(new Date(entry.start_time), "dd.MM.yyyy HH:mm")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {entry.end_time
                      ? format(new Date(entry.end_time), "dd.MM.yyyy HH:mm")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {formatDuration(entry.duration_seconds || 0)}
                  </TableCell>
                  <TableCell>{formatCurrency(earning.toFixed(0))}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
}

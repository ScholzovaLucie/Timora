// src/components/EntriesOverview.jsx

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
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  LocalizationProvider,
  DatePicker,
  DateTimePicker,
} from "@mui/x-date-pickers";
import { cs } from "date-fns/locale";
import { supabase } from "../lib/supabaseClient";
import { format } from "date-fns";
import { useDataRefresh } from "../contexts/DataRefreshContext";

export default function EntriesOverview({ user }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [summary, setSummary] = useState({
    today: 0,
    month: 0,
    monthEarnings: 0,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [tasks, setTasks] = useState([]);

  const { refreshKey, refresh } = useDataRefresh();

  useEffect(() => {
    if (!user?.id || !selectedMonth) return;

    const fetchData = async () => {
      const startOfMonth = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth(),
        1
      );
      const endOfMonth = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      const [entriesRes, settingsRes, tasksRes] = await Promise.all([
        supabase
          .from("time_entries")
          .select(
            "id, start_time, end_time, duration_seconds, task_id, task:tasks(name)"
          )
          .eq("user_id", user.id)
          .gte("start_time", startOfMonth.toISOString())
          .lte("start_time", endOfMonth.toISOString())
          .order("start_time", { ascending: false }),

        supabase
          .from("profiles")
          .select("hourly_rate")
          .eq("id", user.id)
          .single(),

        supabase
          .from("tasks")
          .select("id, name")
          .eq("user_id", user.id)
          .order("name", { ascending: true }),
      ]);

      if (!entriesRes.error) {
        setEntries(entriesRes.data);
        computeSummary(entriesRes.data, settingsRes.data?.hourly_rate || 0);
      }

      if (!settingsRes.error) {
        setHourlyRate(settingsRes.data?.hourly_rate || 0);
      }

      if (!tasksRes.error) {
        setTasks(tasksRes.data);
      }

      setLoading(false);
    };

    const computeSummary = (data, rate) => {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth(),
        1
      );

      let todaySeconds = 0;
      let monthSeconds = 0;

      data.forEach((e) => {
        const start = new Date(e.start_time);
        if (start >= startOfDay && start <= new Date())
          todaySeconds += e.duration_seconds || 0;
        if (start >= startOfMonth) monthSeconds += e.duration_seconds || 0;
      });

      const monthEarnings = ((monthSeconds / 3600) * rate).toFixed(0);
      setSummary({ today: todaySeconds, month: monthSeconds, monthEarnings });
    };

    fetchData();
  }, [user.id, refreshKey, selectedMonth]);

  const formatDuration = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60) % 60;
    return `${h}h ${m}m`;
  };

  const formatCurrency = (amount) => `${amount} Kč`;

  const handleEdit = (entry) => {
    setEditingEntry({
      ...entry,
      start_time: new Date(entry.start_time),
      end_time: new Date(entry.end_time),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (entryId) => {
    await supabase.from("time_entries").delete().eq("id", entryId);
    refresh();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingEntry(null);
  };

  const handleSave = async () => {
    if (
      !editingEntry.task_id ||
      !editingEntry.start_time ||
      !editingEntry.end_time
    )
      return;

    const duration = Math.round(
      (editingEntry.end_time - editingEntry.start_time) / 1000
    );

    let result;
    if (editingEntry.id) {
      result = await supabase
        .from("time_entries")
        .update({
          start_time: editingEntry.start_time.toISOString(),
          end_time: editingEntry.end_time.toISOString(),
          duration_seconds: duration,
          task_id: editingEntry.task_id,
        })
        .eq("id", editingEntry.id);
    } else {
      result = await supabase.from("time_entries").insert([
        {
          user_id: user.id,
          start_time: editingEntry.start_time.toISOString(),
          end_time: editingEntry.end_time.toISOString(),
          duration_seconds: duration,
          task_id: editingEntry.task_id,
        },
      ]);
    }

    if (result.error) {
      console.error("Nepodařilo se uložit záznam:", result.error.message);
      return;
    }

    handleDialogClose();
    refresh(); // spustí nové načtení
  };

  return (
    <Paper sx={{ p: 4, mb: 4, width: "100%" }} elevation={4}>
      <Typography variant="h6" gutterBottom align="center">
        Přehled záznamů
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={cs}>
          <DatePicker
            views={["year", "month"]}
            label="Vyber měsíc"
            value={selectedMonth}
            onChange={(newValue) => setSelectedMonth(newValue)}
            disableFuture
            minDate={new Date(2020, 0)}
            sx={{ width: 200 }}
          />
        </LocalizationProvider>
      </Box>

      <Stack direction="row" spacing={4} justifyContent="center" mb={2}>
        <Stack direction="column">
          <Typography>Dnes</Typography>
          <strong>{formatDuration(summary.today)}</strong>
        </Stack>
        <Stack direction="column">
          <Typography>Vybraný měsíc</Typography>
          <strong>{formatDuration(summary.month)}</strong>
        </Stack>
        <Stack direction="column">
          <Typography>Výdělek</Typography>
          <strong>{formatCurrency(summary.monthEarnings)}</strong>
        </Stack>
      </Stack>

      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={() => {
          setEditingEntry({
            start_time: new Date(),
            end_time: new Date(),
            task_id: tasks[0]?.id || null,
          });
          setDialogOpen(true);
        }}
        sx={{ mb: 2 }}
      >
        Přidat záznam
      </Button>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={2}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ overflow: "auto", maxHeight: "300px" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Úkol</TableCell>
                <TableCell>Začátek</TableCell>
                <TableCell>Konec</TableCell>
                <TableCell>Trvání</TableCell>
                <TableCell>Výdělek</TableCell>
                <TableCell></TableCell>
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
                    <TableCell>
                      <IconButton onClick={() => handleEdit(entry)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(entry.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>
          {editingEntry?.id ? "Upravit záznam" : "Přidat záznam"}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={cs}>
            <DateTimePicker
              label="Začátek"
              value={editingEntry?.start_time || null}
              onChange={(val) =>
                setEditingEntry((e) => ({ ...e, start_time: val }))
              }
              sx={{ mt: 2, mb: 2 }}
              fullWidth
            />
            <DateTimePicker
              label="Konec"
              value={editingEntry?.end_time || null}
              onChange={(val) =>
                setEditingEntry((e) => ({ ...e, end_time: val }))
              }
              sx={{ mb: 2 }}
              fullWidth
            />
          </LocalizationProvider>
          <TextField
            select
            label="Úkol"
            value={editingEntry?.task_id || ""}
            onChange={(e) =>
              setEditingEntry((prev) => ({
                ...prev,
                task_id: parseInt(e.target.value, 10),
              }))
            }
            fullWidth
          >
            {tasks.map((task) => (
              <MenuItem key={task.id} value={task.id}>
                {task.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Zrušit</Button>
          <Button onClick={handleSave} variant="contained">
            Uložit
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

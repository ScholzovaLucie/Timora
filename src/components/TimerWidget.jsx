import { useEffect, useState, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
} from "@mui/material";
import { supabase } from "../lib/supabaseClient";
import { useDataRefresh } from "../contexts/DataRefreshContext";

export default function TimerWidget({ user, tasks }) {
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [runningEntryId, setRunningEntryId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);
  const { refreshKey, refresh } = useDataRefresh();

  useEffect(() => {
    const checkRunningEntry = async () => {
      const { data } = await supabase
        .from("time_entries")
        .select("id, task_id, start_time")
        .eq("user_id", user.id)
        .is("end_time", null)
        .order("start_time", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setRunningEntryId(data.id);
        setSelectedTaskId(data.task_id);
        setStartTime(new Date(data.start_time));
      }
    };

    checkRunningEntry();
  }, [user.id, tasks]);

  useEffect(() => {
    if (startTime) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
      return () => clearInterval(intervalRef.current);
    } else {
      setElapsed(0);
    }
  }, [startTime]);

  const handleStart = async () => {
    if (!selectedTaskId) return;

    const { data, error } = await supabase
      .from("time_entries")
      .insert({
        user_id: user.id,
        task_id: selectedTaskId,
        start_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Chyba při spuštění časovače:", error.message);
    } else {
      setRunningEntryId(data.id);
      setStartTime(new Date(data.start_time));
      refresh(); // přidáno
    }
  };

  const handleStop = async () => {
    if (!runningEntryId) return;
    const end = new Date();
    const duration = Math.floor((end - startTime) / 1000);

    const { error } = await supabase
      .from("time_entries")
      .update({
        end_time: end.toISOString(),
        duration_seconds: duration,
      })
      .eq("id", runningEntryId);

    if (error) {
      console.error("Chyba při zastavení časovače:", error.message);
    } else {
      setRunningEntryId(null);
      setStartTime(null);
      setSelectedTaskId("");
      clearInterval(intervalRef.current);
      refresh(); // přidáno
    }
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };

  return (
    <Paper sx={{ p: 3, mb: 4, width: "100%" }} align="center" elevation={4}>
      <Stack spacing={2}>
        <Typography variant="h6">Časomíra</Typography>
        <FormControl fullWidth>
          <InputLabel id="task-select-label">Úkol</InputLabel>
          <Select
            labelId="task-select-label"
            value={selectedTaskId}
            label="Úkol"
            onChange={(e) => setSelectedTaskId(e.target.value)}
            disabled={!!runningEntryId}
          >
            {tasks.map((task) => (
              <MenuItem key={task.id} value={task.id}>
                {task.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="h5" align="center">
          {formatTime(elapsed)}
        </Typography>

        {runningEntryId ? (
          <Button variant="contained" color="error" onClick={handleStop}>
            Zastavit
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={handleStart}
            disabled={!selectedTaskId}
          >
            Spustit
          </Button>
        )}
      </Stack>
    </Paper>
  );
}

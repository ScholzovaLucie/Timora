import { useEffect, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  CircularProgress,
  Stack,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { supabase } from "../lib/supabaseClient";
import { useDataRefresh } from "../contexts/DataRefreshContext";

export default function TaskList({ user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const { refreshKey, refresh } = useDataRefresh();

  useEffect(() => {
    fetchTasks();
  }, [refreshKey]);

  const formatTimestamp = (date) => date.toISOString();

  const fetchTimeSummary = async (taskId) => {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const { data, error } = await supabase.rpc("get_task_time_summary", {
      task_id_input: taskId,
      user_id_input: user.id,
      start_day: formatTimestamp(startOfDay),
      start_month: formatTimestamp(startOfMonth),
    });

    if (error) {
      console.error("Chyba při RPC:", error.message);
      return { daily: 0, monthly: 0 };
    }

    const result = data?.[0] ?? {};
    return {
      daily: result.daily ?? 0,
      monthly: result.monthly ?? 0,
    };
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Chyba při načítání úkolů:", error.message);
    } else {
      const enriched = await Promise.all(
        data.map(async (task) => {
          const { daily, monthly } = await fetchTimeSummary(task.id);
          return { ...task, timeToday: daily, timeMonth: monthly };
        })
      );
      setTasks(enriched);
    }
    setLoading(false);
  };

  const formatTime = (seconds) => {
    const total = parseInt(seconds, 10);
    if (isNaN(total)) return "0h 0m";
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const handleDelete = async (taskId) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) {
      console.error("Chyba při mazání:", error.message);
    } else {
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      refresh(); // přidáno
    }
  };

  const handleAddTask = async () => {
    if (!newTaskName) return;

    const { error } = await supabase.from("tasks").insert({
      name: newTaskName,
      description: newTaskDescription,
      user_id: user.id,
    });

    if (error) {
      console.error("Chyba při vytváření úkolu:", error.message);
    } else {
      refresh(); // přidáno
      setNewTaskName("");
      setNewTaskDescription("");
      setOpenDialog(false);
    }
  };

  const openEditDialog = (task) => {
    setEditingTask(task);
    setEditName(task.name);
    setEditDescription(task.description || "");
    setEditDialogOpen(true);
  };

  const handleUpdateTask = async () => {
    const { error } = await supabase
      .from("tasks")
      .update({ name: editName, description: editDescription })
      .eq("id", editingTask.id);

    if (error) {
      console.error("Chyba při aktualizaci úkolu:", error.message);
    } else {
      refresh(); // přidáno
      setEditDialogOpen(false);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ mb: 4, width: "100%" }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5">Moje úkoly</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Přidat úkol
        </Button>
      </Box>

      {tasks.length === 0 ? (
        <Typography variant="body1">Nemáš žádné úkoly.</Typography>
      ) : (
        <Grid container spacing={2}>
          {tasks.map((task) => (
            <Grid item xs={12} sm={6} md={4} key={task.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{task.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {task.description || "Bez popisu"}
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <AccessTimeIcon fontSize="small" />
                      <Typography variant="caption">
                        {formatTime(task.timeToday)}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <CalendarMonthIcon fontSize="small" />
                      <Typography variant="caption">
                        {formatTime(task.timeMonth)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
                <CardActions>
                  <IconButton onClick={() => openEditDialog(task)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(task.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Přidat nový úkol</DialogTitle>
        <DialogContent>
          <TextField
            label="Název úkolu"
            fullWidth
            margin="normal"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
          />
          <TextField
            label="Popis"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Zrušit</Button>
          <Button onClick={handleAddTask} variant="contained">
            Uložit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Upravit úkol</DialogTitle>
        <DialogContent>
          <TextField
            label="Název"
            fullWidth
            margin="normal"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <TextField
            label="Popis"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Zrušit</Button>
          <Button onClick={handleUpdateTask} variant="contained">
            Uložit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

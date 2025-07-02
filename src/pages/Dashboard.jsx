// Dashboard.jsx – úprava: načítání tasks pro TimerWidget i TaskList
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  CircularProgress,
} from "@mui/material";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import TaskList from "../components/TaskList";
import TimerWidget from "../components/TimerWidget";
import StatsOverview from "../components/StatsOverview";

export default function Dashboard({ session }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Chyba při načítání úkolů:", error.message);
    } else {
      setTasks(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Timora
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {session.user.email}
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Odhlásit se
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <StatsOverview user={session.user} />
            <TimerWidget user={session.user} tasks={tasks} />
            <TaskList user={session.user} tasks={tasks} />
          </>
        )}
      </Container>
    </Box>
  );
}

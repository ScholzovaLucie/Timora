import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Container,
  Box,
  CircularProgress,
  Grid,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import TaskList from "../components/TaskList";
import TimerWidget from "../components/TimerWidget";
import StatsOverview from "../components/StatsOverview";
import EntriesOverview from "../components/EntriesOverview";
import { useDataRefresh } from "../contexts/DataRefreshContext";
import EarningsSummary from "../components/EarningsSummary";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import ExportPdfButton from "../components/ExportPdfButton";

export default function Dashboard({ session }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { refreshKey } = useDataRefresh();

  useEffect(() => {
    if (!session?.user) return;

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

    fetchTasks();
  }, [session, refreshKey]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session || !session.user) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          zIndex: (theme) => theme.zIndex.appBar,
        }}
      >
        <AppBar
          position="static"
          sx={{
            width: "95%",
            borderRadius: "8px", // volitelně zaoblené rohy
            mt: "10px",
          }}
        >
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Timora
            </Typography>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {session.user.email}
            </Typography>
            <IconButton
              component={Link}
              to="/profile"
              color="inherit"
              sx={{ ml: 1 }}
              title="Profil"
            >
              <AccountCircleIcon />
            </IconButton>

            <IconButton
              onClick={handleLogout}
              color="inherit"
              sx={{ ml: 1 }}
              title="Odhlásit se"
            >
              <LogoutIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      </Box>

      <Container
        maxWidth="lg"
        disableGutters
        sx={{ mt: "90px", px: { xs: 1, sm: 2, md: 3 } }}
      >
        {loading ? (
          <CircularProgress />
        ) : (
          <Grid container spacing={4}>
            {/* Levý sloupec */}
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start", // místo "center"
                justifyContent: "flex-start", // místo "center"
                width: "100%",
              }}
            >
              <TimerWidget user={session.user} tasks={tasks} />
              <EarningsSummary user={session.user} />
              <StatsOverview user={session.user} />
            </Grid>

            {/* Pravý sloupec */}
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start", // místo "center"
                justifyContent: "flex-start", // místo "center"
                width: "100%",
              }}
            >
              <TaskList user={session.user} tasks={tasks} />
              <Box display="flex" justifyContent="flex-end" mb={2}>
                <ExportPdfButton user={session.user} />
              </Box>
              <EntriesOverview user={session.user} />
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
}

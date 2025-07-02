import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Tabs,
  Tab,
} from "@mui/material";

export default function Auth({ onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState(0); // 0 = Login, 1 = Register
  const [error, setError] = useState(null);

  const handleAuth = async () => {
    setError(null);
    const authFn =
      tab === 0 ? supabase.auth.signInWithPassword : supabase.auth.signUp;
    const { data, error } = await authFn({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    } else {
      onAuthSuccess?.(); // Přesměrování nebo reload
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
    >
      <Paper elevation={3} sx={{ p: 4, minWidth: 350 }}>
        <Typography variant="h5" gutterBottom>
          {tab === 0 ? "Login to Timora" : "Register to Timora"}
        </Typography>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>

        <TextField
          label="Email"
          type="email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleAuth}
        >
          {tab === 0 ? "Login" : "Register"}
        </Button>
      </Paper>
    </Box>
  );
}

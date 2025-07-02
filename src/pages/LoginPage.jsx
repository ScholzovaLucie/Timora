// Vylepšená verze LoginPage.jsx
import { useState } from "react";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Typography,
  Container,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAuth = async () => {
    setError(null);
    let data, error;

    if (tab === 0) {
      ({ data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      }));
    } else {
      ({ data, error } = await supabase.auth.signUp({ email, password }));
    }

    if (error) {
      setError(error.message);
    } else {
      navigate("/");
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{ height: "100vh", display: "flex", alignItems: "center" }}
    >
      <Paper elevation={4} sx={{ p: 4, width: "100%", borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom textAlign="center">
          Timora
        </Typography>

        <Tabs
          value={tab}
          onChange={(_, newTab) => setTab(newTab)}
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          <Tab label="Přihlášení" />
          <Tab label="Registrace" />
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
          label="Heslo"
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
          fullWidth
          sx={{ mt: 3, py: 1.5 }}
          onClick={handleAuth}
        >
          {tab === 0 ? "Přihlásit se" : "Registrovat se"}
        </Button>
      </Paper>
    </Container>
  );
}

// src/pages/ProfilePage.jsx
import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ProfilePage({ session }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      setEmail(userData.user.email);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();
      console.log(profile);

      if (profile && !error) {
        setName(profile.name || "");
        console.log(profile.hourly_rate);
        setHourlyRate(profile.hourly_rate || "");
      }

      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    const userId = session.user.id;

    const [settingsRes, profileRes] = await Promise.all([
      supabase.from("profiles").upsert({
        id: userId,
        hourly_rate: parseFloat(hourlyRate),
        name,
      }),
    ]);

    if (settingsRes.error || profileRes.error) {
      setMessage({ type: "error", text: "Nepodařilo se uložit." });
    } else {
      setMessage({ type: "success", text: "Úspěšně uloženo." });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Můj profil
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Jméno"
            value={name}
            fullWidth
            onChange={(e) => setName(e.target.value)}
          />
          <TextField label="E-mail" value={email} disabled fullWidth />
          <TextField
            label="Hodinová sazba (Kč/h)"
            type="number"
            fullWidth
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
          />
          <Button variant="contained" onClick={handleSave}>
            Uložit
          </Button>
          <Button onClick={() => navigate(-1)} variant="outlined">
            Zpět
          </Button>
          {message && <Alert severity={message.type}>{message.text}</Alert>}
        </Stack>
      </Paper>
    </Container>
  );
}

import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { supabase } from "./lib/supabaseClient";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener?.subscription?.unsubscribe();
  }, []);

  if (loading) return null; // Nebo spinner

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            session ? <Dashboard session={session} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/login"
          element={session ? <Navigate to="/" /> : <LoginPage />}
        />
        <Route path="/profile" element={<ProfilePage session={session} />} />
      </Routes>
    </Router>
  );
}

export default App;

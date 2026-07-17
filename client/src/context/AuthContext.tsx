import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { ADMIN_EMAILS } from "../lib/adminEmails";
import { fetchMyProfile } from "../api/profile";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  username: string | null;
  usernameChecked: boolean;
  setUsernameLocally: (username: string) => void;
  signUp: (email: string, password: string) => Promise<{ error: string | null; session: Session | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [usernameChecked, setUsernameChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setUsername(null);
      setUsernameChecked(false);
      return;
    }
    let cancelled = false;
    fetchMyProfile()
      .then((profile) => {
        if (cancelled) return;
        setUsername(profile.username);
        setUsernameChecked(true);
      })
      .catch(() => {
        // Nätverksfel etc - lämna usernameChecked som false så vi inte
        // felaktigt visar "välj användarnamn"-spärren pga ett tillfälligt fel.
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  function setUsernameLocally(newUsername: string) {
    setUsername(newUsername);
    setUsernameChecked(true);
  }

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    // Om e-postbekräftelse är avstängd i Supabase-projektet finns en session
    // direkt - annars är session null tills länken i mejlet klickats.
    return { error: error?.message ?? null, session: data.session };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  }

  const user = session?.user ?? null;
  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAdmin,
        username,
        usernameChecked,
        setUsernameLocally,
        signUp,
        signIn,
        signOut,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth måste användas inom en AuthProvider");
  return ctx;
}

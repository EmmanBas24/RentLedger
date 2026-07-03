import { Stack, router } from "expo-router";
import { useEffect, useRef } from "react";
import { supabase } from "../src/lib/supabase";

export default function RootLayout() {
  const isPasswordRecovery = useRef(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        isPasswordRecovery.current = true;
        router.replace("/(auth)/reset-password");
      } else if (event === "SIGNED_IN" && isPasswordRecovery.current) {
        // Block the automatic redirect — user is resetting their password
        isPasswordRecovery.current = false;
        router.replace("/(auth)/reset-password");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
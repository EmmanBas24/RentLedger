import * as Linking from "expo-linking";
import { Stack, router } from "expo-router";
import { useEffect, useRef } from "react";
import { supabase } from "../src/lib/supabase";

export default function RootLayout() {
  const isPasswordRecovery = useRef(false);

  useEffect(() => {
    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        isPasswordRecovery.current = true;
        router.replace("/(auth)/reset-password");
      } else if (event === "SIGNED_IN" && isPasswordRecovery.current) {
        isPasswordRecovery.current = false;
        router.replace("/(auth)/reset-password");
      }
    });

    // Handle deep links manually to extract tokens
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (url.includes("reset-password")) {
        const params = new URLSearchParams(url.split("#")[1] || "");
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          isPasswordRecovery.current = true;
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          router.replace("/(auth)/reset-password");
        }
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    const linkSub = Linking.addEventListener("url", handleDeepLink);

    return () => {
      subscription.unsubscribe();
      linkSub.remove();
    };
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
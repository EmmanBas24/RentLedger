import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { supabase } from "../src/lib/supabase";

export default function Index() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isReady) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // User is logged in — go to home
          // (if it's a password recovery, _layout.tsx handles the redirect)
          router.replace("/(tabs)/assets");
        } else {
          router.replace("/(auth)/login");
        }
      });
    }
  }, [isReady]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#76ABAE" />
        <Text style={styles.loadingText}>Loading RentLedger...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#303841",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#F5F5F5",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
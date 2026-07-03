import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simulate a 2.5 second loading delay
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isReady) {
      // Once loading is complete, route to the login page
      router.replace("/(auth)/login");
    }
  }, [isReady]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Geometric Accent Loading Spinner */}
        <ActivityIndicator size="large" color="#76ABAE" />
        <Text style={styles.loadingText}>Loading RentLedger...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#303841", // Matches your core primary brand color
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
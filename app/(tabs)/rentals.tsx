import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function Rentals() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Rentals</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Upcoming Lease Ends</Text>
        <Text style={styles.cardValue}>2 within 30 days</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Available Units</Text>
        <Text style={styles.cardValue}>1</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F9FAFB", flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "700", color: "#0f172a", marginBottom: 12 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12 },
  cardTitle: { color: "#374151", fontWeight: "600", marginBottom: 6 },
  cardValue: { fontSize: 18, fontWeight: "800", color: "#059669" },
});
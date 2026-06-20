import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function Reports() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Reports & Analytics</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Monthly Revenue</Text>
        <Text style={styles.cardValue}>$12,450</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Occupancy Rate</Text>
        <Text style={styles.cardValue}>92%</Text>
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
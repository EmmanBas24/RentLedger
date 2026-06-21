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
  container: { backgroundColor: "#F2F4F7", flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "700", color: "#273338", marginBottom: 12 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: "#D1D9D2" },
  cardTitle: { color: "#2B5748", fontWeight: "600", marginBottom: 6 },
  cardValue: { fontSize: 18, fontWeight: "800", color: "#618764" },
});
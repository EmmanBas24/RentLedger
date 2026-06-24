import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";

interface Tenant {
  id: string;
  full_name: string;
  contact_number: string;
  email: string;
  status: string;
}

type StatusFilter = "All" | "Active" | "Inactive";

export default function Tenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchTenants();
    }, [])
  );

  const fetchTenants = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setTenants([]);
        return;
      }

      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.log(error);
        return;
      }

      setTenants(data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTenants();
  };

  // Client-side filtering logic
  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.contact_number?.includes(searchQuery) ||
      tenant.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || tenant.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate high-level summary metrics
  const activeCount = tenants.filter((t) => t.status === "Active").length;
  const inactiveCount = tenants.filter((t) => t.status === "Inactive").length;

  const renderTenant = ({ item }: { item: Tenant }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() =>
        router.push({
          pathname: "/tenants/[id]",
          params: { id: item.id },
        })
      }
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.nameContainer}>
            <View style={styles.avatarMini}>
              <Text style={styles.avatarMiniText}>
                {item.full_name?.charAt(0)?.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {item.full_name}
            </Text>
          </View>
          
          <View
            style={[
              styles.badge,
              item.status === "Active" ? styles.badgeActive : styles.badgeInactive,
            ]}
          >
            <View style={[styles.dot, item.status === "Active" ? styles.dotActive : styles.dotInactive]} />
            <Text
              style={[
                styles.badgeText,
                item.status === "Active" ? styles.textActive : styles.textInactive,
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.phone}>
            <MaterialCommunityIcons name="phone-outline" size={12} color="#475569" /> {item.contact_number || "No Contact"}
          </Text>
          
          {item.status === "Active" && (
            <View style={styles.rentedUnitContainer}>
              <MaterialCommunityIcons name="home-circle" size={13} color="#76ABAE" />
              <Text style={styles.rentedUnitText}>Rented unit</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBottomRow}>
          <Text style={styles.emailText} numberOfLines={1}>
            {item.email || "No email address registered"}
          </Text>
          <View style={styles.arrowCircle}>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#76ABAE" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#76ABAE" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        {/* Premium Dashboard Hero Header Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Tenant Base Overview</Text>
          
          <View style={styles.heroMainGrid}>
            <View style={styles.heroPrimaryMetric}>
              <Text style={styles.heroMetricNumber}>{tenants.length}</Text>
              <Text style={styles.heroMetricLabel}>Total Tenants</Text>
            </View>
            
            <View style={styles.heroDivider} />

            <View style={styles.heroSecondaryMetrics}>
              <View style={styles.subMetricRow}>
                <View style={[styles.indicatorDot, { backgroundColor: "#4ECE7B" }]} />
                <Text style={styles.subMetricLabel}>Active Tenancies:</Text>
                <Text style={[styles.subMetricValue, { color: "#4ECE7B" }]}>{activeCount}</Text>
              </View>
              
              <View style={styles.subMetricRow}>
                <View style={[styles.indicatorDot, { backgroundColor: "#F43F5E" }]} />
                <Text style={styles.subMetricLabel}>Inactive Records:</Text>
                <Text style={[styles.subMetricValue, { color: "#F43F5E" }]}>{inactiveCount}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Modern Compact Search Field */}
        <View style={[styles.searchContainer, isSearchFocused && styles.searchContainerFocused]}>
          <MaterialCommunityIcons name="magnify" size={20} color={isSearchFocused ? "#76ABAE" : "#64748B"} />
          <TextInput
            style={styles.searchInput}
            placeholder="Filter tenants by name or info..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Modern Segmented Filter Row */}
        <View style={styles.filterRow}>
          {(["All", "Active", "Inactive"] as StatusFilter[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterButton,
                statusFilter === tab && styles.filterButtonActive,
              ]}
              onPress={() => setStatusFilter(tab)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  statusFilter === tab && styles.filterButtonTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List Content */}
        {filteredTenants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={44}
                color="#76ABAE"
              />
            </View>
            <Text style={styles.emptyTitle}>No Matching Tenants</Text>
            <Text style={styles.emptySubtitle}>
              Adjust your selection filters or tap below to register a new tenant.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredTenants}
            keyExtractor={(item) => item.id}
            renderItem={renderTenant}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#76ABAE"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Flat Bottom Action Strip */}
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.9}
          onPress={() => router.push("/tenants/add")}
        >
          <MaterialCommunityIcons name="plus-circle" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Tenant</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", 
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  /* --- Premium Hero Card Block --- */
  heroCard: {
    backgroundColor: "#1E252B",
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
    shadowColor: "#1E252B",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTitle: {
    color: "#76ABAE",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  heroMainGrid: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroPrimaryMetric: {
    flex: 1,
    justifyContent: "center",
  },
  heroMetricNumber: {
    color: "#FFFFFF",
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -1.5,
  },
  heroMetricLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  heroDivider: {
    width: 1,
    height: 54,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    marginHorizontal: 16,
  },
  heroSecondaryMetrics: {
    flex: 1.3,
    gap: 8,
  },
  subMetricRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  indicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 8,
  },
  subMetricLabel: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  subMetricValue: {
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
  },
  /* --- Clean Compact Search Box --- */
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingHorizontal: 14,
    borderRadius: 16,
    height: 48,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  searchContainerFocused: {
    borderColor: "#76ABAE",
    shadowColor: "#76ABAE",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "500",
  },
  /* --- Modern Filter Buttons Row --- */
  filterRow: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    padding: 4,
    borderRadius: 14,
    marginBottom: 16,
    gap: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  filterButtonTextActive: {
    color: "#0F172A",
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: 95,
  },
  /* --- Modified Slim & Elegant Cards --- */
  card: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,      // Reduced from 16
    paddingHorizontal: 14,    // Reduced from 16
    borderRadius: 16,         // Reduced from 20 for sharper compact fit
    marginBottom: 10,         // Reduced from 12
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,                  // Reduced from 10
  },
  avatarMini: {
    width: 28,                // Reduced from 32
    height: 28,               // Reduced from 32
    borderRadius: 14,
    backgroundColor: "#F0F9FA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0F2F1",
  },
  avatarMiniText: {
    fontSize: 11,             // Reduced from 13
    fontWeight: "800",
    color: "#76ABAE",
  },
  name: {
    fontSize: 14,             // Reduced from 16
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,             // Reduced from 10
  },
  phone: {
    fontSize: 12,             // Reduced from 13
    color: "#475569",
    fontWeight: "500",
  },
  rentedUnitContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rentedUnitText: {
    fontSize: 11,             // Reduced from 12
    fontWeight: "700",
    color: "#76ABAE",
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,             // Reduced from 14
    paddingTop: 8,            // Reduced from 12
    borderTopWidth: 1,
    borderColor: "#F8FAFC",
  },
  emailText: {
    fontSize: 11,             // Reduced from 12
    color: "#64748B",
    flex: 1,
    paddingRight: 8,
    fontWeight: "400",
  },
  /* --- Minimal Status Badges --- */
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,     // Reduced from 10
    paddingVertical: 3,       // Reduced from 5
    borderRadius: 12,
  },
  badgeActive: {
    backgroundColor: "#ECFDF5",
  },
  badgeInactive: {
    backgroundColor: "#FFF1F2",
  },
  dot: {
    width: 5,                 // Reduced from 6
    height: 5,                // Reduced from 6
    borderRadius: 2.5,
    marginRight: 4,
  },
  dotActive: { backgroundColor: "#10B981" },
  dotInactive: { backgroundColor: "#F43F5E" },
  badgeText: {
    fontSize: 10,             // Reduced from 11
    fontWeight: "700",
  },
  textActive: {
    color: "#065F46",
  },
  textInactive: {
    color: "#991B1B",
  },
  arrowCircle: {
    width: 22,                // Reduced from 26
    height: 22,               // Reduced from 26
    borderRadius: 11,
    backgroundColor: "#F0F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  /* --- Button Layout Strip --- */
  addButton: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
    backgroundColor: "#1E252B",
    paddingVertical: 15,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#1E252B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  emptySubtitle: {
    color: "#64748B",
    marginTop: 6,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
  },
});
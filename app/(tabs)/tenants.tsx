import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../src/lib/supabase";

interface Tenant {
  id: string;
  full_name: string;
  contact_number: string;
  email: string;
  status: string;
}
export default function Tenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const renderTenant = ({
    item,
  }: {
    item: Tenant;
  }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/tenants/[id]",
          params: {
            id: item.id,
          },
        })
      }
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.full_name
            ?.charAt(0)
            ?.toUpperCase()}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{item.full_name}</Text>

        <Text style={styles.phone}>{item.contact_number}</Text>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === "Active" ? "#10B981" : "#EF4444",
            },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color="#94a3b8"
        />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#000000"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          router.push("/tenants/add")
        }
      >
        <MaterialCommunityIcons
          name="plus"
          size={20}
          color="#fff"
        />

        <Text style={styles.addButtonText}>
          Add Tenant
        </Text>
      </TouchableOpacity>

      {tenants.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={80}
            color="#cbd5e1"
          />

          <Text style={styles.emptyTitle}>
            No Tenants Yet
          </Text>

          <Text style={styles.emptySubtitle}>
            Add your first tenant.
          </Text>
        </View>
      ) : (
        <FlatList
          data={tenants}
          keyExtractor={(item) => item.id}
          renderItem={renderTenant}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F4F7",
    padding: 16,
    paddingBottom: 110,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  addButton: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: "#2B5748",
    padding: 15,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },

  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 6,
    fontSize: 16,
  },

  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#D1D9D2",
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#9CB080",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F2F4F7",
  },

  content: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#273338",
  },

  phone: {
    marginTop: 4,
    color: "#618764",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 15,
    color: "#273338",
  },

  emptySubtitle: {
    marginTop: 8,
    color: "#618764",
  },


  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});


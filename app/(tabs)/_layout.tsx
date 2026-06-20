import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,

        // Clean White Top Header
        headerStyle: {
          backgroundColor: "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
          shadowColor: "transparent",
        },

        headerTitleStyle: {
          fontSize: 20,
          fontWeight: "800",
          color: "#000000",
          letterSpacing: -0.5,
        },

        headerShadowVisible: false,
        tabBarShowLabel: false,

        // Neutral bottom navbar for B/W theme
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: "#6B7280",

        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 14,
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          backgroundColor: "#FFFFFF",
          elevation: 0,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="assets"
        options={{
          title: "Assets",
          headerTitle: "Property Assets",
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "home-city" : "home-city-outline"}
              size={size - 1}
              color={focused ? "#000000" : color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="tenants"
        options={{
          title: "Tenants",
          headerTitle: "Tenant Management",
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "account-group" : "account-group-outline"}
              size={size - 1}
              color={focused ? "#000000" : color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="rentals"
        options={{
          title: "Rentals",
          headerTitle: "Rental Management",
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "key" : "key-outline"}
              size={size - 1}
              color={focused ? "#000000" : color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          headerTitle: "Reports & Analytics",
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "chart-box" : "chart-box-outline"}
              size={size - 1}
              color={focused ? "#000000" : color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerTitle: "Profile Settings",
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "account-circle" : "account-circle-outline"}
              size={size - 1}
              color={focused ? "#000000" : color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
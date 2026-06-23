import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,

        headerStyle: {
          backgroundColor: "#273338",
          borderBottomWidth: 1,
          borderBottomColor: "#2B5748",
          shadowColor: "transparent",
        },

        headerTitleStyle: {
          fontSize: 20,
          fontWeight: "800",
          color: "#F2F4F7",
          letterSpacing: -0.5,
        },

        headerShadowVisible: false,
        tabBarShowLabel: false,

        tabBarActiveTintColor: "#2B5748",
        tabBarInactiveTintColor: "#618764",

        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 14,
          borderTopWidth: 1,
          borderTopColor: "#D1D9D2",
          backgroundColor: "#F2F4F7",
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
        name="payments"
        options={{
          title: "Payments",
          headerTitle: "Payments Module",
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "cash-multiple" : "cash-multiple"}
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
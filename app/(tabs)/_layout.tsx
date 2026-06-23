import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "../../src/lib/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,

        headerStyle: {
          backgroundColor: colors.header,
          borderBottomWidth: 1,
          borderBottomColor: colors.primary,
          shadowColor: "transparent",
        },

        headerTitleStyle: {
          fontSize: 20,
          fontWeight: "800",
          color: colors.headerText,
          letterSpacing: -0.5,
        },

        headerShadowVisible: false,
        tabBarShowLabel: false,

        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,

        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 14,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
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
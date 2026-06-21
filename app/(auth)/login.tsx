import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../src/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert("Login Failed", error.message);
        return;
      }

      router.replace("/(tabs)/assets");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {/* Custom Styled Architectural Logo */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoPanel, styles.panelLeft]} />
            <View style={[styles.logoPanel, styles.panelTop]} />
            <View style={[styles.logoPanel, styles.panelRight]} />
          </View>
          <Text style={styles.logoText}>RentLedger</Text>
          <Text style={styles.subtitle}>Welcome back to your rental dashboard</Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => setIsEmailFocused(true)}
              onBlur={() => setIsEmailFocused(false)}
              style={[styles.input, isEmailFocused && styles.inputFocused]}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                style={[styles.input, isPasswordFocused && styles.inputFocused, styles.inputWithIcon]}
              />
              <TouchableOpacity style={styles.inputIcon} onPress={() => setShowPassword(s => !s)}>
                <MaterialCommunityIcons name={showPassword ? "eye" : "eye-off"} size={20} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.footerText}>Don't have an account yet?</Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.linkText}>Create one</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#273338",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingVertical: 60,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  /* --- Logo Styling with the new green palette --- */
  logoContainer: {
    width: 80,
    height: 80,
    marginBottom: 20,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  logoPanel: {
    position: "absolute",
    borderRadius: 4,
    transform: [{ skewY: "-15deg" }],
  },
  panelLeft: {
    width: 45,
    height: 35,
    backgroundColor: "#9CB080",
    left: 2,
    bottom: 25,
    zIndex: 1,
  },
  panelTop: {
    width: 40,
    height: 40,
    backgroundColor: "#618764",
    top: 5,
    right: 12,
    zIndex: 2,
  },
  panelRight: {
    width: 45,
    height: 40,
    backgroundColor: "#2B5748",
    right: 2,
    bottom: 8,
    zIndex: 3,
  },
  /* -------------------------------------------------- */
  logoText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F2F4F7",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#9CB080",
    marginTop: 6,
    fontWeight: "400",
  },
  formSection: {
    marginBottom: 24,
    backgroundColor: "#F2F4F7",
    borderRadius: 22,
    padding: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#273338",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D9D2",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#273338",
    backgroundColor: "#FFFFFF",
  },
  inputFocused: {
    borderColor: "#2B5748",
    backgroundColor: "#FFFFFF",
  },
  button: {
    backgroundColor: "#2B5748",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#F2F4F7",
    fontWeight: "700",
    fontSize: 16,
  },
  footerSection: {
    alignItems: "center",
    marginTop: 12,
  },
  footerText: {
    fontSize: 14,
    color: "#F2F4F7",
  },
  linkText: {
    fontSize: 14,
    color: "#618764",
    fontWeight: "700",
    marginTop: 4,
  },
  inputWrapper: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 6,
  },
  inputWithIcon: {
    paddingRight: 44,
  },
});
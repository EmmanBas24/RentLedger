import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
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

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);

     const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
    },
  },
});

      if (error) {
        Alert.alert("Registration Failed", error.message);
        return;
      }

      if (!data.user) {
        Alert.alert("Error", "User was created but no user data was returned.");
        return;
      }

      // Profile registration details insertion
      const { error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            id: data.user.id,
            full_name: fullName,
            email: email,
            phone: "",
            address: "",
          },
        ]);

      if (profileError) {
        Alert.alert("Profile Creation Failed", profileError.message);
        return;
      }

      // Updated workflow message telling user to click validation link
     Alert.alert(
  "Verify Your Email",
  "Your account has been created successfully.\n\nA verification email has been sent to your email address.\n\nPlease open your inbox, click the verification link, then return to RentLedger and sign in.",
  [
    {
      text: "OK",
      onPress: () => router.replace("/(auth)/login"),
    },
  ]
);
    } catch (err) {
      console.log("REGISTER ERROR:", err);
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
      <ImageBackground
        source={{ uri: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80" }}
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View style={styles.overlay} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={[styles.logoPanel, styles.panelLeft]} />
              <View style={[styles.logoPanel, styles.panelTop]} />
              <View style={[styles.logoPanel, styles.panelRight]} />
            </View>
            <Text style={styles.logoText}>RentLedger</Text>
            <Text style={styles.subtitle}>Create your account to get started</Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                placeholder="John Doe"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => setIsNameFocused(true)}
                onBlur={() => setIsNameFocused(false)}
                style={[styles.input, isNameFocused && styles.inputFocused]}
              />
            </View>

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
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footerSection}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.linkText}>Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  scrollContent: { flexGrow: 1, paddingHorizontal: 28, paddingVertical: 60, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 36 },
  logoContainer: { width: 80, height: 80, marginBottom: 20, position: "relative", justifyContent: "center", alignItems: "center" },
  logoPanel: { position: "absolute", borderRadius: 4, transform: [{ skewY: "-15deg" }] },
  panelLeft: { width: 45, height: 35, backgroundColor: "#76ABAE", left: 2, bottom: 25, zIndex: 1 },
  panelTop: { width: 40, height: 40, backgroundColor: "#303841", top: 5, right: 12, zIndex: 2 },
  panelRight: { width: 45, height: 40, backgroundColor: "#FF5722", right: 2, bottom: 8, zIndex: 3 },
  logoText: { fontSize: 28, fontWeight: "800", color: "#303841", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: "#76ABAE", marginTop: 6, fontWeight: "400" },
  formSection: { marginBottom: 24, backgroundColor: "#FFFFFF", borderRadius: 22, padding: 24, shadowColor: "#000000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 },
  inputContainer: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: "600", color: "#303841", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#76ABAE", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#303841", backgroundColor: "#FFFFFF" },
  inputFocused: { borderColor: "#303841", backgroundColor: "#FFFFFF" },
  button: { backgroundColor: "#303841", paddingVertical: 15, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 10, shadowColor: "#000000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#F5F5F5", fontWeight: "700", fontSize: 16 },
  footerSection: { alignItems: "center", marginTop: 12 },
  footerText: { fontSize: 14, color: "#303841" },
  linkText: { fontSize: 14, color: "#FF5722", fontWeight: "700", marginTop: 4 },
  inputWrapper: { position: "relative" },
  inputIcon: { position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center", padding: 6 },
  inputWithIcon: { paddingRight: 44 },
  background: { flex: 1 },
  backgroundImage: { opacity: 0.24 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(245, 245, 245, 0.75)" },
});
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
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

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Error", "Please fill in both fields.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // This works because Supabase automatically sets the session
      // when the user arrives via the password reset deep link.
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        Alert.alert("Reset Failed", error.message);
        return;
      }

      Alert.alert(
        "Password Updated",
        "Your password has been changed successfully. Please sign in with your new password.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(auth)/login"),
          },
        ]
      );
    } catch (err) {
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
        source={{
          uri: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
        }}
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
            <Text style={styles.subtitle}>Set your new password below</Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  style={[
                    styles.input,
                    isPasswordFocused && styles.inputFocused,
                    styles.inputWithIcon,
                  ]}
                />
                <TouchableOpacity
                  style={styles.inputIcon}
                  onPress={() => setShowPassword((s) => !s)}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#374151"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  onFocus={() => setIsConfirmFocused(true)}
                  onBlur={() => setIsConfirmFocused(false)}
                  style={[
                    styles.input,
                    isConfirmFocused && styles.inputFocused,
                    styles.inputWithIcon,
                  ]}
                />
                <TouchableOpacity
                  style={styles.inputIcon}
                  onPress={() => setShowConfirm((s) => !s)}
                >
                  <MaterialCommunityIcons
                    name={showConfirm ? "eye" : "eye-off"}
                    size={20}
                    color="#374151"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footerSection}>
            <Text style={styles.footerText}>Remember your password?</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.replace("/(auth)/login")}
            >
              <Text style={styles.linkText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingVertical: 60,
    justifyContent: "center",
  },
  header: { alignItems: "center", marginBottom: 36 },
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
    backgroundColor: "#76ABAE",
    left: 2,
    bottom: 25,
    zIndex: 1,
  },
  panelTop: {
    width: 40,
    height: 40,
    backgroundColor: "#303841",
    top: 5,
    right: 12,
    zIndex: 2,
  },
  panelRight: {
    width: 45,
    height: 40,
    backgroundColor: "#FF5722",
    right: 2,
    bottom: 8,
    zIndex: 3,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#303841",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#76ABAE",
    marginTop: 6,
    fontWeight: "400",
    textAlign: "center",
  },
  formSection: {
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  inputContainer: { marginBottom: 18 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#303841",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#76ABAE",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#303841",
    backgroundColor: "#FFFFFF",
  },
  inputFocused: { borderColor: "#303841", backgroundColor: "#FFFFFF" },
  button: {
    backgroundColor: "#303841",
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
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#F5F5F5", fontWeight: "700", fontSize: 16 },
  footerSection: { alignItems: "center", marginTop: 12 },
  footerText: { fontSize: 14, color: "#303841" },
  linkText: {
    fontSize: 14,
    color: "#FF5722",
    fontWeight: "700",
    marginTop: 4,
  },
  inputWrapper: { position: "relative" },
  inputIcon: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 6,
  },
  inputWithIcon: { paddingRight: 44 },
  background: { flex: 1 },
  backgroundImage: { opacity: 0.24 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(245, 245, 245, 0.75)",
  },
});
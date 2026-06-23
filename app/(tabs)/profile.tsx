import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../src/lib/supabase";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isAddressFocused, setIsAddressFocused] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.log(error);
      }
      if (data) {
        setFullName(data.full_name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          full_name: fullName,
          email,
          phone,
          address,
        })
        .eq("id", userId);

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }
      Alert.alert("Success", "Profile updated successfully.");
      setEditing(false);
    } catch (error) {
      console.log(error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#76ABAE" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header Block */}
      <View style={styles.profileHeaderSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {fullName?.charAt(0)?.toUpperCase() || "U"}
          </Text>
        </View>
        <Text style={styles.name}>{fullName || "User"}</Text>
        <Text style={styles.roleSubtext}>RentLedger Premium Account</Text>
        
        <TouchableOpacity
          style={[styles.editButton, editing && styles.editButtonActive]}
          onPress={() => setEditing(!editing)}
          activeOpacity={0.7}
        >
          <Text style={[styles.editButtonText, editing && styles.editButtonTextActive]}>
            {editing ? "Cancel Changes" : "Modify Profile"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile Fields List Container */}
      <View style={styles.formSection}>
        <Text style={styles.sectionHeader}>Personal Information</Text>
        
        <View style={styles.infoCard}>
          
          {/* Row 1: Full Name */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.valueContainer}>
              {editing ? (
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setIsNameFocused(true)}
                  onBlur={() => setIsNameFocused(false)}
                  style={[styles.input, isNameFocused && styles.inputFocused]}
                  placeholder="John Doe"
                  placeholderTextColor="#94A3B8"
                />
              ) : (
                <Text style={styles.value}>{fullName || "—"}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.separator} />

          {/* Row 2: Email Address */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.valueContainer}>
              {editing ? (
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                  style={[styles.input, isEmailFocused && styles.inputFocused]}
                  placeholder="email@example.com"
                  placeholderTextColor="#94A3B8"
                />
              ) : (
                <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{email || "—"}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.separator} />

          {/* Row 3: Phone Number */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Phone</Text>
            <View style={styles.valueContainer}>
              {editing ? (
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  onFocus={() => setIsPhoneFocused(true)}
                  onBlur={() => setIsPhoneFocused(false)}
                  style={[styles.input, isPhoneFocused && styles.inputFocused]}
                  placeholder="Not Specified"
                  placeholderTextColor="#94A3B8"
                />
              ) : (
                <Text style={[styles.value, !phone && styles.valueEmpty]}>
                  {phone || "Not Specified"}
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.separator} />

          {/* Row 4: Physical Address */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Address</Text>
            <View style={styles.valueContainer}>
              {editing ? (
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  onFocus={() => setIsAddressFocused(true)}
                  onBlur={() => setIsAddressFocused(false)}
                  style={[styles.input, isAddressFocused && styles.inputFocused]}
                  placeholder="Not Specified"
                  placeholderTextColor="#94A3B8"
                />
              ) : (
                <Text style={[styles.value, !address && styles.valueEmpty]}>
                  {address || "Not Specified"}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Action Button Blocks */}
        {editing && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleUpdateProfile}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Apply Changes</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Sign Out Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  profileHeaderSection: {
    alignItems: "center",
    paddingTop: 36,
    paddingBottom: 28,
    backgroundColor: "#303841",
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#76ABAE",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#F5F5F5",
    fontSize: 32,
    fontWeight: "800",
  },
  name: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 14,
    color: "#F5F5F5",
  },
  roleSubtext: {
    fontSize: 13,
    color: "#BCBCBC",
    marginTop: 4,
    fontWeight: "500",
  },
  editButton: {
    backgroundColor: "#76ABAE",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  editButtonActive: {
    backgroundColor: "#F5F5F5",
  },
  editButtonText: {
    color: "#F5F5F5",
    fontWeight: "700",
    fontSize: 13,
  },
  editButtonTextActive: {
    color: "#303841",
  },
  formSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingLeft: 4,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 16,
    shadowColor: "#303841",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    minHeight: 56, // Stabilizes card height during view/edit transitions
  },
  label: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "500",
    flex: 0.3, // Allocates a clean, consistent width for headers on the left
  },
  valueContainer: {
    flex: 0.7,
    alignItems: "flex-end", // Aligns content perfectly to the right border edge
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    color: "#303841",
    textAlign: "right",
  },
  valueEmpty: {
    color: "#76ABAE",
    fontWeight: "500",
  },
  separator: {
    height: 1,
    backgroundColor: "#F5F5F5",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    color: "#303841",
    backgroundColor: "#FFFFFF",
    textAlign: "right",
  },
  inputFocused: {
    borderColor: "#76ABAE",
  },
  saveButton: {
    backgroundColor: "#FF5722",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: "#FF5722",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    color: "#F5F5F5",
    fontWeight: "700",
    fontSize: 16,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: "#FF5722",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 40,
  },
  logoutText: {
    color: "#FF5722",
    fontWeight: "700",
    fontSize: 16,
  },
});
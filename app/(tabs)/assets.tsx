import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";
import { supabase } from "../../src/lib/supabase";

interface Asset{ id:string; property_name:string; property_type:string; address:string; description:string; rooms?: { id:string; status:string }[] }

export default function Assets(){ const [assets,setAssets]=useState<Asset[]>([]); const [loading,setLoading]=useState(true); const [refreshing,setRefreshing]=useState(false); const [searchQuery,setSearchQuery]=useState(""); const [showAddModal,setShowAddModal]=useState(false); const [propertyName,setPropertyName]=useState(""); const [propertyType,setPropertyType]=useState(""); const [address,setAddress]=useState(""); const [description,setDescription]=useState(""); const [savingProperty,setSavingProperty]=useState(false); const [availableCounts,setAvailableCounts]=useState<Record<string, number>>({});

  useFocusEffect(useCallback(()=>{ fetchAssets(); },[]));

  const fetchRoomCounts=async(assets: Asset[])=>{ const ids = assets.map(asset => asset.id); if(ids.length === 0){ setAvailableCounts({}); return; } const { data: roomData, error: roomError } = await supabase.from("rooms").select("asset_id,status").in("asset_id", ids); if(roomError){ console.log(roomError); setAvailableCounts({}); return; } const counts = (roomData || []).reduce((acc: Record<string, number>, room: any) => { if(room.status === "Available"){ acc[room.asset_id] = (acc[room.asset_id] || 0) + 1; } return acc; }, {}); setAvailableCounts(counts); };

  const fetchAssets=async()=>{ try{ const { data: { user } } = await supabase.auth.getUser(); if (!user) { setAssets([]); setAvailableCounts({}); return; }
      const {data,error}=await supabase.from("assets").select("*").eq("user_id", user.id).order("created_at",{ ascending:false }); if(error){ console.log(error); return } const assetsData = data || []; setAssets(assetsData); await fetchRoomCounts(assetsData); }catch(err){ console.log(err) }finally{ setLoading(false); setRefreshing(false) } };

  const handleRefresh=()=>{ setRefreshing(true); fetchAssets() };

  const handleSaveProperty=async()=>{ if(!propertyName||!propertyType||!address){ Alert.alert("Missing Information","Please complete all required fields."); return } try{ setSavingProperty(true); const { data: { user } } = await supabase.auth.getUser(); if (!user) { Alert.alert("Error", "User session not found."); setSavingProperty(false); return; }
      const { error } = await supabase.from("assets").insert([{ user_id: user.id, property_name:propertyName, property_type:propertyType, address, description }]); if(error){ Alert.alert("Error", error.message); return } setPropertyName(""); setPropertyType(""); setAddress(""); setDescription(""); setShowAddModal(false); fetchAssets(); }catch(err){ console.log(err); Alert.alert("Error","Something went wrong.") }finally{ setSavingProperty(false) } };

  const filteredAssets=assets.filter(asset=>{ const q=searchQuery.trim().toLowerCase(); if(!q) return true; return [asset.property_name,asset.property_type,asset.address,asset.description].join(" ").toLowerCase().includes(q) });

  const renderProperty=({item}:{item:Asset})=> {
    const availableRooms = availableCounts[item.id] || 0;
    const availableText = availableRooms > 0 ? `${availableRooms} available room${availableRooms > 1 ? "s" : ""}` : "No available rooms";

    return (
      <TouchableOpacity style={styles.card} onPress={()=>router.push({ pathname:"/assets/[id]", params:{ id:item.id } })}>
        <View style={styles.iconContainer}><MaterialCommunityIcons name="home-city-outline" size={28} color="#000000"/></View>
        <View style={styles.cardContent}>
          <Text style={styles.propertyName}>{item.property_name}</Text>
          <Text style={styles.propertyType}>{item.property_type}</Text>
          <Text style={styles.address}>{item.address}</Text>
          <Text style={[styles.availableRoomsText, availableRooms > 0 ? styles.availableText : styles.unavailableText]}>{availableText}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#374151"/>
      </TouchableOpacity>
    );
  };

  if(loading) return (<View style={styles.center}><ActivityIndicator size="large" color="#000000"/></View>);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}><TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Search properties..." placeholderTextColor="#9CA3AF" style={styles.searchInput} returnKeyType="search"/></View>
      {assets.length===0 ? (
        <View style={styles.emptyContainer}><MaterialCommunityIcons name="home-city-outline" size={80} color="#9CA3AF"/><Text style={styles.emptyTitle}>No Properties Yet</Text><Text style={styles.emptySubtitle}>Add your first property to start managing rentals.</Text></View>
      ) : filteredAssets.length===0 ? (
        <View style={styles.emptyContainer}><Text style={styles.emptyTitle}>No matching properties</Text><Text style={styles.emptySubtitle}>Try a different search term.</Text></View>
      ) : (
        <FlatList data={filteredAssets} keyExtractor={item=>item.id} renderItem={renderProperty} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh}/>} showsVerticalScrollIndicator={false}/>
      )}

      <TouchableOpacity style={styles.addButton} onPress={()=>setShowAddModal(true)}>
        <MaterialCommunityIcons name="plus" size={20} color="#fff"/>
        <Text style={styles.addButtonText}>Add Property</Text>
      </TouchableOpacity>

      <Modal animationType="slide" transparent visible={showAddModal} onRequestClose={()=>setShowAddModal(false)}>
        <View style={styles.overlay}><View style={styles.modalContainer}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Add Property</Text><TouchableOpacity style={styles.closeButton} onPress={()=>setShowAddModal(false)}><MaterialCommunityIcons name="close" size={20} color="#fff"/></TouchableOpacity></View>
          <View style={styles.labelRow}><Text style={styles.label}>Property Name *</Text></View>
          <TextInput style={styles.modalInput} placeholder="Sunrise Apartment" placeholderTextColor="#6b7280" value={propertyName} onChangeText={setPropertyName}/>

          <View style={styles.labelRow}><Text style={styles.label}>Property Type *</Text></View>
          <TextInput style={styles.modalInput} placeholder="Apartment" placeholderTextColor="#6b7280" value={propertyType} onChangeText={setPropertyType}/>

          <View style={styles.labelRow}><Text style={styles.label}>Address *</Text></View>
          <TextInput style={styles.modalInput} placeholder="Cebu City" placeholderTextColor="#6b7280" value={address} onChangeText={setAddress}/>

          <View style={styles.labelRow}><Text style={styles.label}>Description</Text></View>
          <TextInput style={[styles.modalInput,styles.modalDescription]} multiline textAlignVertical="top" placeholder="Property description..." placeholderTextColor="#6b7280" value={description} onChangeText={setDescription}/>
          <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveProperty} disabled={savingProperty}>{savingProperty ? <ActivityIndicator color="#fff"/> : <Text style={styles.modalSaveText}>Save Property</Text>}</TouchableOpacity>
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 16,
    paddingBottom: 110,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },

  addButton: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: "#76ABAE",
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
    borderWidth: 2,
    borderColor: "#E0E0E0",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#76ABAE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  cardContent: {
    flex: 1,
  },

  propertyName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#303841",
  },

  propertyType: {
    color: "#76ABAE",
    fontWeight: "600",
    marginTop: 2,
  },

  address: {
    color: "#303841",
    opacity: 0.75,
    marginTop: 4,
  },

  availableRoomsText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
  },

  availableText: {
    color: "#76ABAE",
  },

  unavailableText: {
    color: "#303841",
    opacity: 0.6,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 15,
    color: "#303841",
  },

  emptySubtitle: {
    color: "#303841",
    opacity: 0.7,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 30,
  },

  searchContainer: {
    marginBottom: 16,
  },

  searchInput: {
    backgroundColor: "#ffffff",
    borderColor: "#E0E0E0",
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#303841",
    fontSize: 16,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  label: {
    marginBottom: 8,
    fontWeight: "600",
    color: "#303841",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },

  modalContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 20,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#303841",
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#303841",
    justifyContent: "center",
    alignItems: "center",
  },

  modalInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#76ABAE",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    color: "#303841",
  },

  modalDescription: {
    minHeight: 100,
  },

  modalSaveButton: {
    backgroundColor: "#76ABAE",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  modalSaveText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
});

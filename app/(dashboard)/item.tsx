import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

import { 
  saveItem, 
  getAllItems, 
  updateItem, 
  deleteItem,
  searchItems,
} from "@/service/itemService";
import { Validator } from "@/util/Validations";

const Item = () => {
  const [items, setItems] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemPrice, setItemPrice] = useState(0);
  const [itemQuantity, setItemQuantity] = useState(0);

  const [userId, setUserId] = useState("");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  /* ---------------- LOAD USER + ITEMS ---------------- */
  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem("userDetails");

      if (!stored) {
        router.replace("/login");
        return;
      }

      const user = JSON.parse(stored);
      setUserId(user.uid);

      const list = await getAllItems(user.uid);
      setItems(list);
    };

    load();
    
    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  /* ---------------- DEBOUNCED SEARCH ---------------- */
  const handleSearch = async (text: string) => {
    setSearchText(text);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!text.trim()) {
      // If search is empty, load all items
      const list = await getAllItems(userId);
      setItems(list);
      setIsSearching(false);
      setIsLoading(false);
      return;
    }

    setIsSearching(true);
    setIsLoading(true);
    
    // Set a new timeout for debouncing (300ms delay)
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchItems(userId, text);
      setItems(results);
      setIsLoading(false);
    }, 300);
  };

  /* ---------------- REFRESH ITEMS ---------------- */
  const refreshItems = async () => {
    const list = await getAllItems(userId);
    setItems(list);
    setSearchText(""); // Clear search when refreshing
    setIsSearching(false);
  };

  /* ---------------- ADD ITEM ---------------- */
  const handleAddItem = async () => {
    if (!itemName) {
      Alert.alert("Error", "Item name is required");
      return;
    }

    if (itemPrice < 0) {
      Alert.alert("Error", "Price cannot be negative");
      return;
    }

    if (itemQuantity < 0) {
      Alert.alert("Error", "Quantity cannot be negative");
      return;
    }

    await saveItem(userId, itemName, itemDescription, itemPrice, itemQuantity);
    setAddModal(false);
    resetForm();
    await refreshItems(); // Refresh the list
  };

  /* ---------------- EDIT ITEM ---------------- */
  const handleEditItem = async () => {
    if (!selectedItem) return;

    if (!itemName) {
      Alert.alert("Error", "Item name is required");
      return;
    }

    if (itemPrice < 0) {
      Alert.alert("Error", "Price cannot be negative");
      return;
    }

    if (itemQuantity < 0) {
      Alert.alert("Error", "Quantity cannot be negative");
      return;
    }

    const updates = {
      name: itemName,
      description: itemDescription,
      price: itemPrice,
      quantity: itemQuantity,
    };

    const success = await updateItem(userId, selectedItem.id, updates);
    
    if (success) {
      setEditModal(false);
      resetForm();
      setSelectedItem(null);
      await refreshItems(); // Refresh the list
      setActiveItemId(null);
    }
  };

  /* ---------------- DELETE ITEM ---------------- */
  const handleDeleteItem = async (id: string) => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await deleteItem(userId, id);
            if (success) {
              // Update local state
              setItems(prev => prev.filter(c => c.id !== id));
              setActiveItemId(null);
            }
          },
        },
      ]
    );
  };

  /* ---------------- LOAD ITEM FOR EDITING ---------------- */
  const loadItemForEdit = async (item: any) => {
    setSelectedItem(item);
    setItemName(item.name || "");
    setItemDescription(item.description || "");
    setItemPrice(Number(item.price) || 0);
    setItemQuantity(Number(item.quantity) || 0);
    setEditModal(true);
    setActiveItemId(null);
  };

  const resetForm = () => {
    setItemName("");
    setItemDescription("");
    setItemPrice(0);
    setItemQuantity(0);
    setSelectedItem(null);
  };

  /* ================= UI ================= */
  return (
    <ScrollView className="flex-1 px-6 pt-10 bg-gray-100" showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <View className="mb-6 overflow-hidden bg-gray-700 border border-gray-200 shadow-md rounded-3xl">
        <View className="relative px-6 pt-6 pb-6">
          <View className="absolute top-5 right-5 bg-gray-100 rounded-full p-2.5">
            <Feather name="package" size={20} color="#4B5563" />
          </View>

          <Text className="mb-1 text-xs font-medium tracking-wider text-gray-300 uppercase">
            Inventory
          </Text>
          
          <Text className="mb-1 text-3xl font-bold text-white">
            Items
          </Text>

          <View className="flex-row items-center mt-2">
            <View className="px-2 py-1 bg-blue-700 rounded-full">
              <Text className="text-sm font-semibold text-white">
                {items.length}
              </Text>
            </View>
            <Text className="ml-2 text-sm text-gray-200">
              {items.length === 1 ? 'active item' : 'active items'}
            </Text>
          </View>
        </View>
      </View>

      {/* Add Button */}
      <TouchableOpacity
        onPress={() => setAddModal(true)}
        className="items-center p-4 mb-5 bg-gray-800 rounded-2xl active:opacity-90"
        activeOpacity={0.8}
      >
        <Text className="font-bold text-white">+ Add New Item</Text>
      </TouchableOpacity>

      {/* Search Bar */}
      <View className="flex-row items-center h-12 mb-4 overflow-hidden bg-white rounded-2xl">
        <TextInput
          value={searchText}
          onChangeText={handleSearch}
          placeholder="Search by name, description, price or quantity..."
          className="flex-1 h-full px-4"
          clearButtonMode="while-editing"
        />
        <View className="items-center justify-center h-full px-4 bg-gray-700">
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Feather name="search" size={18} color="white" />
          )}
        </View>
      </View>

      {/* Search Results Count */}
      {searchText.trim() && (
        <View className="mb-3">
          <Text className="text-sm text-gray-600">
            Found {items.length} item{items.length !== 1 ? 's' : ''} for "{searchText}"
          </Text>
        </View>
      )}

      {/* Item List */}
      <View className="mb-6">
        {/* Loading State */}
        {isLoading ? (
          <>
            <ItemCardSkeleton />
            <ItemCardSkeleton />
            <ItemCardSkeleton />
          </>
        ) : items.length > 0 ? (
          // Show items
          items.map(item => (
            <ItemCard
              key={item.id}
              {...item}
              isActive={activeItemId === item.id}
              onPress={() =>
                setActiveItemId(activeItemId === item.id ? null : item.id)
              }
              onEdit={() => loadItemForEdit(item)}
              onDelete={() => handleDeleteItem(item.id)}
            />
          ))
        ) : (
          // Only show empty state when there are truly no items
          <View className="items-center justify-center py-10">
            <Feather name="package" size={50} color="#9CA3AF" />
            <Text className="mt-4 text-lg font-semibold text-gray-500">
              {searchText.trim() ? 'No matching items' : 'No items yet'}
            </Text>
            <Text className="mt-2 text-gray-400">
              {searchText.trim() ? 'Try a different search term' : 'Add your first item to get started'}
            </Text>
          </View>
        )}
      </View>

      {/* Add Item Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={addModal}
        onRequestClose={() => setAddModal(false)}
      >
        <View className="justify-end flex-1 bg-black/50">
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10 max-h-[85%] shadow-2xl">
            
            {/* Header with title + close button */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-gray-900">
                Add New Item
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setAddModal(false);
                  resetForm();
                }}
                hitSlop={12}
              >
                <Feather name="x" size={26} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View className="space-y-5">

              {/* Name */}
              <View>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  Item Name *
                </Text>
                <TextInput
                  placeholder="Enter item name"
                  value={itemName}
                  onChangeText={setItemName}
                  autoCapitalize="words"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:border-gray-400"
                />
              </View>

              {/* Description */}
              <View>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  Description
                </Text>
                <TextInput
                  placeholder="Enter item description"
                  value={itemDescription}
                  onChangeText={setItemDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:border-gray-400 min-h-[80px]"
                />
              </View>

              {/* Price */}
              <View>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  Price (Rs)
                </Text>
                <TextInput
                  placeholder="0.00"
                  value={itemPrice ? String(itemPrice) : ""}
                  onChangeText={t => setItemPrice(Number(t) || 0)}
                  keyboardType="numeric"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:border-gray-400"
                />
              </View>

              {/* Quantity */}
              <View>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  Quantity
                </Text>
                <TextInput
                  placeholder="0"
                  value={itemQuantity ? String(itemQuantity) : ""}
                  onChangeText={t => setItemQuantity(Number(t) || 0)}
                  keyboardType="numeric"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:border-gray-400"
                />
              </View>

            </View>

            {/* Action Buttons */}
            <View className="flex-row mt-8 space-x-4">
              <TouchableOpacity
                onPress={() => {
                  setAddModal(false);
                  resetForm();
                }}
                className="items-center flex-1 py-4 bg-gray-200 rounded-xl"
                activeOpacity={0.8}
              >
                <Text className="text-base font-semibold text-gray-800">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddItem}
                className="items-center flex-1 py-4 bg-gray-800 shadow-sm rounded-xl shadow-gray-700/30"
                activeOpacity={0.9}
              >
                <Text className="text-base font-semibold text-white">
                  Save Item
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={editModal}
        onRequestClose={() => {
          setEditModal(false);
          resetForm();
        }}
      >
        <View className="justify-end flex-1 bg-black/50">
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10 max-h-[85%] shadow-2xl">
            {/* Header with title + close button */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-gray-900">
                Edit Item
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setEditModal(false);
                  resetForm();
                }}
                hitSlop={12}
              >
                <Feather name="x" size={26} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View className="space-y-5">
              {/* Name */}
              <View>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  Item Name *
                </Text>
                <TextInput
                  placeholder="Enter item name"
                  value={itemName}
                  onChangeText={setItemName}
                  autoCapitalize="words"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:border-gray-400"
                />
              </View>

              {/* Description */}
              <View>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  Description
                </Text>
                <TextInput
                  placeholder="Enter item description"
                  value={itemDescription}
                  onChangeText={setItemDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:border-gray-400 min-h-[80px]"
                />
              </View>

              {/* Price */}
              <View>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  Price (Rs)
                </Text>
                <TextInput
                  placeholder="0.00"
                  value={itemPrice ? String(itemPrice) : ""}
                  onChangeText={t => setItemPrice(Number(t) || 0)}
                  keyboardType="numeric"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:border-gray-400"
                />
              </View>

              {/* Quantity */}
              <View>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  Quantity
                </Text>
                <TextInput
                  placeholder="0"
                  value={itemQuantity ? String(itemQuantity) : ""}
                  onChangeText={t => setItemQuantity(Number(t) || 0)}
                  keyboardType="numeric"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:border-gray-400"
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row mt-8 space-x-4">
              <TouchableOpacity
                onPress={() => {
                  setEditModal(false);
                  resetForm();
                }}
                className="items-center flex-1 py-4 bg-gray-200 rounded-xl"
                activeOpacity={0.8}
              >
                <Text className="text-base font-semibold text-gray-800">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleEditItem}
                className="items-center flex-1 py-4 bg-gray-800 shadow-sm rounded-xl shadow-gray-700/30"
                activeOpacity={0.9}
              >
                <Text className="text-base font-semibold text-white">
                  Update Item
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default Item;

/* ================= EXTRA COMPONENTS ================= */

const ItemCard = ({
  name,
  description,
  price,
  quantity,
  isActive,
  onPress,
  onEdit,
  onDelete,
}: any) => (
  <TouchableOpacity 
    onPress={onPress} 
    className="p-4 mb-3 bg-white rounded-2xl active:opacity-90"
    activeOpacity={0.9}
  >
    <View className="flex-row justify-between">
      <View className="flex-1">
        <Text className="text-lg font-semibold text-gray-800">{name}</Text>
        {description ? (
          <Text className="mb-1 text-sm text-gray-500" numberOfLines={1}>
            {description}
          </Text>
        ) : null}
        <View className="flex-row mt-1">
          <Text className="mr-3 text-xs text-gray-400">
            Qty: <Text className="font-semibold">{quantity}</Text>
          </Text>
        </View>
      </View>

      <View className="items-end">
        <Text className="font-bold text-gray-900">Rs {price}</Text>

        {isActive && (
          <View className="flex-row mt-2 space-x-4">
            <TouchableOpacity 
              onPress={onEdit} 
              className="p-2 bg-gray-100 rounded-lg"
              activeOpacity={0.7}
            >
              <Feather name="edit-2" size={18} color="#4B5563" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={onDelete} 
              className="p-2 rounded-lg bg-red-50"
              activeOpacity={0.7}
            >
              <Feather name="trash" size={18} color="#DC2626" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

const ItemCardSkeleton = () => (
  <View className="p-4 mb-3 bg-white rounded-2xl">
    <View className="flex-row justify-between">
      <View className="flex-1">
        <View className="w-3/4 h-5 mb-2 bg-gray-200 rounded" />
        <View className="w-1/2 h-4 mb-1 bg-gray-200 rounded" />
        <View className="w-24 h-3 bg-gray-200 rounded" />
      </View>
      <View className="w-20 h-5 bg-gray-200 rounded" />
    </View>
  </View>
);
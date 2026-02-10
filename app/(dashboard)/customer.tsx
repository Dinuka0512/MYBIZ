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
import React, { useEffect, useState } from "react";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

import { 
  saveCustomer, 
  getAllCustomers, 
  updateCustomer, 
  deleteCustomer,
  searchCustomers,
} from "@/service/customerService";
import { Validator } from "@/util/Validations";

const Customer = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerBalance, setCustomerBalance] = useState(0);

  const [userId, setUserId] = useState("");
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);

  /* ---------------- LOAD USER + CUSTOMERS ---------------- */
  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem("userDetails");

      if (!stored) {
        router.replace("/login");
        return;
      }

      const user = JSON.parse(stored);
      setUserId(user.uid);

      const list = await getAllCustomers(user.uid);
      setCustomers(list);
    };

    load();
  }, []);

  /* ---------------- DEBOUNCED SEARCH ---------------- */
  const handleSearch = async (text: string) => {
    setSearchText(text);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (!text.trim()) {
      // If search is empty, load all customers
      const list = await getAllCustomers(userId);
      setCustomers(list);
      setIsSearching(false);
      setIsLoading(false);
      return;
    }

    setIsSearching(true);
    setIsLoading(true);
    
    // Set a new timeout for debouncing (300ms delay)
    const timeout = setTimeout(async () => {
      const results = await searchCustomers(userId, text);
      setCustomers(results);
      setIsLoading(false);
    }, 300);

    setSearchTimeout(timeout);
  };

  /* ---------------- REFRESH CUSTOMERS ---------------- */
  const refreshCustomers = async () => {
    const list = await getAllCustomers(userId);
    setCustomers(list);
    setSearchText(""); // Clear search when refreshing
    setIsSearching(false);
  };

  /* ---------------- ADD CUSTOMER ---------------- */
  const handleAddCustomer = async () => {
    if (!customerName || !customerPhone) {
      Alert.alert("Error", "Name and phone are required");
      return;
    }

    if (!Validator.isName(customerName)) {
      Alert.alert("Invalid Name");
      return;
    }

    if (!Validator.isMobile(customerPhone)) {
      Alert.alert("Invalid Phone");
      return;
    }

    await saveCustomer(userId, customerName, customerPhone, customerBalance);
    setAddModal(false);
    resetForm();
    await refreshCustomers(); // Refresh the list
  };

  /* ---------------- EDIT CUSTOMER ---------------- */
  const handleEditCustomer = async () => {
    if (!selectedCustomer) return;

    if (!customerName || !customerPhone) {
      Alert.alert("Error", "Name and phone are required");
      return;
    }

    if (!Validator.isName(customerName)) {
      Alert.alert("Invalid Name");
      return;
    }

    if (!Validator.isMobile(customerPhone)) {
      Alert.alert("Invalid Phone");
      return;
    }

    const updates = {
      name: customerName,
      phone: customerPhone,
      balance: customerBalance,
    };

    const success = await updateCustomer(userId, selectedCustomer.id, updates);
    
    if (success) {
      setEditModal(false);
      resetForm();
      setSelectedCustomer(null);
      await refreshCustomers(); // Refresh the list
      setActiveCustomerId(null);
    }
  };

  /* ---------------- DELETE CUSTOMER ---------------- */
  const handleDeleteCustomer = async (id: string) => {
    Alert.alert(
      "Delete Customer",
      "Are you sure you want to delete this customer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await deleteCustomer(userId, id);
            if (success) {
              // Update local state
              setCustomers(prev => prev.filter(c => c.id !== id));
              setActiveCustomerId(null);
            }
          },
        },
      ]
    );
  };

  /* ---------------- LOAD CUSTOMER FOR EDITING ---------------- */
  const loadCustomerForEdit = async (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name || "");
    setCustomerPhone(customer.phone || "");
    setCustomerBalance(Number(customer.balance) || 0);
    setEditModal(true);
    setActiveCustomerId(null);
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerBalance(0);
    setSelectedCustomer(null);
  };

  /* ================= UI ================= */
  return (
    <ScrollView className="flex-1 px-6 pt-10 bg-gray-100" showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <View className="mb-6 overflow-hidden bg-gray-700 border border-gray-200 shadow-md rounded-3xl">
        <View className="relative px-6 pt-6 pb-6">
          <View className="absolute top-5 right-5 bg-gray-100 rounded-full p-2.5">
            <Feather name="users" size={20} color="#4B5563" />
          </View>

          <Text className="mb-1 text-xs font-medium tracking-wider text-gray-300 uppercase">
            Management
          </Text>
          
          <Text className="mb-1 text-3xl font-bold text-white">
            Customers
          </Text>

          <View className="flex-row items-center mt-2">
            <View className="px-2 py-1 bg-green-700 rounded-full">
              <Text className="text-sm font-semibold text-white">
                {customers.length}
              </Text>
            </View>
            <Text className="ml-2 text-sm text-gray-200">
              {customers.length === 1 ? 'active customer' : 'active customers'}
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
        <Text className="font-bold text-white">+ Add New Customer</Text>
      </TouchableOpacity>

      {/* Search Bar */}
      <View className="flex-row items-center h-12 mb-4 overflow-hidden bg-white rounded-2xl">
        <TextInput
          value={searchText}
          onChangeText={handleSearch}
          placeholder="Search by name or phone..."
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

      {/* Customer Count */}
      {searchText.trim() && (
        <View className="mb-3">
          <Text className="text-sm text-gray-600">
            Found {customers.length} customer{customers.length !== 1 ? 's' : ''} for "{searchText}"
          </Text>
        </View>
      )}

      {/* Customer List - ALWAYS SHOW CARDS */}
      <View className="mb-6">
        {/* Loading State */}
        {isLoading ? (
          <>
            <CustomerCardSkeleton />
            <CustomerCardSkeleton />
            <CustomerCardSkeleton />
          </>
        ) : customers.length > 0 ? (
          // Show customers (empty search shows all, non-empty shows filtered)
          customers.map(c => (
            <CustomerCard
              key={c.id}
              {...c}
              isActive={activeCustomerId === c.id}
              onPress={() =>
                setActiveCustomerId(activeCustomerId === c.id ? null : c.id)
              }
              onEdit={() => loadCustomerForEdit(c)}
              onDelete={() => handleDeleteCustomer(c.id)}
            />
          ))
        ) : (
          // Only show empty state when there are truly no customers
          <View className="items-center justify-center py-10">
            <Feather name="users" size={50} color="#9CA3AF" />
            <Text className="mt-4 text-lg font-semibold text-gray-500">
              No customers yet
            </Text>
            <Text className="mt-2 text-gray-400">
              Add your first customer to get started
            </Text>
          </View>
        )}
      </View>

      {/* Add Customer Modal */}
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
                Add New Customer
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
                  Full Name
                </Text>
                <TextInput
                  placeholder="Enter customer name"
                  value={customerName}
                  onChangeText={setCustomerName}
                  autoCapitalize="words"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:border-gray-400"
                />
              </View>

              {/* Phone */}
              <View>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  Phone Number
                </Text>
                <TextInput
                  placeholder="+94XXXXXXXXX"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  keyboardType="phone-pad"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:border-gray-400"
                />
              </View>

              {/* Balance */}
              <View>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  Opening Balance (Rs)
                </Text>
                <TextInput
                  placeholder="0"
                  value={customerBalance ? String(customerBalance) : ""}
                  onChangeText={t => setCustomerBalance(Number(t) || 0)}
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
                onPress={handleAddCustomer}
                className="items-center flex-1 py-4 bg-gray-800 shadow-sm rounded-xl shadow-gray-700/30"
                activeOpacity={0.9}
              >
                <Text className="text-base font-semibold text-white">
                  Save Customer
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* Edit Customer Modal */}
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
                Edit Customer
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
                  Full Name
                </Text>
                <TextInput
                  placeholder="Enter customer name"
                  value={customerName}
                  onChangeText={setCustomerName}
                  autoCapitalize="words"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:border-gray-400"
                />
              </View>

              {/* Phone */}
              <View>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  Phone Number
                </Text>
                <TextInput
                  placeholder="077 123 4567"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  keyboardType="phone-pad"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:border-gray-400"
                />
              </View>

              {/* Balance */}
              <View>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  Opening Balance (Rs)
                </Text>
                <TextInput
                  placeholder="0"
                  value={customerBalance ? String(customerBalance) : ""}
                  onChangeText={t => setCustomerBalance(Number(t) || 0)}
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
                onPress={handleEditCustomer}
                className="items-center flex-1 py-4 bg-gray-800 shadow-sm rounded-xl shadow-gray-700/30"
                activeOpacity={0.9}
              >
                <Text className="text-base font-semibold text-white">
                  Update Customer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default Customer;

/* ================= EXTRA COMPONENTS ================= */

const CustomerCard = ({
  name,
  phone,
  balance,
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
        <Text className="text-sm text-gray-500">{phone}</Text>
      </View>

      <View className="items-end">
        <Text className="font-bold text-gray-900">Rs {balance}</Text>

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

const CustomerCardSkeleton = () => (
  <View className="p-4 mb-3 bg-white rounded-2xl">
    <View className="flex-row justify-between">
      <View className="flex-1">
        <View className="w-3/4 h-5 mb-2 bg-gray-200 rounded" />
        <View className="w-1/2 h-4 bg-gray-200 rounded" />
      </View>
      <View className="w-20 h-5 bg-gray-200 rounded" />
    </View>
  </View>
);
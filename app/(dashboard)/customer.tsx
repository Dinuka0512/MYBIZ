import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { saveCustomer, getAllCustomers } from "@/service/customerService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { getAllUserData } from "@/service/authService";
import { Validator } from "@/util/Validations";

const Customer = () => {
  const [customers, setCustomers] = useState([
    { id: "", name: "", phone: "", balance: "" },
   ]);

  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerBalance, setCustomerBalance] = useState(0);
  const [userDetails, setUserDetails] = useState("");
  const [userId, setUserId] = useState("");

  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);

  // LOAD USER DATA
  useEffect(() => {
  const loadUserAndCustomers = async () => {
    const stored = await AsyncStorage.getItem("userDetails");

    if (!stored) {
      router.replace("/login");
      return;
    }

    const user = JSON.parse(stored);
    setUserDetails(user);
    setUserId(user.uid);

    // 🔥 LOAD CUSTOMERS HERE
    const customerList = await getAllCustomers(user.uid);
    setCustomers(customerList);
  };

  loadUserAndCustomers();
}, []);


  /* ---------------- ADD CUSTOMER ---------------- */
  const handleAddCustomer = () => {
    if (!customerName || !customerPhone) {
      Alert.alert("Error", "Name and phone are required");
      return;
    }

    // Validate customer name
    if (!Validator.isName(customerName)) {
      Alert.alert(
        "Invalid Name",
        "Please enter a valid name (2-50 characters, letters, spaces and hyphens only)",
        [{ text: "OK" }]
      );
      return;
    }

    // Validate customer phone
    if (Validator.isMobile(customerPhone)) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid mobile number (e.g., 0771234567)",
        [{ text: "OK" }]
      );
      return;
    }

    // Validate customer balance
    if (!Validator.isDouble(String(customerBalance))) {
      Alert.alert(
        "Invalid Balance",
        "Please enter a valid balance amount",
        [{ text: "OK" }]
      );
      return;
    }
    
    saveCustomer(userId, customerName, customerPhone, customerBalance);
    resetSave();
    setAddModal(false);
  };

  function resetSave(){
    setCustomerName("");
    setCustomerPhone("");
    setCustomerBalance(0);
  }

  
  /* ---------------- UPDATE CUSTOMER ---------------- */
  const handleUpdateCustomer = () => {
    // if (!selectedCustomer) return;
    // const updatedList = customers.map((c) =>
    //   c.id === selectedCustomer.id
    //     ? { ...c, name: customerName, phone: customerPhone, balance: customerBalance }
    //     : c
    // );
    // setCustomers(updatedList);
    // setEditModal(false);
    // setSelectedCustomer(null);
  };

  /* ---------------- DELETE CUSTOMER ---------------- */
  const handleDeleteCustomer = (id: string) => {
    const filtered = customers.filter((c) => c.id !== id);
    setCustomers(filtered);
    setActiveCustomerId(null); // close actions if open
  };

  // Handle balance input change
  const handleBalanceChange = (text: string) => {
    // Remove any non-numeric characters except decimal point and minus sign
    const cleanedText = text.replace(/[^0-9.-]/g, '');
    
    // If empty string, set to 0
    if (cleanedText === '' || cleanedText === '-') {
      setCustomerBalance(0);
    } else {
      const numValue = Number(cleanedText);
      // Check if it's a valid number
      if (!isNaN(numValue)) {
        setCustomerBalance(numValue);
      }
    }
  };

  return (
    <ScrollView className="flex-1 px-6 pt-10 bg-gray-100">
      {/* Header */}
      <View className="p-5 mb-4 bg-white shadow-sm rounded-3xl">
        <Text className="text-xs tracking-widest text-gray-400 uppercase">
          Customers
        </Text>
        <Text className="mt-1 text-2xl font-bold text-gray-900">
          Customer List
        </Text>
        <Text className="mt-1 text-sm text-gray-500">
          Manage your customers and credits
        </Text>
      </View>

      {/* Add New Customer Button */}
      <TouchableOpacity
        onPress={() => setAddModal(true)}
        className="items-center p-4 mb-5 bg-black rounded-2xl"
      >
        <Text className="font-bold text-white">+ Add New Customer</Text>
      </TouchableOpacity>

      {/* Search */}
      <View className="p-4 mb-4 bg-white shadow-sm rounded-2xl">
        <TextInput
          placeholder="Search by name or phone"
          placeholderTextColor="#9ca3af"
          className="text-gray-900"
        />
      </View>

      {/* Customer List */}
      <View className="mb-7">
        {customers.map((c) => (
          <CustomerCard
            key={c.id}
            id={c.id}
            name={c.name}
            phone={c.phone}
            balance={c.balance}
            isActive={activeCustomerId === c.id}
            onPress={() =>
              setActiveCustomerId(activeCustomerId === c.id ? null : c.id)
            }
            onEdit={() => {
              setSelectedCustomer(c);
              setCustomerName(c.name);
              setCustomerPhone(c.phone);
              // Convert balance string to number for editing
              const balanceNum = Number(c.balance);
              setCustomerBalance(isNaN(balanceNum) ? 0 : balanceNum);
              setEditModal(true);
              setActiveCustomerId(null);
            }}
            onDelete={() => handleDeleteCustomer(c.id)}
          />
        ))}
      </View>

      {/* Add Customer Modal */}
      <Modal transparent animationType="slide" visible={addModal}>
        <View className="justify-center flex-1 bg-black/40">
          <View className="p-6 mx-6 bg-white rounded-2xl">
            <Text className="mb-4 text-lg font-semibold">Add New Customer</Text>

            <TextInput
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Customer Name"
              className="p-4 mb-4 bg-gray-100 rounded-xl"
            />
            <TextInput
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              className="p-4 mb-4 bg-gray-100 rounded-xl"
            />
            <TextInput
              value={customerBalance === 0 ? "" : String(customerBalance)}
              onChangeText={handleBalanceChange}
              placeholder="Balance (optional)"
              keyboardType="number-pad"
              className="p-4 mb-6 bg-gray-100 rounded-xl"
            />

            <View className="flex-row">
              <TouchableOpacity
                onPress={() => {
                  setAddModal(false); 
                  setCustomerName("");
                  setCustomerPhone("");
                  setCustomerBalance(0)
                }}
                className="flex-1 p-4 mr-2 bg-gray-100 rounded-xl"
              >
                <Text className="text-center text-gray-600">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddCustomer}
                className="flex-1 p-4 ml-2 bg-black rounded-xl"
              >
                <Text className="font-semibold text-center text-white">
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal transparent animationType="slide" visible={editModal}>
        <View className="justify-center flex-1 bg-black/40">
          <View className="p-6 mx-6 bg-white rounded-2xl">
            <Text className="mb-4 text-lg font-semibold">Edit Customer</Text>

            <TextInput
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Customer Name"
              className="p-4 mb-4 bg-gray-100 rounded-xl"
            />
            <TextInput
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              className="p-4 mb-4 bg-gray-100 rounded-xl"
            />
            <TextInput
              value={customerBalance === 0 ? "" : String(customerBalance)}
              onChangeText={handleBalanceChange}
              placeholder="Balance"
              keyboardType="number-pad"
              className="p-4 mb-6 bg-gray-100 rounded-xl"
            />

            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setEditModal(false)}
                className="flex-1 p-4 mr-2 bg-gray-100 rounded-xl"
              >
                <Text className="text-center text-gray-600">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUpdateCustomer}
                className="flex-1 p-4 ml-2 bg-blue-600 rounded-xl"
              >
                <Text className="font-semibold text-center text-white">
                  Update
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

/* ---------- Customer Card Component ---------- */
const CustomerCard = ({
  id,
  name,
  phone,
  balance,
  isActive,
  onPress,
  onEdit,
  onDelete,
}: any) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="p-4 mb-3 bg-white shadow-sm rounded-2xl"
    >
      <View className="flex-row items-center justify-between">
        {/* Left side */}
        <View>
          <Text className="text-lg font-semibold text-gray-900">{name}</Text>
          <Text className="text-sm text-gray-400">{phone}</Text>
        </View>

        {/* Right side */}
        <View className="items-end">
          <Text className="text-xs text-gray-400">Balance</Text>
          <Text
            className={`font-bold ${
              Number(balance) > 0 ? "text-red-500" : "text-green-600"
            }`}
          >
            Rs {balance}
          </Text>

          {isActive && (
            <View className="flex-row mt-2">
              <TouchableOpacity onPress={onEdit} className="mr-3">
                <Feather name="edit" size={18} color="#2563EB" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onDelete}>
                <Feather name="trash" size={18} color="#DC2626" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
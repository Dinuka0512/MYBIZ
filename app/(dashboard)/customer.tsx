import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { Feather } from "@expo/vector-icons";

const Customer = () => {
  const [customers, setCustomers] = useState([
    { id: "1", name: "Kamal Perera", phone: "077 123 4567", balance: "2500" },
    { id: "2", name: "Nimali Silva", phone: "071 987 6543", balance: "0" },
    { id: "3", name: "Ruwan Fernando", phone: "075 456 7890", balance: "1200" },
  ]);

  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerBalance, setCustomerBalance] = useState("");

  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);

  /* ---------------- ADD CUSTOMER ---------------- */
  const handleAddCustomer = () => {
    if (!customerName || !customerPhone) {
      Alert.alert("Error", "Name and phone are required");
      return;
    }
    const newCustomer = {
      id: Date.now().toString(),
      name: customerName,
      phone: customerPhone,
      balance: customerBalance || "0",
    };
    setCustomers([...customers, newCustomer]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerBalance("");
    setAddModal(false);
  };

  /* ---------------- UPDATE CUSTOMER ---------------- */
  const handleUpdateCustomer = () => {
    if (!selectedCustomer) return;
    const updatedList = customers.map((c) =>
      c.id === selectedCustomer.id
        ? { ...c, name: customerName, phone: customerPhone, balance: customerBalance }
        : c
    );
    setCustomers(updatedList);
    setEditModal(false);
    setSelectedCustomer(null);
  };

  /* ---------------- DELETE CUSTOMER ---------------- */
  const handleDeleteCustomer = (id: string) => {
    const filtered = customers.filter((c) => c.id !== id);
    setCustomers(filtered);
    setActiveCustomerId(null); // close actions if open
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
            setCustomerBalance(c.balance);
            setEditModal(true);
            setActiveCustomerId(null);
          }}
          onDelete={() => handleDeleteCustomer(c.id)}
        />
      ))}

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
              value={customerBalance}
              onChangeText={setCustomerBalance}
              placeholder="Balance (optional)"
              keyboardType="numeric"
              className="p-4 mb-6 bg-gray-100 rounded-xl"
            />

            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setAddModal(false)}
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
              value={customerBalance}
              onChangeText={setCustomerBalance}
              placeholder="Balance"
              keyboardType="numeric"
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

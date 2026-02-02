import { View, Text, ScrollView, TextInput, TouchableOpacity } from "react-native";
import React from "react";

const Customer = () => {
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

      {/* Add New Customer Button (TOP) */}
      <TouchableOpacity className="items-center p-4 mb-5 bg-black rounded-2xl">
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
      <CustomerCard
        name="Kamal Perera"
        phone="077 123 4567"
        balance="Rs 2,500"
        due
      />

      <CustomerCard
        name="Nimali Silva"
        phone="071 987 6543"
        balance="Rs 0"
      />

      <CustomerCard
        name="Ruwan Fernando"
        phone="075 456 7890"
        balance="Rs 1,200"
        due
      />

    </ScrollView>
  );
};

export default Customer;

/* ---------- Components ---------- */

const CustomerCard = ({ name, phone, balance, due }: any) => (
  <View className="p-4 mb-3 bg-white shadow-sm rounded-2xl">
    <View className="flex-row items-center justify-between">

      <View>
        <Text className="text-lg font-semibold text-gray-900">{name}</Text>
        <Text className="text-sm text-gray-400">{phone}</Text>
      </View>

      <View className="items-end">
        <Text className="text-xs text-gray-400">Balance</Text>
        <Text
          className={`font-bold ${
            due ? "text-red-500" : "text-green-600"
          }`}
        >
          {balance}
        </Text>
      </View>

    </View>
  </View>
);

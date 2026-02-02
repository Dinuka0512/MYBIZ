import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import React from "react";

const Sales = () => {
  return (
    <ScrollView className="flex-1 px-6 pt-10 bg-gray-100">

      {/* Header */}
      <View className="p-5 mb-4 bg-white shadow-sm rounded-3xl">
        <Text className="text-xs tracking-widest text-gray-400 uppercase">
          Sales
        </Text>
        <Text className="mt-1 text-2xl font-bold text-gray-900">
          Sales Overview
        </Text>
        <Text className="mt-1 text-sm text-gray-500">
          Track your daily sales
        </Text>
      </View>

      {/* Add Sale Button */}
      <TouchableOpacity className="items-center p-4 mb-6 bg-black rounded-2xl">
        <Text className="font-bold text-white">+ New Sale</Text>
      </TouchableOpacity>

      {/* Today Summary */}
      <View className="p-5 mb-6 bg-white shadow-sm rounded-3xl">
        <Text className="text-xs text-gray-400 uppercase">Today</Text>
        <Text className="mt-1 text-3xl font-extrabold text-gray-900">
          Rs 12,500
        </Text>

        <View className="flex-row items-center mt-2">
          <Text className="font-semibold text-green-600">▲ 12%</Text>
          <Text className="ml-2 text-gray-400">from yesterday</Text>
        </View>
      </View>

      {/* Sales List */}
      <Text className="mb-3 text-lg font-bold text-gray-900">
        Recent Sales
      </Text>

      <SaleCard
        customer="Kamal Perera"
        amount="Rs 1,250"
        time="10:45 AM"
      />

      <SaleCard
        customer="Nimali Silva"
        amount="Rs 850"
        time="12:10 PM"
      />

      <SaleCard
        customer="Walk-in Customer"
        amount="Rs 3,200"
        time="03:30 PM"
      />

      <SaleCard
        customer="Walk-in Customer"
        amount="Rs 3,200"
        time="03:30 PM"
      />

    </ScrollView>
  );
};

export default Sales;

/* ---------- Components ---------- */

const SaleCard = ({ customer, amount, time }: any) => (
  <View className="p-4 mb-3 bg-white shadow-sm rounded-2xl">
    <View className="flex-row items-center justify-between">

      <View>
        <Text className="text-lg font-semibold text-gray-900">
          {customer}
        </Text>
        <Text className="text-sm text-gray-400">{time}</Text>
      </View>

      <Text className="text-lg font-bold text-green-600">
        {amount}
      </Text>

    </View>
  </View>
);

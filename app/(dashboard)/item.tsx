import { View, Text, ScrollView, TextInput, TouchableOpacity } from "react-native";
import React from "react";

const Item = () => {
  return (
    <ScrollView className="flex-1 px-6 pt-10 bg-gray-100">

      {/* Header */}
      <View className="p-5 mb-4 bg-white shadow-sm rounded-3xl">
        <Text className="text-xs tracking-widest text-gray-400 uppercase">
          Items
        </Text>
        <Text className="mt-1 text-2xl font-bold text-gray-900">
          Inventory
        </Text>
        <Text className="mt-1 text-sm text-gray-500">
          Manage your products and stock
        </Text>
      </View>

      {/* Add Item Button */}
      <TouchableOpacity className="items-center p-4 mb-5 bg-black rounded-2xl">
        <Text className="font-bold text-white">+ Add New Item</Text>
      </TouchableOpacity>

      {/* Search */}
      <View className="p-4 mb-4 bg-white shadow-sm rounded-2xl">
        <TextInput
          placeholder="Search item name"
          placeholderTextColor="#9ca3af"
          className="text-gray-900"
        />
      </View>

      {/* Item List */}
      <ItemCard
        name="Rice Packet"
        price="Rs 250"
        stock="120"
      />

      <ItemCard
        name="Dhal"
        price="Rs 180"
        stock="45"
        low
      />

      <ItemCard
        name="Sugar"
        price="Rs 220"
        stock="90"
      />

    </ScrollView>
  );
};

export default Item;

/* ---------- Components ---------- */

const ItemCard = ({ name, price, stock, low }: any) => (
  <View className="p-4 mb-3 bg-white shadow-sm rounded-2xl">
    <View className="flex-row items-center justify-between">

      <View>
        <Text className="text-lg font-semibold text-gray-900">{name}</Text>
        <Text className="text-sm text-gray-400">{price}</Text>
      </View>

      <View className="items-end">
        <Text className="text-xs text-gray-400">Stock</Text>
        <Text
          className={`font-bold ${
            low ? "text-red-500" : "text-green-600"
          }`}
        >
          {stock}
        </Text>
      </View>

    </View>
  </View>
);

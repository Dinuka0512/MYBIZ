import { View, Text, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import { getAllOrders } from "@/service/orderService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ViewAllOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const user = await AsyncStorage.getItem("user");
        if (!user) return;
        const userConvert = JSON.parse(user);
        const allOrders = await getAllOrders(userConvert.uid);
        setOrders(allOrders);
      } catch (error) {
        console.error("Error loading orders:", error);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  if (loading) {
    return (
      <View className="items-center justify-center flex-1">
        <Text>Loading orders...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 p-4 bg-gray-100">
      {orders.map((order, index) => (
        <View key={order.id || index} className="p-4 mb-3 bg-white rounded-lg shadow">
          <Text className="font-bold text-gray-900">
            Order #{order.id?.slice(0, 8) || index + 1}
          </Text>
          <Text className="text-sm text-gray-600">
            Customer: {order.customerName || "Walk-in"}
          </Text>
          <Text className="text-sm text-gray-600">
            Total: Rs {order.total?.toFixed(2) || "0.00"}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

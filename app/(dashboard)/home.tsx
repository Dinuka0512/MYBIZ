import { View, Text, ScrollView, Alert } from "react-native";
import React from "react";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAllUserData } from "@/service/authService";
import { useEffect, useState } from "react";

export default function Home() {
  const [userDetails, setUserDetails] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const user = await AsyncStorage.getItem("user");

      if (user == null) {
        Alert.alert("Error Unauthorized", "User is not found.");
        router.push("/login");
      } else {
        const userConvert = JSON.parse(user);
        const data = await getAllUserData(userConvert.uid);
        
        //HERE SAVE USER DATA 
        await AsyncStorage.setItem("userDetails", JSON.stringify(data));
        setUserDetails(data);
      }

      const udata = await AsyncStorage.getItem("userDetails");
      if (udata !== null) {
        setUserDetails(JSON.parse(udata));
      }
    };

    getUser();
  }, []);

  return (
    <ScrollView className="flex-1 px-6 pt-10 bg-gray-100">

     {/* Welcome Section */}
      <View className="p-2 mb-1">
        
        <Text className="mt-1 text-2xl font-bold text-gray-900">
          Welcome,  {userDetails?.name ?? "User"}
        </Text>

        <Text className="mt-1 text-sm text-gray-500">
          Here’s what’s happening in your business today
        </Text>
      </View>


      {/* Main Revenue Card */}
      <View className="p-6 mb-6 bg-gray-700 rounded-3xl">
        <Text className="text-xs text-gray-400 uppercase">Today Revenue</Text>
        <Text className="mt-2 text-4xl font-extrabold text-white">Rs 12,500</Text>

        <View className="flex-row items-center mt-3">
          <Text className="font-semibold text-green-400">▲ 12%</Text>
          <Text className="ml-2 text-gray-400">from yesterday</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View className="flex-row justify-between mb-8">
        <StatCard title="Orders" value="32" />
        <StatCard title="Customers" value="18" />
        <StatCard title="Profit" value="Rs 3.2k" />
      </View>

      {/* Focus Section */}
      <Text className="mb-4 text-lg font-bold text-gray-900">
        Focus Today
      </Text>

      <FocusItem icon="💰" text="2 payments pending" />
      <FocusItem icon="📦" text="Low stock: Rice Packet" />
      <FocusItem icon="📈" text="Sales trend is growing" />

    </ScrollView>
  );
}

/* ---------- Components ---------- */

const StatCard = ({ title, value }: any) => (
  <View className="flex-1 p-4 mx-1 bg-white shadow-sm rounded-2xl">
    <Text className="text-xs text-gray-400">{title}</Text>
    <Text className="mt-1 text-xl font-bold text-gray-900">{value}</Text>
  </View>
);

const FocusItem = ({ icon, text }: any) => (
  <View className="flex-row items-center p-4 mb-3 bg-white shadow-sm rounded-2xl">
    <View className="items-center justify-center w-10 h-10 mr-4 bg-gray-100 rounded-full">
      <Text>{icon}</Text>
    </View>
    <Text className="flex-1 font-medium text-gray-700">{text}</Text>
    <Text className="text-gray-300">›</Text>
  </View>
);

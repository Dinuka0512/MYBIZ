import { View, Text, ScrollView, Alert, ActivityIndicator, Dimensions, TouchableOpacity } from "react-native";
import React from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAllUserData } from "@/service/authService";
import { getAllCustomers } from "@/service/customerService";
import { getAllOrders } from "@/service/orderService";
import { getAllItems } from "@/service/itemService";
import { useEffect, useState } from "react";
import { Feather } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

export default function Home() {
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayOrdersCount, setTodayOrdersCount] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [thisMonthProfit, setThisMonthProfit] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<any[]>([]);
  const [todayOrders, setTodayOrders] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const user = await AsyncStorage.getItem("user");
        if (user == null) {
          Alert.alert("Error Unauthorized", "User is not found.");
          router.push("/login");
          return;
        }

        const userConvert = JSON.parse(user);
        
        // Get user data
        const userData = await getAllUserData(userConvert.uid);
        await AsyncStorage.setItem("userDetails", JSON.stringify(userData));
        setUserDetails(userData);

        // Get all data in parallel
        const [customers, orders, items] = await Promise.all([
          getAllCustomers(userConvert.uid),
          getAllOrders(userConvert.uid),
          getAllItems(userConvert.uid)
        ]);

        console.log("Loaded data:", { customers: customers.length, orders: orders.length, items: items.length });

        // Calculate today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Calculate today's orders and revenue
        const todayOrdersData = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= today && orderDate <= todayEnd;
        });

        console.log("Today orders:", todayOrdersData.length);

        // Store today's orders for display
        setTodayOrders(todayOrdersData);
        setTodayOrdersCount(todayOrdersData.length);
        const todayRev = todayOrdersData.reduce((sum, order) => sum + (order.total || 0), 0);
        setTodayRevenue(todayRev);

        // Set total customers
        setTotalCustomers(customers.length);

        // Calculate this month's profit (30% margin)
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        
        const thisMonthOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear;
        });

        const monthRevenue = thisMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const profit = monthRevenue * 0.3; // 30% profit margin
        setThisMonthProfit(profit);

        // Check low stock items (less than 5)
        const lowStock = items.filter(item => (item.quantity || 0) < 5);
        setLowStockItems(lowStock.slice(0, 3)); // Show only 3 items

        // Prepare monthly sales data for chart (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date;
        }).reverse();

        const salesData = last7Days.map(date => {
          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);

          const dayOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= dayStart && orderDate <= dayEnd;
          });

          const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
          
          return {
            value: dayRevenue,
            label: date.toLocaleDateString('en-US', { weekday: 'short' }),
            day: date,
          };
        });

        setMonthlySalesData(salesData);
        console.log("Sales data prepared:", salesData);

      } catch (error) {
        console.error("Error loading dashboard:", error);
        Alert.alert("Error", "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <View className="items-center justify-center flex-1 bg-gray-100">
        <ActivityIndicator size="large" color="#4B5563" />
        <Text className="mt-4 text-gray-600">Loading dashboard...</Text>
      </View>
    );
  }

  // Find max value for chart scaling
  const maxValue = monthlySalesData.length > 0 
    ? Math.max(...monthlySalesData.map(item => item.value))
    : 1000;

  return (
    <ScrollView className="flex-1 bg-gray-100" showsVerticalScrollIndicator={false}>
      {/* Welcome Section */}
      <View className="px-6 pt-10 pb-4">
        <Text className="text-2xl font-bold text-gray-900">
          Welcome, {userDetails?.name ?? "User"}
        </Text>
        <Text className="mt-1 text-sm text-gray-500">
          Here's what's happening in your business today
        </Text>
      </View>

      {/* Main Revenue Card */}
      <View className="px-6 mb-6">
        <View className="p-6 bg-gray-800 rounded-3xl">
          <Text className="text-xs text-gray-400 uppercase">Today Revenue</Text>
          <Text className="mt-2 text-4xl font-extrabold text-white">
            Rs {todayRevenue.toLocaleString()}
          </Text>
          
          <View className="flex-row items-center mt-3">
            <Feather name="shopping-bag" size={16} color="#10B981" />
            <Text className="ml-2 font-semibold text-green-400">{todayOrdersCount} Orders Today</Text>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View className="flex-row justify-between px-6 mb-8">
        <View className="flex-1 p-4 mx-1 bg-white shadow-sm rounded-2xl">
          <Text className="text-xs text-gray-400">Today Orders</Text>
          <Text className="mt-1 text-xl font-bold text-gray-900">{todayOrdersCount}</Text>
        </View>
        <View className="flex-1 p-4 mx-1 bg-white shadow-sm rounded-2xl">
          <Text className="text-xs text-gray-400">Customers</Text>
          <Text className="mt-1 text-xl font-bold text-gray-900">{totalCustomers}</Text>
        </View>
        <View className="flex-1 p-4 mx-1 bg-white shadow-sm rounded-2xl">
          <Text className="text-xs text-gray-400">Month Profit</Text>
          <Text className="mt-1 text-xl font-bold text-gray-900">Rs {Math.round(thisMonthProfit).toLocaleString()}</Text>
        </View>
      </View>

      {/* Analytics Chart - Simple Version */}
      <View className="px-6 mb-8">
        <View className="p-6 bg-white shadow-sm rounded-2xl">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-lg font-bold text-gray-900">Weekly Sales Trend</Text>
            <View className="px-3 py-1 bg-gray-500 rounded-full">
              <Text className="text-xs font-semibold text-white ">Last 7 days</Text>
            </View>
          </View>
          
          {monthlySalesData.length > 0 ? (
            <View>
              {/* Simple bar chart */}
              <View className="flex-row items-end justify-between mb-4 h-fit">
                {monthlySalesData.map((item, index) => {
                  const barHeight = maxValue > 0 ? (item.value / maxValue) * 50 : 0;
                  return (
                    <View key={index} className="items-center">
                      <View 
                        className="w-6 bg-gray-900 rounded-t-full"
                        style={{ height: Math.max(10, barHeight) }}
                      />
                      <Text className="mt-2 text-xs text-gray-500">{item.label}</Text>
                    </View>
                  );
                })}
              </View>
              
              {/* Stats below chart */}
              <View className="flex-row justify-between p-4 rounded-lg bg-gray-50">
                <View>
                  <Text className="text-xs text-gray-500">Highest</Text>
                  <Text className="font-bold text-gray-900">
                    Rs {Math.max(...monthlySalesData.map(item => item.value)).toLocaleString()}
                  </Text>
                </View>
                <View>
                  <Text className="text-xs text-gray-500">Average</Text>
                  <Text className="font-bold text-gray-900">
                    Rs {Math.round(monthlySalesData.reduce((sum, item) => sum + item.value, 0) / monthlySalesData.length).toLocaleString()}
                  </Text>
                </View>
                <View>
                  <Text className="text-xs text-gray-500">Total</Text>
                  <Text className="font-bold text-gray-900">
                    Rs {monthlySalesData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View className="items-center justify-center h-40">
              <Feather name="bar-chart-2" size={48} color="#D1D5DB" />
              <Text className="mt-3 text-gray-400">No sales data available</Text>
              <Text className="mt-1 text-sm text-gray-400">Start selling to see analytics</Text>
            </View>
          )}
        </View>
      </View>

      {/* Focus Today - ONLY SHOW IF THERE ARE LOW STOCK ITEMS */}
      {lowStockItems.length > 0 && (
        <View className="px-6 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">
              Stock Alerts
            </Text>
            <Text className="text-sm text-red-600">{lowStockItems.length} alert{lowStockItems.length !== 1 ? 's' : ''}</Text>
          </View>

          {lowStockItems.map((item, index) => (
            <View 
              key={index} 
              className={`p-4 mb-3 ${item.quantity === 0 ? 'bg-red-50' : 'bg-yellow-50'} shadow-sm rounded-2xl`}
            >
              <View className="flex-row items-center">
                <View className="items-center justify-center w-10 h-10 mr-4 bg-white rounded-full">
                  <Feather 
                    name={item.quantity === 0 ? "alert-circle" : "alert-triangle"} 
                    size={20} 
                    color={item.quantity === 0 ? "#DC2626" : "#D97706"} 
                  />
                </View>
                <View className="flex-1">
                  <Text className={`font-medium ${item.quantity === 0 ? 'text-red-800' : 'text-yellow-800'}`}>
                    {item.quantity === 0 ? 'Out of stock' : 'Low stock'}: {item.name}
                  </Text>
                  <Text className={`text-sm ${item.quantity === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                    Quantity: {item.quantity || 0}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* TODAY'S ORDER DETAILS SECTION */}
      <View className="px-6 mb-10">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-bold text-gray-900">Today's Orders</Text>
          {todayOrders.length > 0 && (
            <TouchableOpacity onPress={() => router.push("/viewAllOrders")}>
              <Text className="text-sm text-blue-600">View All</Text>
            </TouchableOpacity>
          )}
        </View>

        {todayOrders.length > 0 ? (
          <View className="bg-white shadow-sm rounded-2xl">
            {todayOrders.slice(0, 5).map((order, index) => (
              <View 
                key={order.id || index}
                className={`p-4 ${index < todayOrders.slice(0, 2).length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                {/* Customer Details */}
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className="font-semibold text-gray-900">
                      {order.customerName || "Walk-in Customer"}
                    </Text>
                    {order.customerPhone && (
                      <Text className="text-sm text-gray-500">{order.customerPhone}</Text>
                    )}
                  </View>
                  <View className="items-end">
                    <Text className="text-xs text-gray-400">
                      Order #{order.id?.slice(0, 8) || index + 1}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>

                {/* Items Sold */}
                <View className="mb-3">
                  <Text className="mb-1 text-sm font-medium text-gray-700">Items Sold:</Text>
                  {order.items && Array.isArray(order.items) ? (
                    <View>
                      
                      {order.items.slice(0, 2).map((item: { name: string; price: number; quantity: number }, i: number) => (
                        <View key={i} className="flex-row justify-between py-1">
                          <Text className="text-sm text-gray-600">
                            {item.quantity}x {item.name}
                          </Text>
                          <Text className="text-sm text-gray-600">
                            Rs {(item.price * item.quantity).toFixed(2)}
                          </Text>
                        </View>
                      ))}
                      {order.items.length > 2 && (
                        <Text className="mt-1 text-sm text-gray-500">
                          +{order.items.length - 2} more items
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Text className="text-sm text-gray-500">No item details available</Text>
                  )}
                </View>

                {/* Payment Status and Total */}
                <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                  <View className="flex-row items-center">
                    <View className={`px-3 py-1 rounded-full ${
                      order.paymentMethod === 'cash' ? 'bg-green-100' :
                      order.paymentMethod === 'credit' ? 'bg-yellow-100' :
                      order.paymentMethod === 'mixed' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Text className={`text-xs font-medium ${
                        order.paymentMethod === 'cash' ? 'text-green-800' :
                        order.paymentMethod === 'credit' ? 'text-yellow-800' :
                        order.paymentMethod === 'mixed' ? 'text-blue-800' : 'text-gray-800'
                      }`}>
                        {order.paymentMethod === 'cash' ? 'Paid' :
                         order.paymentMethod === 'credit' ? 'Credit' :
                         order.paymentMethod === 'mixed' ? 'Partial' : 'Unknown'}
                      </Text>
                    </View>
                    {order.dueAmount > 0 && (
                      <Text className="ml-2 text-xs text-red-600">
                        Due: Rs {order.dueAmount?.toFixed(2) || '0.00'}
                      </Text>
                    )}
                  </View>
                  
                  <View className="items-end">
                    <Text className="text-lg font-bold text-gray-900">
                      Rs {order.total?.toFixed(2) || '0.00'}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {todayOrders.length > 2 && (
              <TouchableOpacity 
                className="items-center py-3 border-t border-gray-100"
                onPress={() => router.push("/viewAllOrders")}
              >
                <Text className="font-medium text-blue-600">
                  View {todayOrders.length - 5} more orders
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="items-center justify-center p-8 bg-white shadow-sm rounded-2xl">
            <Feather name="shopping-bag" size={48} color="#D1D5DB" />
            <Text className="mt-3 text-lg font-medium text-gray-400">No orders today</Text>
            <Text className="mt-1 text-gray-400">Start selling to see orders here</Text>
            <TouchableOpacity 
              className="px-6 py-2 mt-4 bg-gray-800 rounded-lg"
              onPress={() => router.push("/sales")}
            >
              <Text className="font-medium text-white">Create First Sale</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
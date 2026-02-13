import { View, Text, ScrollView, Alert, ActivityIndicator, RefreshControl, TouchableOpacity, Modal } from "react-native";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAllOrders } from "@/service/orderService";
import { getAllOrderDetails } from "@/service/orderDetailService";
import { getAllCustomers } from "@/service/customerService";
import { getAllItems } from "@/service/itemService";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';

// Types
interface Order {
  id: string;
  customerId: string;
  createdAt: string;
  total: number;
  paymentMethod: string;
  dueAmount?: number;
  customerName?: string;
  customerPhone?: string;
  items?: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
}

interface GroupedOrders {
  title: string;
  data: Order[];
  total: number;
}

// Simple Loading Component
const LoadingScreen = () => (
  <View className="flex-1 bg-gray-100">
    {/* Header Skeleton */}
    <View className="px-6 pt-12 pb-4 bg-white shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="w-10 h-10 bg-gray-200 rounded-full" />
        <View className="w-24 h-8 bg-gray-200 rounded-lg" />
        <View className="w-10 h-10 bg-gray-200 rounded-full" />
      </View>
      
      {/* Stats Cards Skeleton */}
      <View className="flex-row mt-4">
        <View className="flex-1 h-16 p-3 mr-1 bg-gray-200 rounded-xl" />
        <View className="flex-1 h-16 p-3 mx-1 bg-gray-200 rounded-xl" />
        <View className="flex-1 h-16 p-3 ml-1 bg-gray-200 rounded-xl" />
      </View>
    </View>

    {/* Content Skeleton */}
    <View className="flex-1 px-6 mt-4">
      {/* Date Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View className="w-5 h-5 bg-gray-200 rounded-full" />
          <View className="w-48 h-5 ml-2 bg-gray-200 rounded-lg" />
        </View>
        <View className="w-24 h-6 bg-gray-200 rounded-full" />
      </View>

      {/* Order Cards */}
      {[1, 2, 3].map((item) => (
        <View key={item} className="p-4 mb-3 bg-white rounded-xl">
          {/* Header */}
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <View className="w-32 h-5 mb-2 bg-gray-200 rounded-lg" />
              <View className="w-20 h-4 bg-gray-200 rounded-lg" />
            </View>
            <View className="w-16 h-6 bg-gray-200 rounded-full" />
          </View>

          {/* Order ID */}
          <View className="w-24 h-4 mb-3 bg-gray-200 rounded-lg" />

          {/* Items */}
          <View className="p-2 mb-3 bg-gray-100 rounded-lg">
            <View className="flex-row justify-between py-1">
              <View className="w-32 h-4 bg-gray-200 rounded-lg" />
              <View className="w-16 h-4 bg-gray-200 rounded-lg" />
            </View>
            <View className="flex-row justify-between py-1">
              <View className="w-24 h-4 bg-gray-200 rounded-lg" />
              <View className="w-16 h-4 bg-gray-200 rounded-lg" />
            </View>
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-between pt-2 border-t border-gray-100">
            <View>
              <View className="w-16 h-3 mb-1 bg-gray-200 rounded-lg" />
              <View className="w-24 h-6 bg-gray-200 rounded-lg" />
            </View>
            <View className="w-20 h-8 bg-gray-200 rounded-full" />
          </View>
        </View>
      ))}
    </View>
  </View>
);

export default function ViewAllOrders() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  
  // Date filter states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateFilterMode, setDateFilterMode] = useState<'single' | 'range'>('single');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  // Filter modal
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<string>('all');

  // Get last 30 days orders
  const loadOrders = useCallback(async (forceRefresh = false) => {
    try {
      const user = await AsyncStorage.getItem("user");
      if (!user) {
        router.push("/login");
        return;
      }

      const userConvert = JSON.parse(user);

      // Fetch all data
      const [customersResult, ordersResult, orderDetailsResult, itemsResult] = await Promise.allSettled([
        getAllCustomers(userConvert.uid),
        getAllOrders(userConvert.uid),
        getAllOrderDetails(userConvert.uid),
        getAllItems(userConvert.uid)
      ]);

      // Process results
      const customersArray = customersResult.status === 'fulfilled' ? customersResult.value : [];
      const ordersArray = ordersResult.status === 'fulfilled' ? ordersResult.value : [];
      const detailsArray = orderDetailsResult.status === 'fulfilled' ? orderDetailsResult.value : [];
      const itemsArray = itemsResult.status === 'fulfilled' ? itemsResult.value : [];

      // Create lookup maps
      const customersMap: Record<string, any> = {};
      customersArray.forEach((c: any) => { if (c.id) customersMap[c.id] = c; });

      const itemsMap: Record<string, any> = {};
      itemsArray.forEach((i: any) => { if (i.id) itemsMap[i.id] = i; });

      // Group order details by orderId
      const detailsByOrderId: Record<string, any[]> = {};
      detailsArray.forEach((detail: any) => {
        if (!detailsByOrderId[detail.orderId]) {
          detailsByOrderId[detail.orderId] = [];
        }
        detailsByOrderId[detail.orderId].push({
          ...detail,
          itemName: itemsMap[detail.itemId]?.name || 'Unknown Item'
        });
      });

      // Calculate last 30 days date range
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);

      // Filter and enrich orders
      const last30DaysOrders = ordersArray
        .filter((order: any) => {
          const orderDate = new Date(order.createdAt || order.date);
          return orderDate >= startDate && orderDate <= endDate;
        })
        .map((order: any) => {
          const customer = customersMap[order.customerId];
          const orderDetails = detailsByOrderId[order.id] || [];
          const orderItems = orderDetails.map((detail: any) => ({
            name: detail.itemName,
            price: detail.price,
            quantity: detail.quantity
          }));

          return {
            ...order,
            customerName: customer?.name || 'Walk-in Customer',
            customerPhone: customer?.phone,
            items: orderItems,
            createdAt: order.createdAt || order.date || new Date().toISOString(),
          };
        })
        .sort((a: Order, b: Order) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      setOrders(last30DaysOrders);
      setFilteredOrders(last30DaysOrders);

    } catch (error) {
      console.error("Error loading orders:", error);
      Alert.alert("Error", "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...orders];

    // Apply payment method filter
    if (selectedPaymentFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentMethod === selectedPaymentFilter);
    }

    // Apply date filters
    if (dateFilterMode === 'single' && selectedDate) {
      const filterDate = new Date(selectedDate);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= filterDate && orderDate < nextDay;
      });
    } else if (dateFilterMode === 'range' && startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= start && orderDate <= end;
      });
    }

    setFilteredOrders(filtered);
  }, [orders, selectedDate, startDate, endDate, dateFilterMode, selectedPaymentFilter]);

  // Group orders by date
  const groupedOrders = useMemo(() => {
    const groups: { [key: string]: Order[] } = {};
    
    filteredOrders.forEach(order => {
      const date = new Date(order.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(order);
    });

    // Convert to array and sort by date (newest first)
    return Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(date => ({
        title: date,
        data: groups[date],
        total: groups[date].reduce((sum, order) => sum + order.total, 0)
      }));
  }, [filteredOrders]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalDue = filteredOrders.reduce((sum, order) => sum + (order.dueAmount || 0), 0);
    const cashOrders = filteredOrders.filter(o => o.paymentMethod === 'cash').length;
    const creditOrders = filteredOrders.filter(o => o.paymentMethod === 'credit').length;
    
    return { totalOrders, totalRevenue, totalDue, cashOrders, creditOrders };
  }, [filteredOrders]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedDate(null);
    setStartDate(null);
    setEndDate(null);
    setSelectedPaymentFilter('all');
    setDateFilterMode('single');
    setFilteredOrders(orders);
  }, [orders]);

  // Initial load
  useEffect(() => {
    loadOrders();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    if (orders.length > 0) {
      applyFilters();
    }
  }, [selectedDate, startDate, endDate, selectedPaymentFilter, orders]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    clearFilters();
    loadOrders(true);
  }, [loadOrders, clearFilters]);

  // Format date for display
  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Show loading screen
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="px-6 pt-12 pb-4 bg-white shadow-sm">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Feather name="arrow-left" size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Orders</Text>
          <TouchableOpacity onPress={() => setShowFilterModal(true)} className="p-2">
            <Feather name="filter" size={22} color="#4B5563" />
          </TouchableOpacity>
        </View>
        
        {/* Summary Stats */}
        <View className="flex-row mt-4">
          <View className="flex-1 p-3 mr-1 bg-gray-50 rounded-xl">
            <Text className="text-xs text-gray-500">Orders</Text>
            <Text className="text-lg font-bold text-gray-900">{summary.totalOrders}</Text>
          </View>
          <View className="flex-1 p-3 mx-1 bg-gray-50 rounded-xl">
            <Text className="text-xs text-gray-500">Revenue</Text>
            <Text className="text-lg font-bold text-green-600">Rs {summary.totalRevenue.toLocaleString()}</Text>
          </View>
          <View className="flex-1 p-3 ml-1 bg-gray-50 rounded-xl">
            <Text className="text-xs text-gray-500">Due</Text>
            <Text className="text-lg font-bold text-red-600">Rs {summary.totalDue.toLocaleString()}</Text>
          </View>
        </View>

        {/* Active Filters */}
        {(selectedDate || startDate || selectedPaymentFilter !== 'all') && (
          <View className="flex-row flex-wrap items-center mt-3">
            {selectedDate && (
              <View className="flex-row items-center px-3 py-1 mr-2 bg-blue-100 rounded-full">
                <Feather name="calendar" size={12} color="#1E40AF" />
                <Text className="ml-1 text-xs text-blue-800">{formatDisplayDate(selectedDate)}</Text>
              </View>
            )}
            {startDate && endDate && (
              <View className="flex-row items-center px-3 py-1 mr-2 bg-blue-100 rounded-full">
                <Feather name="calendar" size={12} color="#1E40AF" />
                <Text className="ml-1 text-xs text-blue-800">
                  {formatDisplayDate(startDate)} - {formatDisplayDate(endDate)}
                </Text>
              </View>
            )}
            {selectedPaymentFilter !== 'all' && (
              <View className="px-3 py-1 mr-2 bg-purple-100 rounded-full">
                <Text className="text-xs text-purple-800 capitalize">{selectedPaymentFilter}</Text>
              </View>
            )}
            <TouchableOpacity onPress={clearFilters} className="px-2 py-1">
              <Text className="text-xs text-red-600">Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="mt-auto bg-white rounded-t-3xl">
            <View className="p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-xl font-bold text-gray-900">Filter Orders</Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <Feather name="x" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Date Filter Mode */}
              <Text className="mb-2 text-sm font-medium text-gray-700">Date Range</Text>
              <View className="flex-row mb-4">
                <TouchableOpacity
                  onPress={() => setDateFilterMode('single')}
                  className={`flex-1 py-2 mr-2 rounded-lg ${dateFilterMode === 'single' ? 'bg-gray-800' : 'bg-gray-100'}`}
                >
                  <Text className={`text-center ${dateFilterMode === 'single' ? 'text-white' : 'text-gray-700'}`}>
                    Single Day
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDateFilterMode('range')}
                  className={`flex-1 py-2 ml-2 rounded-lg ${dateFilterMode === 'range' ? 'bg-gray-800' : 'bg-gray-100'}`}
                >
                  <Text className={`text-center ${dateFilterMode === 'range' ? 'text-white' : 'text-gray-700'}`}>
                    Date Range
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Date Pickers */}
              {dateFilterMode === 'single' ? (
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="flex-row items-center p-3 mb-4 border border-gray-200 rounded-xl"
                >
                  <Feather name="calendar" size={20} color="#6B7280" />
                  <Text className="flex-1 ml-2 text-gray-700">
                    {selectedDate ? formatDisplayDate(selectedDate) : 'Select Date'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View className="flex-row mb-4">
                  <TouchableOpacity
                    onPress={() => setShowStartPicker(true)}
                    className="flex-1 p-3 mr-2 border border-gray-200 rounded-xl"
                  >
                    <Text className="text-xs text-gray-500">From</Text>
                    <Text className="text-gray-700">
                      {startDate ? formatDisplayDate(startDate) : 'Start Date'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowEndPicker(true)}
                    className="flex-1 p-3 ml-2 border border-gray-200 rounded-xl"
                  >
                    <Text className="text-xs text-gray-500">To</Text>
                    <Text className="text-gray-700">
                      {endDate ? formatDisplayDate(endDate) : 'End Date'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Payment Method Filter */}
              <Text className="mt-4 mb-2 text-sm font-medium text-gray-700">Payment Method</Text>
              <View className="flex-row flex-wrap mb-6">
                {['all', 'cash', 'credit', 'mixed'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    onPress={() => setSelectedPaymentFilter(method)}
                    className={`px-4 py-2 mr-2 mb-2 rounded-full ${
                      selectedPaymentFilter === method ? 'bg-gray-800' : 'bg-gray-100'
                    }`}
                  >
                    <Text className={selectedPaymentFilter === method ? 'text-white' : 'text-gray-700'}>
                      {method === 'all' ? 'All' : method.charAt(0).toUpperCase() + method.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Apply Button */}
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                className="py-3 bg-gray-800 rounded-xl"
              >
                <Text className="text-lg font-semibold text-center text-white">Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Pickers for iOS/Android */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={(event: any, date?: Date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}
      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          onChange={(event: any, date?: Date) => {
            setShowStartPicker(false);
            if (date) setStartDate(date);
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="default"
          onChange={(event: any, date?: Date) => {
            setShowEndPicker(false);
            if (date) setEndDate(date);
          }}
        />
      )}

      {/* Orders List Grouped by Date */}
      <ScrollView 
        className="flex-1 px-6 mt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#4B5563"]}
            tintColor="#4B5563"
          />
        }
      >
        {filteredOrders.length > 0 ? (
          groupedOrders.map((group, index) => (
            <View key={index} className="mb-6">
              {/* Date Header */}
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Feather name="calendar" size={16} color="#4B5563" />
                  <Text className="ml-2 text-base font-semibold text-gray-700">
                    {new Date(group.title).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
                <View className="px-3 py-1 bg-gray-200 rounded-full">
                  <Text className="text-xs font-medium text-gray-700">
                    {group.data.length} order{group.data.length !== 1 ? 's' : ''} • Rs {group.total.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Orders for this date */}
              {group.data.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </View>
          ))
        ) : (
          <EmptyState onClearFilters={clearFilters} hasFilters={selectedDate !== null || startDate !== null || selectedPaymentFilter !== 'all'} />
        )}
        <View className="h-6" />
      </ScrollView>
    </View>
  );
}

// Order Card Component
const OrderCard = ({ order }: { order: Order }) => {
  const getPaymentBadge = () => {
    switch (order.paymentMethod) {
      case 'cash':
        return { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid', icon: 'check-circle' };
      case 'credit':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Credit', icon: 'clock' };
      case 'mixed':
        return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Partial', icon: 'pie-chart' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unknown', icon: 'help-circle' };
    }
  };

  const badge = getPaymentBadge();
  const timeStr = new Date(order.createdAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <TouchableOpacity className="p-4 mb-3 bg-white shadow-sm rounded-xl">
      {/* Header */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Feather name="user" size={14} color="#6B7280" />
            <Text className="ml-1 text-base font-semibold text-gray-900">
              {order.customerName}
            </Text>
          </View>
          <View className="flex-row items-center mt-1">
            <Feather name="clock" size={12} color="#9CA3AF" />
            <Text className="ml-1 text-xs text-gray-500">{timeStr}</Text>
          </View>
        </View>
        <View className={`flex-row items-center px-2 py-1 rounded-full ${badge.bg}`}>
          <Feather name={badge.icon as any} size={12} color={badge.text === 'text-green-800' ? '#065F46' : badge.text === 'text-yellow-800' ? '#92400E' : '#1E40AF'} />
          <Text className={`ml-1 text-xs font-medium ${badge.text}`}>
            {badge.label}
          </Text>
        </View>
      </View>

      {/* Order ID and Items */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs text-gray-400">
          #{order.id?.slice(0, 8)}
        </Text>
        <Text className="text-xs text-gray-500">
          {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Items Preview */}
      {order.items && order.items.length > 0 && (
        <View className="p-2 mb-2 rounded-lg bg-gray-50">
          {order.items.slice(0, 2).map((item, i) => (
            <View key={i} className="flex-row justify-between py-1">
              <Text className="text-sm text-gray-600">
                {item.quantity}x {item.name}
              </Text>
              <Text className="text-sm font-medium text-gray-700">
                Rs {(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          {order.items.length > 2 && (
            <Text className="mt-1 text-xs text-gray-400">
              +{order.items.length - 2} more items
            </Text>
          )}
        </View>
      )}

      {/* Footer */}
      <View className="flex-row items-center justify-between pt-2 border-t border-gray-100">
        <View>
          <Text className="text-xs text-gray-500">Total Amount</Text>
          <Text className="text-xl font-bold text-gray-900">
            Rs {order.total?.toFixed(2)}
          </Text>
        </View>
        {order.dueAmount ? order.dueAmount > 0 && (
          <View className="flex-row items-center px-3 py-1 rounded-full bg-red-50">
            <Feather name="alert-circle" size={14} color="#DC2626" />
            <Text className="ml-1 text-xs font-medium text-red-600">
              Due: Rs {order.dueAmount.toFixed(2)}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

// Empty State
const EmptyState = ({ onClearFilters, hasFilters }: { onClearFilters: () => void; hasFilters: boolean }) => (
  <View className="items-center justify-center py-12">
    <View className="items-center justify-center w-24 h-24 mb-4 bg-gray-100 rounded-full">
      <Feather name="package" size={48} color="#9CA3AF" />
    </View>
    <Text className="text-lg font-medium text-gray-900">No orders found</Text>
    <Text className="mt-1 text-sm text-center text-gray-500">
      {hasFilters 
        ? "No orders match your filters. Try adjusting them."
        : "No orders in the last 30 days"}
    </Text>
    {hasFilters && (
      <TouchableOpacity
        onPress={onClearFilters}
        className="flex-row items-center px-6 py-3 mt-4 bg-gray-800 rounded-xl"
      >
        <Feather name="x-circle" size={18} color="#FFFFFF" />
        <Text className="ml-2 font-medium text-white">Clear Filters</Text>
      </TouchableOpacity>
    )}
  </View>
);
import { View, Text, ScrollView, Alert, TouchableOpacity, Animated, RefreshControl } from "react-native";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAllUserData } from "@/service/authService";
import { getAllCustomers } from "@/service/customerService";
import { getAllOrders } from "@/service/orderService";
import { getAllOrderDetails } from "@/service/orderDetailService";
import { getAllItems } from "@/service/itemService";
import { Feather } from "@expo/vector-icons";
import ViewAllOrders from "../viewAllOrders";

// Cache keys
const CACHE_KEYS = {
  CUSTOMERS: 'cached_customers',
  ORDERS: 'cached_orders',
  ORDER_DETAILS: 'cached_order_details',
  ITEMS: 'cached_items',
  LAST_FETCH: 'last_fetch_time',
  USER_DETAILS: 'cached_user_details',
  DASHBOARD_DATA: 'cached_dashboard_data'
};

const CACHE_EXPIRY = 5 * 60 * 1000;

// Types
interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

interface OrderDetail {
  id: string;
  orderId: string;
  itemId: string;
  quantity: number;
  price: number;
  itemName?: string;
}

interface Order {
  id: string;
  customerId: string;
  createdAt: string;
  date?: string;
  total: number;
  subtotal?: number;
  paymentMethod: string;
  paymentStatus?: string;
  dueAmount?: number;
  paidAmount?: number;
  discount?: number;
  notes?: string;
  customerName?: string;
  customerPhone?: string;
  items?: Array<{
    name: string;
    price: number;
    quantity: number;
    itemId: string;
  }>;
}

interface SalesData {
  value: number;
  label: string;
  day: Date;
}

// Skeleton Loader Component
const SkeletonLoader = () => {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, []);

  const backgroundColor = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E7EB', '#F3F4F6'],
  });

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="px-6 pt-10 pb-4">
        <Animated.View className="w-48 h-8 rounded-lg" style={{ backgroundColor }} />
        <Animated.View className="w-64 h-4 mt-2 rounded-lg" style={{ backgroundColor }} />
      </View>
      <View className="px-6 mb-6">
        <View className="p-6 bg-gray-400 rounded-3xl">
          <Animated.View className="w-24 h-3 rounded-full" style={{ backgroundColor }} />
          <Animated.View className="w-40 h-10 mt-2 rounded-lg" style={{ backgroundColor }} />
        </View>
      </View>
      <View className="flex-row justify-between px-6 mb-8">
        {[1, 2, 3].map((item) => (
          <View key={item} className="flex-1 p-4 mx-1 bg-white rounded-2xl">
            <Animated.View className="w-16 h-3 rounded-full" style={{ backgroundColor }} />
            <Animated.View className="w-20 h-6 mt-2 rounded-lg" style={{ backgroundColor }} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default function Home() {
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Master data stores
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [items, setItems] = useState<Record<string, Item>>({});
  
  // Processed dashboard data
  const [dashboardData, setDashboardData] = useState({
    todayRevenue: 0,
    todayOrdersCount: 0,
    totalCustomers: 0,
    thisMonthProfit: 0,
    lowStockItems: [] as Item[],
    monthlySalesData: [] as SalesData[],
    todayOrders: [] as Order[],
  });

  // Cache functions
  const saveToCache = useCallback(async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error(`Error saving to cache (${key}):`, error);
    }
  }, []);

  const getFromCache = useCallback(async (key: string) => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > CACHE_EXPIRY) return null;
      return data;
    } catch (error) {
      console.error(`Error reading from cache (${key}):`, error);
      return null;
    }
  }, []);

  const clearOldCache = useCallback(async () => {
    try {
      const keys = Object.values(CACHE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }, []);

  // Populate orders with customer and item details
  const enrichOrders = useCallback((
    rawOrders: Order[],
    customersMap: Record<string, Customer>,
    itemsMap: Record<string, Item>,
    details: OrderDetail[]
  ): Order[] => {
    // Group order details by orderId
    const detailsByOrderId: Record<string, OrderDetail[]> = {};
    details.forEach(detail => {
      if (!detailsByOrderId[detail.orderId]) {
        detailsByOrderId[detail.orderId] = [];
      }
      // Add item name to detail
      detailsByOrderId[detail.orderId].push({
        ...detail,
        itemName: itemsMap[detail.itemId]?.name || 'Unknown Item'
      });
    });

    return rawOrders.map(order => {
      // Add customer details
      const customer = customersMap[order.customerId];
      
      // Get order details for this order and convert to items array
      const orderDetails = detailsByOrderId[order.id] || [];
      const orderItems = orderDetails.map(detail => ({
        name: detail.itemName || itemsMap[detail.itemId]?.name || 'Unknown Item',
        price: detail.price,
        quantity: detail.quantity,
        itemId: detail.itemId
      }));

      return {
        ...order,
        customerName: customer?.name || 'Walk-in Customer',
        customerPhone: customer?.phone,
        items: orderItems,
        createdAt: order.createdAt || order.date || new Date().toISOString(),
      };
    });
  }, []);

  // Process dashboard data with enriched orders
  const processDashboardData = useCallback((
    rawOrders: Order[],
    customersMap: Record<string, Customer>,
    itemsMap: Record<string, Item>,
    details: OrderDetail[]
  ) => {
    // First enrich orders with all details
    const enrichedOrders = enrichOrders(rawOrders, customersMap, itemsMap, details);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Today's orders (filter and sort by latest)
    const todayOrdersData = enrichedOrders
      .filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= today && orderDate <= todayEnd;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log(`Found ${todayOrdersData.length} orders for today`);

    // Today's revenue
    const todayRev = todayOrdersData.reduce((sum, order) => sum + (order.total || 0), 0);

    // This month's profit
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    const thisMonthOrders = enrichedOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear;
    });

    const monthRevenue = thisMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const profit = monthRevenue * 0.3;

    // Low stock items
    const lowStock = Object.values(itemsMap)
      .filter(item => (item.quantity || 0) < 5)
      .slice(0, 5);

    // Weekly sales data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();

    const salesData = last7Days.map(date => {
      const dayStart = date;
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOrders = enrichedOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });

      return {
        value: dayOrders.reduce((sum, order) => sum + (order.total || 0), 0),
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        day: date,
      };
    });

    return {
      todayRevenue: todayRev,
      todayOrdersCount: todayOrdersData.length,
      totalCustomers: Object.keys(customersMap).length,
      thisMonthProfit: profit,
      lowStockItems: lowStock,
      monthlySalesData: salesData,
      todayOrders: todayOrdersData.slice(0, 3),
    };
  }, [enrichOrders]);

  // Fetch all data from API
  const fetchFreshData = useCallback(async (userId: string) => {
    try {
      console.log("Fetching fresh data for user:", userId);
      
      // Fetch all data in parallel
      const [customersResult, ordersResult, orderDetailsResult, itemsResult] = await Promise.allSettled([
        getAllCustomers(userId),
        getAllOrders(userId),
        getAllOrderDetails(userId),
        getAllItems(userId)
      ]);

      // Process results
      const customersArray = customersResult.status === 'fulfilled' ? customersResult.value : [];
      const ordersArray = ordersResult.status === 'fulfilled' ? ordersResult.value : [];
      const detailsArray = orderDetailsResult.status === 'fulfilled' ? orderDetailsResult.value : [];
      const itemsArray = itemsResult.status === 'fulfilled' ? itemsResult.value : [];

      console.log(`Fetched: ${customersArray.length} customers, ${ordersArray.length} orders, ${detailsArray.length} order details, ${itemsArray.length} items`);

      // Create maps
      const customersMap: Record<string, Customer> = {};
      customersArray.forEach((c: Customer) => { 
        if (c.id) customersMap[c.id] = c; 
      });

      const itemsMap: Record<string, Item> = {};
      itemsArray.forEach((i: Item) => { 
        if (i.id) itemsMap[i.id] = i; 
      });

      // Save to cache
      await Promise.all([
        saveToCache(CACHE_KEYS.CUSTOMERS, customersMap),
        saveToCache(CACHE_KEYS.ORDERS, ordersArray),
        saveToCache(CACHE_KEYS.ORDER_DETAILS, detailsArray),
        saveToCache(CACHE_KEYS.ITEMS, itemsMap),
        saveToCache(CACHE_KEYS.LAST_FETCH, Date.now())
      ]);

      return { customersMap, ordersArray, detailsArray, itemsMap };
    } catch (error) {
      console.error("Error fetching fresh data:", error);
      throw error;
    }
  }, [saveToCache]);

  // Load dashboard data with caching
  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    try {
      const user = await AsyncStorage.getItem("user");
      if (!user) {
        router.push("/login");
        return;
      }

      const userConvert = JSON.parse(user);
      
      // Get user data
      const userData = await getAllUserData(userConvert.uid);
      await AsyncStorage.setItem("userDetails", JSON.stringify(userData));
      
      let customersMap, ordersArray, detailsArray, itemsMap;

      if (!forceRefresh) {
        // Try to get from cache first
        [customersMap, ordersArray, detailsArray, itemsMap] = await Promise.all([
          getFromCache(CACHE_KEYS.CUSTOMERS),
          getFromCache(CACHE_KEYS.ORDERS),
          getFromCache(CACHE_KEYS.ORDER_DETAILS),
          getFromCache(CACHE_KEYS.ITEMS)
        ]);
      }

      // If cache miss or force refresh, fetch fresh data
      if (!customersMap || !ordersArray || !detailsArray || !itemsMap || forceRefresh) {
        const freshData = await fetchFreshData(userConvert.uid);
        customersMap = freshData.customersMap;
        ordersArray = freshData.ordersArray;
        detailsArray = freshData.detailsArray;
        itemsMap = freshData.itemsMap;
      }

      // Store in state
      setCustomers(customersMap || {});
      setItems(itemsMap || {});

      // Process and set dashboard data
      const processed = processDashboardData(
        ordersArray || [], 
        customersMap || {}, 
        itemsMap || {},
        detailsArray || []
      );
      
      // Save processed dashboard data to cache
      await saveToCache(CACHE_KEYS.DASHBOARD_DATA, processed);
      await saveToCache(CACHE_KEYS.USER_DETAILS, userData);
      
      setUserDetails(userData);
      setDashboardData(processed);

      // Log sample order to verify data
      if (processed.todayOrders.length > 0) {
        console.log('Sample order with items:', JSON.stringify(processed.todayOrders[0], null, 2));
      }

    } catch (error) {
      console.error("Error loading dashboard:", error);
      Alert.alert("Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [processDashboardData, fetchFreshData, getFromCache, saveToCache]);

  // Initial load
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      // Try to load cached dashboard data first for instant display
      const cachedDashboard = await getFromCache(CACHE_KEYS.DASHBOARD_DATA);
      const cachedUser = await getFromCache(CACHE_KEYS.USER_DETAILS);
      
      if (isMounted && cachedDashboard && cachedUser) {
        setUserDetails(cachedUser);
        setDashboardData(cachedDashboard);
        setLoading(false);
        
        // Refresh in background
        loadDashboardData(true).catch(console.error);
      } else {
        // No cache, load fresh
        await loadDashboardData(false);
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await clearOldCache();
    await loadDashboardData(true);
  }, [loadDashboardData, clearOldCache]);

  // Memoized calculations
  const maxValue = useMemo(() => {
    const { monthlySalesData } = dashboardData;
    return monthlySalesData.length > 0 
      ? Math.max(...monthlySalesData.map(item => item.value))
      : 1000;
  }, [dashboardData.monthlySalesData]);

  const chartStats = useMemo(() => {
    const { monthlySalesData } = dashboardData;
    if (monthlySalesData.length === 0) {
      return { highest: 0, average: 0, total: 0 };
    }
    
    const values = monthlySalesData.map(item => item.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    
    return {
      highest: Math.max(...values),
      average: Math.round(total / values.length),
      total,
    };
  }, [dashboardData.monthlySalesData]);

  if (loading && !refreshing) {
    return <SkeletonLoader />;
  }

  const { 
    todayRevenue, 
    todayOrdersCount, 
    totalCustomers, 
    thisMonthProfit,
    lowStockItems,
    monthlySalesData,
    todayOrders 
  } = dashboardData;

  return (
    <ScrollView 
      className="flex-1 bg-gray-100" 
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
      {/* Welcome Section */}
      <View className="px-6 pt-10 pb-4">
        <Text className="text-2xl font-bold text-gray-900">
          Welcome, {userDetails?.name ?? "User"}
        </Text>
        <Text className="mt-1 text-sm text-gray-500">
          {refreshing ? "Refreshing..." : "Here's what's happening in your business today"}
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
            <Text className="ml-2 font-semibold text-green-400">
              {todayOrdersCount} Order{todayOrdersCount !== 1 ? 's' : ''} Today
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View className="flex-row justify-between px-6 mb-8">
        <StatCard label="Today Orders" value={todayOrdersCount.toString()} />
        <StatCard label="Customers" value={totalCustomers.toString()} />
        <StatCard 
          label="Month Profit" 
          value={`Rs ${Math.round(thisMonthProfit).toLocaleString()}`} 
        />
      </View>

      {/* Analytics Chart */}
      <View className="px-6 mb-8">
        <View className="p-6 bg-white shadow-sm rounded-2xl">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-lg font-bold text-gray-900">Weekly Sales Trend</Text>
            <View className="px-3 py-1 bg-gray-500 rounded-full">
              <Text className="text-xs font-semibold text-white">Last 7 days</Text>
            </View>
          </View>
          
          {monthlySalesData.length > 0 ? (
            <View>
              {/* Bar Chart */}
              <View className="flex-row items-end justify-between h-20 mb-4">
                {monthlySalesData.map((item, index) => {
                  const barHeight = maxValue > 0 
                    ? Math.max(10, (item.value / maxValue) * 70) 
                    : 10;
                  
                  return (
                    <View key={index} className="items-center">
                      <View 
                        className="w-6 bg-gray-900 rounded-t-full"
                        style={{ height: barHeight }}
                      />
                      <Text className="mt-2 text-xs text-gray-500">{item.label}</Text>
                    </View>
                  );
                })}
              </View>
              
              {/* Chart Stats */}
              <View className="flex-row justify-between p-4 rounded-lg bg-gray-50">
                <StatItem label="Highest" value={`Rs ${chartStats.highest.toLocaleString()}`} />
                <StatItem label="Average" value={`Rs ${chartStats.average.toLocaleString()}`} />
                <StatItem label="Total" value={`Rs ${chartStats.total.toLocaleString()}`} />
              </View>
            </View>
          ) : (
            <EmptyChartState />
          )}
        </View>
      </View>

      {/* Stock Alerts */}
      {lowStockItems.length > 0 && (
        <StockAlerts items={lowStockItems} />
      )}

      {/* Today's Orders */}
      <View className="px-6 mb-10">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-bold text-gray-900">Latest Orders</Text>
        </View>

        {todayOrders.length > 0 ? (
          <View>
            <OrdersList orders={todayOrders} />
            
            {/* View All Orders Button */}
            <TouchableOpacity 
              className="flex-row items-center justify-center py-3 mt-4 bg-gray-800 rounded-xl"
              onPress={() => router.push("/viewAllOrders")}
              activeOpacity={0.7}
            >
              <Text className="ml-2 text-base font-semibold text-white">
                View All Orders
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <EmptyOrdersState />
        )}
      </View>
    </ScrollView>
  );
}

// Sub-components
const StatCard = React.memo(({ label, value }: { label: string; value: string }) => (
  <View className="flex-1 p-4 mx-1 bg-white shadow-sm rounded-2xl">
    <Text className="text-xs text-gray-400">{label}</Text>
    <Text className="mt-1 text-xl font-bold text-gray-900">{value}</Text>
  </View>
));

const StatItem = React.memo(({ label, value }: { label: string; value: string }) => (
  <View>
    <Text className="text-xs text-gray-500">{label}</Text>
    <Text className="font-bold text-gray-900">{value}</Text>
  </View>
));

const EmptyChartState = React.memo(() => (
  <View className="items-center justify-center h-40">
    <Feather name="bar-chart-2" size={48} color="#D1D5DB" />
    <Text className="mt-3 text-gray-400">No sales data available</Text>
    <Text className="mt-1 text-sm text-gray-400">Start selling to see analytics</Text>
  </View>
));

const StockAlerts = React.memo(({ items }: { items: Item[] }) => (
  <View className="px-6 mb-8">
    <View className="flex-row items-center justify-between mb-4">
      <Text className="text-lg font-bold text-gray-900">Stock Alerts</Text>
      <Text className="text-sm text-red-600">
        {items.length} alert{items.length !== 1 ? 's' : ''}
      </Text>
    </View>

    {items.map((item, index) => (
      <StockAlertItem key={index} item={item} />
    ))}
  </View>
));

const StockAlertItem = React.memo(({ item }: { item: Item }) => {
  const isOutOfStock = item.quantity === 0;
  
  return (
    <View 
      className={`p-4 mb-3 ${isOutOfStock ? 'bg-red-50' : 'bg-yellow-50'} shadow-sm rounded-2xl`}
    >
      <View className="flex-row items-center">
        <View className="items-center justify-center w-10 h-10 mr-4 bg-white rounded-full">
          <Feather 
            name={isOutOfStock ? "alert-circle" : "alert-triangle"} 
            size={20} 
            color={isOutOfStock ? "#DC2626" : "#D97706"} 
          />
        </View>
        <View className="flex-1">
          <Text className={`font-medium ${isOutOfStock ? 'text-red-800' : 'text-yellow-800'}`}>
            {isOutOfStock ? 'Out of stock' : 'Low stock'}: {item.name}
          </Text>
          <Text className={`text-sm ${isOutOfStock ? 'text-red-600' : 'text-yellow-600'}`}>
            Quantity: {item.quantity || 0}
          </Text>
        </View>
      </View>
    </View>
  );
});

const OrdersList = React.memo(({ orders }: { orders: Order[] }) => (
  <View className="bg-white shadow-sm rounded-2xl">
    {orders.map((order, index) => (
      <OrderItem key={order.id || index} order={order} index={index} />
    ))}
  </View>
));

const OrderItem = React.memo(({ order, index }: { order: Order; index: number }) => {
  return (
    <View className={`p-4 ${index < 2 ? 'border-b border-gray-100' : ''}`}>
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
            Order #{order.id?.slice(0, 8)}
          </Text>
          <Text className="text-xs text-gray-400">
            {new Date(order.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>

      {/* Items Sold */}
      <View className="mb-3">
        <Text className="mb-1 text-sm font-medium text-gray-700">Items:</Text>
        {order.items && order.items.length > 0 ? (
          <View>
            {order.items.slice(0, 2).map((item, i) => (
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
          <Text className="text-sm text-gray-500">No items in this order</Text>
        )}
      </View>

      {/* Payment Status and Total */}
      <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
        <PaymentStatus order={order} />
        <OrderTotal order={order} />
      </View>
    </View>
  );
});

const PaymentStatus = React.memo(({ order }: { order: Order }) => {
  const getStatusStyles = () => {
    switch (order.paymentMethod) {
      case 'cash':
        return { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' };
      case 'credit':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Credit' };
      case 'mixed':
        return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Partial' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unknown' };
    }
  };

  const styles = getStatusStyles();

  return (
    <View className="flex-row items-center">
      <View className={`px-3 py-1 rounded-full ${styles.bg}`}>
        <Text className={`text-xs font-medium ${styles.text}`}>
          {styles.label}
        </Text>
      </View>
      {order.dueAmount ? order.dueAmount > 0 && (
        <Text className="ml-2 text-xs text-red-600">
          Due: Rs {order.dueAmount.toFixed(2)}
        </Text>
      ) : null}
    </View>
  );
});

const OrderTotal = React.memo(({ order }: { order: Order }) => (
  <View className="items-end">
    <Text className="text-lg font-bold text-gray-900">
      Rs {order.total?.toFixed(2) || '0.00'}
    </Text>
    <Text className="text-xs text-gray-500">
      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
    </Text>
  </View>
));

const EmptyOrdersState = React.memo(() => (
  <View className="items-center justify-center p-8 bg-white shadow-sm rounded-2xl">
    <Feather name="shopping-bag" size={48} color="#D1D5DB" />
    <Text className="mt-3 text-lg font-medium text-gray-400">No orders today</Text>
    <Text className="mt-1 text-gray-400">Start selling to see orders here</Text>
  </View>
));
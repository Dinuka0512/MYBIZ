import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  FlatList,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

// Import services
import { getAllCustomers } from "@/service/customerService";
import { getAllItems } from "@/service/itemService";
import { completeOrder } from "@/service/orderService";
import { generateAndUploadPDF } from "@/util/pdfGenarat&Uploader";

const sales = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  
  // Order Details
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);
  const [orderNotes, setOrderNotes] = useState("");

  // Payment Details
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'mixed'>('cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [dueAmount, setDueAmount] = useState(0);

  // Modals
  const [customerModal, setCustomerModal] = useState(false);
  const [addItemModal, setAddItemModal] = useState(false);
  const [itemSearch, setItemSearch] = useState("");

  // States for new item
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  // Refs
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /* ---------------- LOAD/RELOAD DATA FUNCTION ---------------- */
  const loadData = async () => {
    setIsLoading(true);
    
    try {
      const stored = await AsyncStorage.getItem("userDetails");
      if (!stored) {
        router.replace("/login");
        return;
      }

      const user = JSON.parse(stored);
      setUserDetails(user);
      
      // Load customers and items
      const [customersList, itemsList] = await Promise.all([
        getAllCustomers(user.uid),
        getAllItems(user.uid)
      ]);
      
      setCustomers(customersList);
      setItems(itemsList);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------- INITIAL LOAD ---------------- */
  useEffect(() => {
    loadData();
    
    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  /* ---------------- CALCULATE TOTALS & PAYMENTS ---------------- */
  useEffect(() => {
    let sub = 0;
    orderItems.forEach(item => {
      sub += item.price * item.quantity;
    });
    setSubTotal(sub);
    const calculatedTotal = sub - discount;
    setTotal(calculatedTotal);
    
    // Calculate due amount based on payment method
    if (paymentMethod === 'cash') {
      setPaidAmount(calculatedTotal);
      setDueAmount(0);
    } else if (paymentMethod === 'credit') {
      setPaidAmount(0);
      setDueAmount(calculatedTotal);
    }
  }, [orderItems, discount, paymentMethod]);

  // Update due amount when paid amount changes (for mixed payment)
  useEffect(() => {
    if (paymentMethod === 'mixed') {
      const calculatedDue = Math.max(0, total - paidAmount);
      setDueAmount(calculatedDue);
    }
  }, [paidAmount, total, paymentMethod]);

  /* ---------------- CUSTOMER SELECTION ---------------- */
  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerModal(false);
  };

  /* ---------------- ITEM SELECTION ---------------- */
  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    setItemPrice(item.price);
    setItemQuantity(1);
  };

  /* ---------------- ADD ITEM TO CART ---------------- */
  const handleAddToCart = () => {
    if (!selectedItem) {
      Alert.alert("Error", "Please select an item first");
      return;
    }

    if (itemQuantity < 1) {
      Alert.alert("Error", "Quantity must be at least 1");
      return;
    }

    if (itemQuantity > selectedItem.quantity) {
      Alert.alert("Error", `Only ${selectedItem.quantity} items available in stock`);
      return;
    }

    // Check if item already exists in cart
    const existingItemIndex = orderItems.findIndex(
      item => item.id === selectedItem.id
    );

    if (existingItemIndex > -1) {
      // Update quantity
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += itemQuantity;
      setOrderItems(updatedItems);
    } else {
      // Add new item
      const newItem = {
        id: selectedItem.id,
        name: selectedItem.name,
        price: itemPrice,
        quantity: itemQuantity,
        availableStock: selectedItem.quantity,
      };
      setOrderItems([...orderItems, newItem]);
    }

    // Reset and close modal
    setSelectedItem(null);
    setItemQuantity(1);
    setAddItemModal(false);
    setItemSearch("");
  };

  /* ---------------- UPDATE CART ITEM ---------------- */
  const updateCartItemQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      // Remove item if quantity is 0
      removeCartItem(id);
      return;
    }

    const updatedItems = orderItems.map(item => {
      if (item.id === id) {
        // Check stock limit
        if (newQuantity > item.availableStock) {
          Alert.alert("Error", `Only ${item.availableStock} items available in stock`);
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    
    setOrderItems(updatedItems);
  };

  /* ---------------- REMOVE CART ITEM ---------------- */
  const removeCartItem = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  /* ---------------- CLEAR CART ---------------- */
  const handleClearCart = () => {
    Alert.alert(
      "Clear Cart",
      "Are you sure you want to clear all items from cart?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            setOrderItems([]);
            setDiscount(0);
          },
        },
      ]
    );
  };

  /* ---------------- RESET FORM ---------------- */
  const resetForm = () => {
    setSelectedCustomer(null);
    setOrderItems([]);
    setDiscount(0);
    setOrderNotes("");
    setPaymentMethod('cash');
    setPaidAmount(0);
    setDueAmount(0);
    setItemSearch("");
  };

  /* ---------------- PLACE ORDER ---------------- */
  const handlePlaceOrder = async () => {
    if (!selectedCustomer) {
      Alert.alert("Error", "Please select a customer");
      return;
    }

    if (orderItems.length === 0) {
      Alert.alert("Error", "Please add at least one item to cart");
      return;
    }

    // Validation for mixed payment
    if (paymentMethod === 'mixed' && paidAmount <= 0) {
      Alert.alert("Error", "Please enter paid amount for mixed payment");
      return;
    }

    if (paymentMethod === 'mixed' && paidAmount > total) {
      Alert.alert("Error", "Paid amount cannot exceed total amount");
      return;
    }

    // Check stock availability
    for (const item of orderItems) {
      if (item.quantity > item.availableStock) {
        Alert.alert("Error", `${item.name} exceeds available stock (${item.availableStock} available)`);
        return;
      }
    }

    // Prepare order data
    const orderData = {
      subtotal: subTotal,
      discount: discount,
      total: total,
      paidAmount: paymentMethod === 'cash' ? total : paidAmount,
      dueAmount: dueAmount,
      paymentMethod: paymentMethod,
      notes: orderNotes,
    };

    // Show confirmation with payment details
    const paymentDetails = paymentMethod === 'cash' 
      ? `Full Payment: Rs ${total.toFixed(2)}`
      : paymentMethod === 'credit'
      ? `Credit Sale: Rs ${total.toFixed(2)} (Pay Later)`
      : `Mixed Payment: Rs ${paidAmount.toFixed(2)} Paid, Rs ${dueAmount.toFixed(2)} Due`;

    Alert.alert(
      "Confirm Order",
      `Customer: ${selectedCustomer.name}\n\n` +
      `${paymentDetails}\n\n` +
      `Items: ${orderItems.length}\n` +
      `Subtotal: Rs ${subTotal.toFixed(2)}\n` +
      `Discount: Rs ${discount.toFixed(2)}\n` +
      `Total: Rs ${total.toFixed(2)}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Place Order",
          onPress: async () => {
            setIsPlacingOrder(true);
            try {
              // Get user ID
              const stored = await AsyncStorage.getItem("userDetails");
              if (!stored) {
                router.replace("/login");
                return;
              }
              const user = JSON.parse(stored);
              
              // Complete the order
              const orderId = await completeOrder(
                user.uid,
                selectedCustomer.id,
                orderItems.map(item => ({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  quantity: item.quantity
                })),
                orderData
              );
              
              if (orderId) {
                // Prepare data for PDF
                const saleData = {
                  invoiceNumber: orderId,
                  customerName: selectedCustomer.name,
                  customerPhone: selectedCustomer.phone || '',
                  customerAddress: selectedCustomer.address || '',
                  items: orderItems,
                  paymentMethod: paymentMethod,
                  paidAmount: paymentMethod === 'cash' ? total : paidAmount,
                  dueAmount: dueAmount,
                  cashierName: userDetails?.name || 'Cashier'
                };

                // Generate PDF and upload to Cloudinary
                const result = await generateAndUploadPDF(saleData);
                
                if (result.success) {
                  console.log('PDF uploaded to Cloudinary:', result.cloudinaryUrl);
                  
                  const successMessage = paymentMethod === 'cash'
                    ? `Order #${orderId} placed successfully!\nInvoice saved to cloud.\nCash payment of Rs ${total.toFixed(2)} received.`
                    : paymentMethod === 'credit'
                    ? `Order #${orderId} placed!\nInvoice saved to cloud.\nCustomer owes Rs ${dueAmount.toFixed(2)}`
                    : `Order #${orderId} placed!\nInvoice saved to cloud.\nPaid: Rs ${paidAmount.toFixed(2)}, Due: Rs ${dueAmount.toFixed(2)}`;
                  
                  Alert.alert(
                    "Success", 
                    successMessage,
                    [
                      { 
                        text: "OK", 
                        onPress: async () => {
                          resetForm();
                          await loadData();
                        }
                      }
                    ]
                  );
                } else {
                  Alert.alert(
                    "Success", 
                    `Order #${orderId} placed, but PDF upload failed.`,
                    [
                      { 
                        text: "OK", 
                        onPress: async () => {
                          resetForm();
                          await loadData();
                        }
                      }
                    ]
                  );
                }
              }
            } catch (error) {
              console.error("Order placement error:", error);
              Alert.alert("Error", "Failed to place order. Please try again.");
            } finally {
              setIsPlacingOrder(false);
            }
          },
        },
      ]
    );
  };

  /* ---------------- FILTER ITEMS FOR SEARCH ---------------- */
  const filteredItems = itemSearch.trim() === "" 
    ? items 
    : items.filter(item => 
        item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
        item.description?.toLowerCase().includes(itemSearch.toLowerCase())
      );

  /* ================= UI ================= */
  if (isLoading) {
    return (
      <View className="items-center justify-center flex-1 bg-gray-100">
        <ActivityIndicator size="large" color="#4B5563" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 px-6 pt-10 bg-gray-100" showsVerticalScrollIndicator={false}>
      {/* Customer Selection Card */}
      <View className="p-4 mb-4 bg-white shadow-sm rounded-2xl">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-gray-800">Customer</Text>
          <TouchableOpacity
            onPress={() => setCustomerModal(true)}
            className="flex-row items-center px-3 py-2 bg-gray-100 rounded-lg"
            activeOpacity={0.8}
          >
            <Feather name="user-plus" size={16} color="#4B5563" />
            <Text className="ml-2 text-sm font-medium text-gray-700">
              {selectedCustomer ? "Change" : "Select Customer"}
            </Text>
          </TouchableOpacity>
        </View>

        {selectedCustomer ? (
          <View className="p-3 bg-gray-50 rounded-xl">
            <View className="flex-row justify-between">
              <View>
                <Text className="font-semibold text-gray-900">{selectedCustomer.name}</Text>
                <Text className="text-sm text-gray-500">{selectedCustomer.phone}</Text>
                {selectedCustomer.balance > 0 && (
                  <Text className="mt-1 text-sm text-orange-600">
                    Current Balance: Rs {selectedCustomer.balance.toFixed(2)}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setSelectedCustomer(null)}
                className="p-1"
                activeOpacity={0.7}
              >
                <Feather name="x" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="items-center justify-center py-4">
            <Feather name="user" size={32} color="#9CA3AF" />
            <Text className="mt-2 text-gray-500">No customer selected</Text>
            <Text className="text-sm text-gray-400">Tap "Select Customer" to choose</Text>
          </View>
        )}
      </View>

      {/* Order Items Section */}
      <View className="p-4 mb-4 bg-white shadow-sm rounded-2xl">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-gray-800">Order Items</Text>
          <TouchableOpacity
            onPress={() => setAddItemModal(true)}
            className="flex-row items-center px-4 py-2 bg-gray-800 rounded-lg"
            activeOpacity={0.8}
          >
            <Feather name="plus" size={16} color="white" />
            <Text className="ml-2 text-sm font-semibold text-white">Add Item</Text>
          </TouchableOpacity>
        </View>

        {/* Cart Items List */}
        {orderItems.length > 0 ? (
          <View className="mb-4">
            {orderItems.map((item, index) => (
              <CartItemCard
                key={item.id}
                item={item}
                index={index}
                onUpdateQuantity={updateCartItemQuantity}
                onRemove={removeCartItem}
              />
            ))}
            
            <TouchableOpacity
              onPress={handleClearCart}
              className="flex-row items-center justify-center py-2 mt-2 rounded-lg bg-red-50"
              activeOpacity={0.7}
            >
              <Feather name="trash-2" size={16} color="#DC2626" />
              <Text className="ml-2 text-sm font-medium text-red-600">Clear All Items</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="items-center justify-center py-6">
            <Feather name="shopping-bag" size={40} color="#D1D5DB" />
            <Text className="mt-3 text-lg font-medium text-gray-400">Cart is Empty</Text>
            <Text className="mt-1 text-gray-400">Add items to create an order</Text>
          </View>
        )}
      </View>

      {/* Order Summary Section */}
      <View className="p-4 mb-4 bg-white shadow-sm rounded-2xl">
        <Text className="mb-4 text-lg font-semibold text-gray-800">Order Summary</Text>
        
        {/* Subtotal */}
        <View className="flex-row justify-between py-2">
          <Text className="text-gray-600">Subtotal</Text>
          <Text className="font-medium">Rs {subTotal.toFixed(2)}</Text>
        </View>

        {/* Discount */}
        <View className="flex-row justify-between py-2">
          <Text className="text-gray-600">Discount</Text>
          <View className="flex-row items-center">
            <TextInput
              value={discount ? String(discount) : ""}
              onChangeText={t => setDiscount(Number(t) || 0)}
              placeholder="0"
              keyboardType="numeric"
              className="w-20 font-medium text-right"
            />
            <Text className="ml-1 text-gray-400">Rs</Text>
          </View>
        </View>

        {/* Divider */}
        <View className="my-2 border-t border-gray-200" />

        {/* Total */}
        <View className="flex-row justify-between py-2 mb-4">
          <Text className="text-lg font-semibold text-gray-800">Total</Text>
          <Text className="text-xl font-bold text-gray-900">Rs {total.toFixed(2)}</Text>
        </View>

        {/* Payment Method Selection */}
        <View className="mb-4">
          <Text className="mb-3 text-sm font-medium text-gray-700">Payment Method</Text>
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => setPaymentMethod('cash')}
              className={`flex-1 py-3 rounded-lg border ${paymentMethod === 'cash' ? 'bg-green-50 border-green-500' : 'bg-gray-100 border-gray-200'}`}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-center">
                <Feather name="dollar-sign" size={16} color={paymentMethod === 'cash' ? '#059669' : '#6B7280'} />
                <Text className={`ml-2 text-center font-medium ${paymentMethod === 'cash' ? 'text-green-700' : 'text-gray-600'}`}>
                  Pay Now
                </Text>
              </View>
              <Text className="mt-1 text-xs text-center text-gray-500">Full Cash</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setPaymentMethod('credit')}
              className={`flex-1 py-3 rounded-lg border ${paymentMethod === 'credit' ? 'bg-blue-50 border-blue-500' : 'bg-gray-100 border-gray-200'}`}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-center">
                <Feather name="credit-card" size={16} color={paymentMethod === 'credit' ? '#2563EB' : '#6B7280'} />
                <Text className={`ml-2 text-center font-medium ${paymentMethod === 'credit' ? 'text-blue-700' : 'text-gray-600'}`}>
                  Pay Later
                </Text>
              </View>
              <Text className="mt-1 text-xs text-center text-gray-500">Full Credit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setPaymentMethod('mixed')}
              className={`flex-1 py-3 rounded-lg border ${paymentMethod === 'mixed' ? 'bg-purple-50 border-purple-500' : 'bg-gray-100 border-gray-200'}`}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-center">
                <Feather name="divide" size={16} color={paymentMethod === 'mixed' ? '#7C3AED' : '#6B7280'} />
                <Text className={`ml-2 text-center font-medium ${paymentMethod === 'mixed' ? 'text-purple-700' : 'text-gray-600'}`}>
                  Partial
                </Text>
              </View>
              <Text className="mt-1 text-xs text-center text-gray-500">Mixed</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Paid Amount Input (show only for cash or mixed) */}
        {(paymentMethod === 'cash' || paymentMethod === 'mixed') && (
          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-gray-700">
              {paymentMethod === 'cash' ? 'Paid Amount' : 'Amount Paid Now'}
            </Text>
            <View className="flex-row items-center px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
              <Text className="mr-2 text-gray-500">Rs</Text>
              <TextInput
                value={paymentMethod === 'cash' ? String(total) : String(paidAmount)}
                onChangeText={t => setPaidAmount(Number(t) || 0)}
                placeholder="0"
                keyboardType="numeric"
                className="flex-1 text-lg font-medium text-gray-800"
                editable={paymentMethod === 'mixed'}
                selectTextOnFocus={paymentMethod === 'mixed'}
              />
              {paymentMethod === 'mixed' && (
                <Text className="ml-2 text-sm text-gray-500">
                  of Rs {total.toFixed(2)}
                </Text>
              )}
            </View>
            {paymentMethod === 'mixed' && paidAmount > total && (
              <Text className="mt-1 text-sm text-red-600">
                Paid amount cannot exceed total
              </Text>
            )}
          </View>
        )}

        {/* Due Amount Display */}
        <View className="p-3 rounded-lg" style={{
          backgroundColor: dueAmount > 0 ? '#FFFBEB' : '#F0FDF4',
          borderWidth: 1,
          borderColor: dueAmount > 0 ? '#FDE68A' : '#BBF7D0'
        }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Feather 
                name={dueAmount > 0 ? "clock" : "check-circle"} 
                size={20} 
                color={dueAmount > 0 ? '#F59E0B' : '#10B981'} 
              />
              <Text className={`ml-2 font-medium ${dueAmount > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                {dueAmount > 0 ? 'Amount Due' : 'Fully Paid'}
              </Text>
            </View>
            <Text className={`text-xl font-bold ${dueAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              Rs {dueAmount.toFixed(2)}
            </Text>
          </View>
          <Text className="mt-1 text-sm" style={{
            color: dueAmount > 0 ? '#B45309' : '#065F46'
          }}>
            {dueAmount > 0 
              ? `Customer will owe: Rs ${dueAmount.toFixed(2)}`
              : 'No pending balance'}
          </Text>
        </View>
      </View>

      {/* Order Notes */}
      <View className="p-4 mb-6 bg-white shadow-sm rounded-2xl">
        <Text className="mb-3 text-lg font-semibold text-gray-800">Order Notes</Text>
        <TextInput
          value={orderNotes}
          onChangeText={setOrderNotes}
          placeholder="Add any notes for this order..."
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base focus:border-gray-400 min-h-[80px]"
        />
      </View>

      {/* Action Buttons */}
      <View className="flex-row space-x-4 mb-14">
        <TouchableOpacity
          onPress={resetForm}
          className="items-center flex-1 py-4 bg-gray-200 rounded-xl"
          activeOpacity={0.8}
          disabled={isPlacingOrder}
        >
          <Text className="text-base font-semibold text-gray-800">Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePlaceOrder}
          className="items-center flex-1 py-4 bg-gray-800 shadow-sm rounded-xl shadow-gray-700/30"
          activeOpacity={0.9}
          disabled={!selectedCustomer || orderItems.length === 0 || isPlacingOrder}
          style={{ opacity: (!selectedCustomer || orderItems.length === 0 || isPlacingOrder) ? 0.5 : 1 }}
        >
          {isPlacingOrder ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <View className="flex-row items-center">
                <Feather name="shopping-cart" size={20} color="white" />
                <Text className="ml-2 text-base font-semibold text-white">
                  {dueAmount > 0 ? 'Create Invoice' : 'Complete Sale'}
                </Text>
              </View>
              <Text className="mt-1 text-sm text-gray-300">
                {paymentMethod === 'cash' ? 'Full Payment' : 
                 paymentMethod === 'credit' ? 'Credit Sale' : 
                 `Rs ${paidAmount.toFixed(2)} Paid`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* =============== MODALS =============== */}

      {/* Customer Selection Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={customerModal}
        onRequestClose={() => setCustomerModal(false)}
      >
        <View className="justify-end flex-1 bg-black/50">
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10 max-h-[85%] shadow-2xl">
            
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-gray-900">
                Select Customer
              </Text>
              <TouchableOpacity 
                onPress={() => setCustomerModal(false)}
                hitSlop={12}
              >
                <Feather name="x" size={26} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {/* Customer List */}
            {isLoadingCustomers ? (
              <View className="items-center justify-center py-10">
                <ActivityIndicator size="large" color="#4B5563" />
                <Text className="mt-4 text-gray-600">Loading customers...</Text>
              </View>
            ) : (
              <FlatList
                data={customers}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelectCustomer(item)}
                    className="p-4 mb-2 bg-gray-50 rounded-xl active:bg-gray-100"
                    activeOpacity={0.7}
                  >
                    <Text className="font-medium text-gray-900">{item.name}</Text>
                    <Text className="text-sm text-gray-500">{item.phone}</Text>
                    {item.balance > 0 && (
                      <Text className="mt-1 text-sm text-orange-600">
                        Balance: Rs {item.balance.toFixed(2)}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View className="items-center justify-center py-10">
                    <Feather name="users" size={40} color="#9CA3AF" />
                    <Text className="mt-3 text-gray-500">No customers found</Text>
                    <Text className="mt-1 text-sm text-gray-400">Add customers to get started</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={addItemModal}
        onRequestClose={() => {
          setAddItemModal(false);
          setSelectedItem(null);
          setItemSearch("");
        }}
      >
        <View className="justify-end flex-1 bg-black/50">
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10 max-h-[85%] shadow-2xl">
            
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-gray-900">
                Add Item to Order
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setAddItemModal(false);
                  setSelectedItem(null);
                  setItemSearch("");
                }}
                hitSlop={12}
              >
                <Feather name="x" size={26} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View className="flex-row items-center h-12 mb-4 overflow-hidden bg-gray-50 rounded-xl">
              <TextInput
                value={itemSearch}
                onChangeText={setItemSearch}
                placeholder="Search items..."
                className="flex-1 h-full px-4"
              />
              <View className="items-center justify-center h-full px-4 bg-gray-700">
                <Feather name="search" size={18} color="white" />
              </View>
            </View>

            {/* Selected Item Details */}
            {selectedItem && (
              <View className="p-4 mb-4 bg-blue-50 rounded-xl">
                <View className="flex-row justify-between mb-3">
                  <View>
                    <Text className="font-semibold text-gray-900">{selectedItem.name}</Text>
                    <Text className="text-sm text-gray-500">
                      Available: {selectedItem.quantity} units
                    </Text>
                  </View>
                  <Text className="font-bold text-gray-900">Rs {selectedItem.price}</Text>
                </View>

                {/* Quantity and Price Controls */}
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="mb-1 text-sm font-medium text-gray-700">Quantity</Text>
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        onPress={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                        className="items-center justify-center w-8 h-8 bg-gray-200 rounded-l-lg"
                      >
                        <Feather name="minus" size={16} color="#4B5563" />
                      </TouchableOpacity>
                      <TextInput
                        value={String(itemQuantity)}
                        onChangeText={t => setItemQuantity(Number(t) || 1)}
                        keyboardType="numeric"
                        className="w-12 h-10 text-center bg-gray-100"
                      />
                      <TouchableOpacity
                        onPress={() => setItemQuantity(itemQuantity + 1)}
                        className="items-center justify-center w-8 h-8 bg-gray-200 rounded-r-lg"
                      >
                        <Feather name="plus" size={16} color="#4B5563" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View>
                    <Text className="mb-1 text-sm font-medium text-gray-700">Unit Price (Rs)</Text>
                    <TextInput
                      value={String(itemPrice)}
                      onChangeText={t => setItemPrice(Number(t) || 0)}
                      keyboardType="numeric"
                      className="w-24 px-3 py-2 text-center bg-gray-100 rounded-lg"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Item List */}
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectItem(item)}
                  className={`p-4 mb-2 rounded-xl ${selectedItem?.id === item.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}
                  activeOpacity={0.7}
                >
                  <View className="flex-row justify-between">
                    <View>
                      <Text className="font-medium text-gray-900">{item.name}</Text>
                      <Text className="text-sm text-gray-500">
                        Stock: {item.quantity} | Rs {item.price}
                      </Text>
                    </View>
                    {selectedItem?.id === item.id && (
                      <Feather name="check" size={20} color="#3B82F6" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />

            {/* Add to Cart Button */}
            {selectedItem && (
              <TouchableOpacity
                onPress={handleAddToCart}
                className="items-center py-4 mt-4 bg-gray-800 rounded-xl"
                activeOpacity={0.9}
              >
                <Text className="text-base font-semibold text-white">
                  Add to Order - Rs {(itemPrice * itemQuantity).toFixed(2)}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

/* ================= SUB COMPONENTS ================= */

const CartItemCard = ({
  item,
  index,
  onUpdateQuantity,
  onRemove,
}: any) => (
  <View className="p-4 mb-3 border border-gray-200 bg-gray-50 rounded-xl">
    <View className="flex-row justify-between mb-3">
      <View className="flex-1">
        <Text className="font-semibold text-gray-900">
          {index + 1}. {item.name}
        </Text>
        <Text className="text-sm text-gray-500">
          Rs {item.price.toFixed(2)} each
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => onRemove(item.id)}
        className="p-2 rounded-lg bg-red-50"
        activeOpacity={0.7}
      >
        <Feather name="trash" size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>

    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center">
        {/* Quantity Controls */}
        <View className="flex-row items-center overflow-hidden bg-white border border-gray-300 rounded-lg">
          <TouchableOpacity
            onPress={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="items-center justify-center w-10 h-10 bg-gray-100"
            activeOpacity={0.7}
          >
            <Feather name="minus" size={16} color="#4B5563" />
          </TouchableOpacity>
          
          <TextInput
            value={String(item.quantity)}
            onChangeText={t => onUpdateQuantity(item.id, Math.max(1, Number(t) || 1))}
            keyboardType="numeric"
            className="h-10 font-medium text-center w-14"
            selectTextOnFocus
          />
          
          <TouchableOpacity
            onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="items-center justify-center w-10 h-10 bg-gray-100"
            activeOpacity={0.7}
          >
            <Feather name="plus" size={16} color="#4B5563" />
          </TouchableOpacity>
        </View>
        
        {/* Stock Info */}
        <View className="ml-4">
          <Text className="text-sm text-gray-500">
            Stock: <Text className="font-semibold">{item.availableStock}</Text>
          </Text>
          {item.quantity > item.availableStock && (
            <Text className="text-xs font-medium text-red-600">Exceeds stock</Text>
          )}
        </View>
      </View>

      {/* Item Total */}
      <View className="items-end">
        <Text className="text-lg font-bold text-gray-900">
          Rs {(item.price * item.quantity).toFixed(2)}
        </Text>
        <Text className="text-sm text-gray-500">
          {item.quantity} × Rs {item.price.toFixed(2)}
        </Text>
      </View>
    </View>
  </View>
);

export default sales;
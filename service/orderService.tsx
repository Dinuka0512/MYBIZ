import { db } from "@/FierbaseConfig";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  orderBy, 
  query, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { Alert } from "react-native";
import { addCredit } from "./customerService";
import { updateItemQuantity } from "./itemService";
import { getOrderDetailsByOrder,deleteOrderDetail,saveOrderDetail } from "./orderDetailService";

/* ================= ORDER CRUD METHODS ================= */

// Save new order
export const saveOrder = async (
  userId: string,
  customerId: string,
  orderData: {
    subtotal: number,
    discount: number,
    total: number,
    paidAmount: number,
    dueAmount: number,
    paymentMethod: 'cash' | 'credit' | 'mixed',
    notes?: string
  }
) => {
  if (!userId || !customerId) {
    Alert.alert("Error", "Missing required parameters.");
    return null;
  }

  try {
    const orderRef = doc(collection(db, "Users", userId, "orders"));
    const orderId = orderRef.id;
    
    const orderToSave = {
      id: orderId,
      customerId: customerId,
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      total: orderData.total,
      paidAmount: orderData.paidAmount,
      dueAmount: orderData.dueAmount,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.dueAmount > 0 ? 'pending' : 'paid',
      notes: orderData.notes || '',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(orderRef, orderToSave);

    // Update customer balance if there's due amount
    if (orderData.dueAmount > 0) {
      await addCredit(
        userId, 
        customerId, 
        orderData.dueAmount,
        `Order #${orderId} - Credit Sale`
      );
    }

    return orderId;
  } catch (error: any) {
    console.error("Save Order Error:", error.code, error.message);
    Alert.alert("Error", "Failed to save order. Please try again.");
    return null;
  }
};

// Update order
export const updateOrder = async (
  userId: string,
  orderId: string,
  updates: {
    subtotal?: number,
    discount?: number,
    total?: number,
    paidAmount?: number,
    dueAmount?: number,
    paymentMethod?: 'cash' | 'credit' | 'mixed',
    paymentStatus?: 'pending' | 'paid' | 'cancelled',
    notes?: string
  }
) => {
  if (!userId || !orderId) {
    Alert.alert("Error", "Missing required parameters.");
    return false;
  }

  try {
    const orderRef = doc(db, "Users", userId, "orders", orderId);
    
    await updateDoc(orderRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    Alert.alert("Success", "Order updated successfully!");
    return true;
  } catch (error: any) {
    console.error("Update Order Error:", error.code, error.message);
    Alert.alert("Error", "Failed to update order.");
    return false;
  }
};

// Delete order
export const deleteOrder = async (userId: string, orderId: string) => {
  if (!userId || !orderId) {
    Alert.alert("Error", "Missing required parameters.");
    return false;
  }

  try {
    // First delete all order details
    const orderDetails = await getOrderDetailsByOrder(userId, orderId);
    
    for (const detail of orderDetails) {
      await deleteOrderDetail(userId,orderId,detail.id);
    }

    // Then delete the order
    const orderRef = doc(db, "Users", userId, "orders", orderId);
    await deleteDoc(orderRef);
    
    Alert.alert("Success", "Order deleted successfully!");
    return true;
  } catch (error: any) {
    console.error("Delete Order Error:", error.code, error.message);
    Alert.alert("Error", "Failed to delete order.");
    return false;
  }
};

// Get all orders
export const getAllOrders = async (userId: string) => {
  if (!userId) {
    Alert.alert("Error", "You must be logged in to fetch orders.");
    return [];
  }

  try {
    const ordersRef = collection(db, "Users", userId, "orders");
    const ordersQuery = query(ordersRef, orderBy("date", "desc"));
    
    const querySnapshot = await getDocs(ordersQuery);
    const orders: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const orderData = doc.data();
      orders.push({
        id: doc.id,
        customerId: orderData.customerId,
        subtotal: orderData.subtotal || 0,
        discount: orderData.discount || 0,
        total: orderData.total || 0,
        paidAmount: orderData.paidAmount || 0,
        dueAmount: orderData.dueAmount || 0,
        paymentMethod: orderData.paymentMethod || 'cash',
        paymentStatus: orderData.paymentStatus || 'paid',
        notes: orderData.notes || '',
        date: orderData.date,
        createdAt: orderData.createdAt,
        updatedAt: orderData.updatedAt,
      });
    });
    
    return orders;
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return [];
  }
};

// Get order by ID
export const getOrderById = async (userId: string, orderId: string) => {
  if (!userId || !orderId) {
    return null;
  }

  try {
    const orderRef = doc(db, "Users", userId, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (orderSnap.exists()) {
      const data = orderSnap.data();
      return {
        id: orderSnap.id,
        customerId: data.customerId,
        subtotal: data.subtotal || 0,
        discount: data.discount || 0,
        total: data.total || 0,
        paidAmount: data.paidAmount || 0,
        dueAmount: data.dueAmount || 0,
        paymentMethod: data.paymentMethod || 'cash',
        paymentStatus: data.paymentStatus || 'paid',
        notes: data.notes || '',
        date: data.date,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    }
    
    return null;
  } catch (error: any) {
    console.error("Error fetching order:", error);
    return null;
  }
};

// Get orders by customer
export const getOrdersByCustomer = async (userId: string, customerId: string) => {
  if (!userId || !customerId) {
    return [];
  }

  try {
    const ordersRef = collection(db, "Users", userId, "orders");
    const ordersQuery = query(
      ordersRef, 
      where("customerId", "==", customerId),
      orderBy("date", "desc")
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    const orders: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const orderData = doc.data();
      orders.push({
        id: doc.id,
        ...orderData,
      });
    });
    
    return orders;
  } catch (error: any) {
    console.error("Error fetching customer orders:", error);
    return [];
  }
};

// Complete order (save order + order details + update stock + update customer balance)
export const completeOrder = async (
  userId: string,
  customerId: string,
  items: any[], // Array of { itemId, name, price, quantity }
  orderData: {
    subtotal: number,
    discount: number,
    total: number,
    paidAmount: number,
    dueAmount: number,
    paymentMethod: 'cash' | 'credit' | 'mixed',
    notes?: string
  }
) => {
  if (!userId || !customerId || !items || items.length === 0) {
    Alert.alert("Error", "Missing required parameters.");
    return null;
  }

  try {
    // 1. Create order
    const orderId = await saveOrder(userId, customerId, orderData);
    
    if (!orderId) {
      return null;
    }

    // 2. Save order details
    for (const item of items) {
      await saveOrderDetail(userId, orderId, {
        itemId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity
      });

      // 3. Update stock quantity (reduce stock)
      await updateItemQuantity(userId, item.id, -item.quantity);
    }

    Alert.alert("Success", `Order #${orderId} completed successfully!`);
    return orderId;
  } catch (error: any) {
    console.error("Complete Order Error:", error.code, error.message);
    Alert.alert("Error", "Failed to complete order. Please try again.");
    return null;
  }
};
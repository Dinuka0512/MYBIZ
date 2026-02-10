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
  where
} from "firebase/firestore";
import { getAllOrders } from "./orderService";
import { Alert } from "react-native";

/* ================= ORDER DETAIL CRUD METHODS ================= */

// Save order detail
export const saveOrderDetail = async (
  userId: string,
  orderId: string,
  detailData: {
    itemId: string,
    name: string,
    price: number,
    quantity: number,
    total: number
  }
) => {
  if (!userId || !orderId) {
    Alert.alert("Error", "Missing required parameters.");
    return null;
  }

  try {
    const detailRef = doc(collection(db, "Users", userId, "orders", orderId, "orderDetails"));
    const detailId = detailRef.id;
    
    await setDoc(detailRef, {
      id: detailId,
      orderId: orderId,
      itemId: detailData.itemId,
      name: detailData.name,
      price: detailData.price,
      quantity: detailData.quantity,
      total: detailData.total,
      createdAt: new Date().toISOString(),
    });

    return detailId;
  } catch (error: any) {
    console.error("Save Order Detail Error:", error.code, error.message);
    return null;
  }
};

// Update order detail
export const updateOrderDetail = async (
  userId: string,
  orderId: string,
  detailId: string,
  updates: {
    quantity?: number,
    price?: number,
    total?: number
  }
) => {
  if (!userId || !orderId || !detailId) {
    Alert.alert("Error", "Missing required parameters.");
    return false;
  }

  try {
    const detailRef = doc(db, "Users", userId, "orders", orderId, "orderDetails", detailId);
    
    await updateDoc(detailRef, {
      ...updates,
    });

    return true;
  } catch (error: any) {
    console.error("Update Order Detail Error:", error.code, error.message);
    return false;
  }
};

// Delete order detail
export const deleteOrderDetail = async (userId: string, orderId: string, detailId: string) => {
  if (!userId || !orderId || !detailId) {
    Alert.alert("Error", "Missing required parameters.");
    return false;
  }

  try {
    const detailRef = doc(db, "Users", userId, "orders", orderId, "orderDetails", detailId);
    await deleteDoc(detailRef);
    
    return true;
  } catch (error: any) {
    console.error("Delete Order Detail Error:", error.code, error.message);
    return false;
  }
};

// Get order details by order
export const getOrderDetailsByOrder = async (userId: string, orderId: string) => {
  if (!userId || !orderId) {
    return [];
  }

  try {
    const detailsRef = collection(db, "Users", userId, "orders", orderId, "orderDetails");
    const detailsQuery = query(detailsRef, orderBy("createdAt", "asc"));
    
    const querySnapshot = await getDocs(detailsQuery);
    const details: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const detailData = doc.data();
      details.push({
        id: doc.id,
        orderId: detailData.orderId,
        itemId: detailData.itemId,
        name: detailData.name,
        price: detailData.price,
        quantity: detailData.quantity,
        total: detailData.total,
        createdAt: detailData.createdAt,
      });
    });
    
    return details;
  } catch (error: any) {
    console.error("Error fetching order details:", error);
    return [];
  }
};

// Get order details by item
export const getOrderDetailsByItem = async (userId: string, itemId: string) => {
  if (!userId || !itemId) {
    return [];
  }

  try {
    // Note: This is less efficient - consider adding itemId field to orderDetails for better queries
    const allOrders = await getAllOrders(userId);
    const allDetails: any[] = [];
    
    for (const order of allOrders) {
      const details = await getOrderDetailsByOrder(userId, order.id);
      const itemDetails = details.filter(detail => detail.itemId === itemId);
      allDetails.push(...itemDetails);
    }
    
    return allDetails;
  } catch (error: any) {
    console.error("Error fetching item order details:", error);
    return [];
  }
};
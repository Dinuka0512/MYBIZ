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
import { Alert } from "react-native";

/* ================= ITEM CRUD METHODS ================= */

// Save new item
export const saveItem = async (
  userId: string,
  name: string,
  description: string,
  price: number,
  quantity: number
) => {
  if (!userId) {
    Alert.alert("Error", "You must be logged in to save items.");
    return null;
  }

  try {
    const itemRef = doc(collection(db, "Users", userId, "items"));
    const itemId = itemRef.id;
    
    await setDoc(itemRef, {
      id: itemId,
      name: name.trim(),
      description: description.trim(),
      price: Number(price) || 0,
      quantity: Number(quantity) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    Alert.alert("Success", "Item saved successfully!");
    return itemId;
  } catch (error: any) {
    console.error("Firebase Error:", error.code, error.message);
    Alert.alert("Error", "Check your internet or permissions.");
    return null;
  }
};

// Update item
export const updateItem = async (
  userId: string,
  itemId: string,
  updates: { name?: string; description?: string; price?: number; quantity?: number }
) => {
  if (!userId || !itemId) {
    Alert.alert("Error", "Missing required parameters.");
    return false;
  }

  try {
    const itemRef = doc(db, "Users", userId, "items", itemId);
    
    await updateDoc(itemRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    Alert.alert("Success", "Item updated successfully!");
    return true;
  } catch (error: any) {
    console.error("Firebase Update Error:", error.code, error.message);
    Alert.alert("Error", "Failed to update item.");
    return false;
  }
};

// Update item quantity (for stock management)
export const updateItemQuantity = async (
  userId: string,
  itemId: string,
  quantityChange: number // Positive = add stock, Negative = reduce stock
) => {
  if (!userId || !itemId) {
    Alert.alert("Error", "Missing required parameters.");
    return false;
  }

  try {
    const itemRef = doc(db, "Users", userId, "items", itemId);
    const itemSnap = await getDoc(itemRef);
    
    if (!itemSnap.exists()) {
      Alert.alert("Error", "Item not found.");
      return false;
    }

    const currentData = itemSnap.data();
    const currentQuantity = currentData.quantity || 0;
    const newQuantity = currentQuantity + quantityChange;

    if (newQuantity < 0) {
      Alert.alert("Error", "Insufficient stock.");
      return false;
    }

    await updateDoc(itemRef, {
      quantity: newQuantity,
      updatedAt: new Date().toISOString(),
    });

    return true;
  } catch (error: any) {
    console.error("Update Quantity Error:", error.code, error.message);
    Alert.alert("Error", "Failed to update item quantity.");
    return false;
  }
};

// Delete item
export const deleteItem = async (userId: string, itemId: string) => {
  if (!userId || !itemId) {
    Alert.alert("Error", "Missing required parameters.");
    return false;
  }

  try {
    const itemRef = doc(db, "Users", userId, "items", itemId);
    await deleteDoc(itemRef);
    
    Alert.alert("Success", "Item deleted successfully!");
    return true;
  } catch (error: any) {
    console.error("Firebase Delete Error:", error.code, error.message);
    Alert.alert("Error", "Failed to delete item.");
    return false;
  }
};

// Search items
export const searchItems = async (
  userId: string,
  searchTerm: string
): Promise<any[]> => {
  if (!userId) {
    Alert.alert("Error", "You must be logged in to search items.");
    return [];
  }

  const allItems = await getAllItems(userId);
  
  if (!searchTerm.trim()) {
    return allItems;
  }

  const searchLower = searchTerm.toLowerCase().trim();
  
  return allItems.filter(item => {
    const nameMatch = item.name?.toLowerCase().includes(searchLower);
    const descMatch = item.description?.toLowerCase().includes(searchLower);
    
    return nameMatch || descMatch;
  });
};

// Get all items
export const getAllItems = async (userId: string) => {
  if (!userId) {
    Alert.alert("Error", "You must be logged in to fetch items.");
    return [];
  }

  try {
    const itemsRef = collection(db, "Users", userId, "items");
    const itemsQuery = query(itemsRef, orderBy("createdAt", "desc"));
    
    const querySnapshot = await getDocs(itemsQuery);
    const items: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const itemData = doc.data();
      items.push({
        id: doc.id,
        name: itemData.name || "",
        description: itemData.description || "",
        price: itemData.price || 0,
        quantity: itemData.quantity || 0,
        createdAt: itemData.createdAt || new Date().toISOString(),
        updatedAt: itemData.updatedAt,
      });
    });
    
    return items;
    
  } catch (error: any) {
    console.error("Error fetching items:", error.code, error.message);
    
    if (error.code === "permission-denied") {
      Alert.alert("Permission Error", "You don't have permission to access items.");
    } else if (error.code === "unavailable") {
      Alert.alert("Network Error", "Please check your internet connection.");
    } else {
      Alert.alert("Error", "Failed to load items. Please try again.");
    }
    
    return [];
  }
};

// Get item by ID
export const getItemById = async (userId: string, itemId: string) => {
  if (!userId || !itemId) {
    return null;
  }

  try {
    const itemRef = doc(db, "Users", userId, "items", itemId);
    const itemSnap = await getDoc(itemRef);
    
    if (itemSnap.exists()) {
      const data = itemSnap.data();
      return {
        id: itemSnap.id,
        name: data.name || "",
        description: data.description || "",
        price: data.price || 0,
        quantity: data.quantity || 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    }
    
    return null;
  } catch (error: any) {
    console.error("Error fetching item:", error);
    return null;
  }
};
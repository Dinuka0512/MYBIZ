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
  QueryConstraint
} from "firebase/firestore";
import { Alert } from "react-native";

export const saveItem = async (
  userId: string,
  name: string,
  description: string,
  price: number,
  quantity: number
) => {
  if (!userId) {
    Alert.alert("Error", "You must be logged in to save items.");
    return;
  }

  try {
    const itemRef = doc(collection(db, "Users", userId, "items"));
    
    await setDoc(itemRef, {
      name: name.trim(),
      description: description.trim(),
      price: Number(price) || 0,
      quantity: Number(quantity) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    Alert.alert("Success", "Item saved successfully!");
  } catch (error: any) {
    console.error("Firebase Error:", error.code, error.message);
    Alert.alert("Error", "Check your internet or permissions.");
  }
};

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

export const searchItems = async (
  userId: string,
  searchTerm: string
): Promise<any[]> => {
  if (!userId) {
    Alert.alert("Error", "You must be logged in to search items.");
    return [];
  }

  if (!searchTerm.trim()) {
    // If search is empty, return all items
    return getAllItems(userId);
  }

  try {
    // Get all items first
    const allItems = await getAllItems(userId);
    
    // Convert search term to lowercase for case-insensitive comparison
    const searchLower = searchTerm.toLowerCase().trim();
    
    // Fuzzy search: check if search term appears anywhere in name or description
    const filteredItems = allItems.filter(item => {
      // Check if name contains the search term
      const nameMatch = item.name?.toLowerCase().includes(searchLower);
      
      // Check if description contains the search term
      const descMatch = item.description?.toLowerCase().includes(searchLower);
      
      // Check for partial matches (substring)
      const partialNameMatch = searchLower.split(' ').some(word => 
        item.name?.toLowerCase().includes(word)
      );
      
      // Check for initials or first letters
      const initialsMatch = item.name?.toLowerCase()
        .split(' ')
        .map((word: string) => word.charAt(0))
        .join('')
        .includes(searchLower);
      
      // Check price as string
      const priceMatch = item.price?.toString().includes(searchTerm);
      
      // Check quantity as string
      const qtyMatch = item.quantity?.toString().includes(searchTerm);
      
      // Return true if any condition matches
      return nameMatch || descMatch || partialNameMatch || initialsMatch || priceMatch || qtyMatch;
    });

    // Sort by relevance (exact matches first, then partial matches)
    const sortedResults = filteredItems.sort((a, b) => {
      const aName = a.name?.toLowerCase() || '';
      const bName = b.name?.toLowerCase() || '';
      
      // Exact match at start gets highest priority
      if (aName.startsWith(searchLower) && !bName.startsWith(searchLower)) return -1;
      if (!aName.startsWith(searchLower) && bName.startsWith(searchLower)) return 1;
      
      // Then exact match anywhere
      if (aName.includes(searchLower) && !bName.includes(searchLower)) return -1;
      if (!aName.includes(searchLower) && bName.includes(searchLower)) return 1;
      
      // Then alphabetically
      return aName.localeCompare(bName);
    });

    return sortedResults;
    
  } catch (error: any) {
    console.error("Search Error:", error);
    
    // Fallback: simple client-side filtering
    const allItems = await getAllItems(userId);
    return allItems.filter(item => {
      const name = item.name?.toLowerCase() || '';
      const description = item.description?.toLowerCase() || '';
      const price = item.price?.toString() || '';
      const quantity = item.quantity?.toString() || '';
      const searchLower = searchTerm.toLowerCase();
      
      // Simple fuzzy matching
      return name.includes(searchLower) || 
             description.includes(searchLower) ||
             price.includes(searchTerm) ||
             quantity.includes(searchTerm) ||
             searchLower.split('').every(char => name.includes(char)) ||
             name.split(' ').some((word: string) => word.startsWith(searchLower));
    });
  }
};

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

export const getItemById = async (userId: string, itemId: string) => {
  if (!userId || !itemId) {
    return null;
  }

  try {
    const itemRef = doc(db, "Users", userId, "items", itemId);
    const itemSnap = await getDoc(itemRef);
    
    if (itemSnap.exists()) {
      return {
        id: itemSnap.id,
        ...itemSnap.data(),
      };
    }
    
    return null;
  } catch (error: any) {
    console.error("Error fetching item:", error);
    return null;
  }
};
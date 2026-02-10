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

export const saveCustomer = async (
  userId: string,
  name: string,
  phone: string,
  balance: number
) => {
  if (!userId) {
    Alert.alert("Error", "You must be logged in to save customers.");
    return;
  }

  try {
    const customerRef = doc(collection(db, "Users", userId, "customers"));
    
    await setDoc(customerRef, {
      name: name.trim(),
      phone: phone.trim(),
      balance: Number(balance) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    Alert.alert("Success", "Customer saved successfully!");
  } catch (error: any) {
    console.error("Firebase Error:", error.code, error.message);
    Alert.alert("Error", "Check your internet or permissions.");
  }
};

export const updateCustomer = async (
  userId: string,
  customerId: string,
  updates: { name?: string; phone?: string; balance?: number }
) => {
  if (!userId || !customerId) {
    Alert.alert("Error", "Missing required parameters.");
    return false;
  }

  try {
    const customerRef = doc(db, "Users", userId, "customers", customerId);
    
    await updateDoc(customerRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    Alert.alert("Success", "Customer updated successfully!");
    return true;
  } catch (error: any) {
    console.error("Firebase Update Error:", error.code, error.message);
    Alert.alert("Error", "Failed to update customer.");
    return false;
  }
};

export const deleteCustomer = async (userId: string, customerId: string) => {
  if (!userId || !customerId) {
    Alert.alert("Error", "Missing required parameters.");
    return false;
  }

  try {
    const customerRef = doc(db, "Users", userId, "customers", customerId);
    await deleteDoc(customerRef);
    
    Alert.alert("Success", "Customer deleted successfully!");
    return true;
  } catch (error: any) {
    console.error("Firebase Delete Error:", error.code, error.message);
    Alert.alert("Error", "Failed to delete customer.");
    return false;
  }
};

export const searchCustomers = async (
  userId: string,
  searchTerm: string
): Promise<any[]> => {
  if (!userId) {
    Alert.alert("Error", "You must be logged in to search customers.");
    return [];
  }

  if (!searchTerm.trim()) {
    // If search is empty, return all customers
    return getAllCustomers(userId);
  }

  try {
    // Get all customers first
    const allCustomers = await getAllCustomers(userId);
    
    // Convert search term to lowercase for case-insensitive comparison
    const searchLower = searchTerm.toLowerCase().trim();
    
    // Fuzzy search: check if search term appears anywhere in name or phone
    const filteredCustomers = allCustomers.filter(customer => {
      // Check if name contains the search term (fuzzy matching)
      const nameMatch = customer.name?.toLowerCase().includes(searchLower);
      
      // Check if phone contains the search term
      const phoneMatch = customer.phone?.includes(searchTerm);
      
      // Check for partial matches (substring)
      const partialNameMatch = searchLower.split(' ').some(word => 
        customer.name?.toLowerCase().includes(word)
      );
      
      // Check for initials or first letters
      const initialsMatch = customer.name?.toLowerCase()
        .split(' ')
        .map((word: string) => word.charAt(0))
        .join('')
        .includes(searchLower);
      
      // Return true if any condition matches
      return nameMatch || phoneMatch || partialNameMatch || initialsMatch;
    });

    // Sort by relevance (exact matches first, then partial matches)
    const sortedResults = filteredCustomers.sort((a, b) => {
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
    const allCustomers = await getAllCustomers(userId);
    return allCustomers.filter(customer => {
      const name = customer.name?.toLowerCase() || '';
      const phone = customer.phone || '';
      const searchLower = searchTerm.toLowerCase();
      
      // Simple fuzzy matching
      return name.includes(searchLower) || 
             phone.includes(searchTerm) ||
             searchLower.split('').every(char => name.includes(char)) ||
             name.split(' ').some((word: string) => word.startsWith(searchLower));
    });
  }
};

export const getAllCustomers = async (userId: string) => {
  if (!userId) {
    Alert.alert("Error", "You must be logged in to fetch customers.");
    return [];
  }

  try {
    const customersRef = collection(db, "Users", userId, "customers");
    const customersQuery = query(customersRef, orderBy("createdAt", "desc"));
    
    const querySnapshot = await getDocs(customersQuery);
    const customers: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const customerData = doc.data();
      customers.push({
        id: doc.id,
        name: customerData.name || "",
        phone: customerData.phone || "",
        balance: customerData.balance || 0,
        createdAt: customerData.createdAt || new Date().toISOString(),
        updatedAt: customerData.updatedAt,
      });
    });
    
    return customers;
    
  } catch (error: any) {
    console.error("Error fetching customers:", error.code, error.message);
    
    if (error.code === "permission-denied") {
      Alert.alert("Permission Error", "You don't have permission to access customers.");
    } else if (error.code === "unavailable") {
      Alert.alert("Network Error", "Please check your internet connection.");
    } else {
      Alert.alert("Error", "Failed to load customers. Please try again.");
    }
    
    return [];
  }
};

export const getCustomerById = async (userId: string, customerId: string) => {
  if (!userId || !customerId) {
    return null;
  }

  try {
    const customerRef = doc(db, "Users", userId, "customers", customerId);
    const customerSnap = await getDoc(customerRef);
    
    if (customerSnap.exists()) {
      return {
        id: customerSnap.id,
        ...customerSnap.data(),
      };
    }
    
    return null;
  } catch (error: any) {
    console.error("Error fetching customer:", error);
    return null;
  }
};
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
  increment
} from "firebase/firestore";
import { Alert } from "react-native";

/* ================= CUSTOMER CRUD METHODS ================= */

// Save new customer
export const saveCustomer = async (
  userId: string,
  name: string,
  phone: string,
  balance: number = 0
) => {
  if (!userId) {
    Alert.alert("Error", "You must be logged in to save customers.");
    return null;
  }

  try {
    const customerRef = doc(collection(db, "Users", userId, "customers"));
    const customerId = customerRef.id;
    
    await setDoc(customerRef, {
      id: customerId,
      name: name.trim(),
      phone: phone.trim(),
      balance: Number(balance) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    Alert.alert("Success", "Customer saved successfully!");
    return customerId;
  } catch (error: any) {
    console.error("Firebase Error:", error.code, error.message);
    Alert.alert("Error", "Check your internet or permissions.");
    return null;
  }
};

// Update customer details
export const updateCustomer = async (
  userId: string,
  customerId: string,
  updates: { name?: string; phone?: string }
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

// Update customer balance (for payments and credits)
export const updateCustomerBalance = async (
  userId: string,
  customerId: string,
  amount: number, // Positive = add to balance (credit), Negative = subtract from balance (payment)
  description?: string
) => {
  if (!userId || !customerId) {
    Alert.alert("Error", "Missing required parameters.");
    return false;
  }

  try {
    const customerRef = doc(db, "Users", userId, "customers", customerId);
    
    // Get current balance first
    const customerSnap = await getDoc(customerRef);
    if (!customerSnap.exists()) {
      Alert.alert("Error", "Customer not found.");
      return false;
    }

    const currentData = customerSnap.data();
    const currentBalance = currentData.balance || 0;
    const newBalance = currentBalance + amount;

    // Update customer balance
    await updateDoc(customerRef, {
      balance: newBalance,
      updatedAt: new Date().toISOString(),
    });

    // Create transaction record
    const transactionRef = doc(collection(db, "Users", userId, "customers", customerId, "transactions"));
    await setDoc(transactionRef, {
      amount: amount,
      type: amount > 0 ? 'credit' : 'payment',
      description: description || (amount > 0 ? 'Credit added' : 'Payment made'),
      previousBalance: currentBalance,
      newBalance: newBalance,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    console.log(`Customer balance updated: ${currentBalance} → ${newBalance} (Change: ${amount})`);
    return true;
  } catch (error: any) {
    console.error("Balance Update Error:", error.code, error.message);
    Alert.alert("Error", "Failed to update customer balance.");
    return false;
  }
};

// Make payment (reduce balance)
export const makePayment = async (
  userId: string,
  customerId: string,
  amount: number,
  description?: string
) => {
  // Payment reduces balance, so amount should be negative
  return updateCustomerBalance(userId, customerId, -Math.abs(amount), description || 'Payment received');
};

// Add credit (increase balance)
export const addCredit = async (
  userId: string,
  customerId: string,
  amount: number,
  description?: string
) => {
  // Credit increases balance, so amount should be positive
  return updateCustomerBalance(userId, customerId, Math.abs(amount), description || 'Credit added');
};

// Delete customer
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

// Search customers
export const searchCustomers = async (
  userId: string,
  searchTerm: string
): Promise<any[]> => {
  if (!userId) {
    Alert.alert("Error", "You must be logged in to search customers.");
    return [];
  }

  const allCustomers = await getAllCustomers(userId);
  
  if (!searchTerm.trim()) {
    return allCustomers;
  }

  const searchLower = searchTerm.toLowerCase().trim();
  
  return allCustomers.filter(customer => {
    const nameMatch = customer.name?.toLowerCase().includes(searchLower);
    const phoneMatch = customer.phone?.includes(searchTerm);
    
    return nameMatch || phoneMatch;
  });
};

// Get all customers
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

// Get customer by ID
export const getCustomerById = async (userId: string, customerId: string) => {
  if (!userId || !customerId) {
    return null;
  }

  try {
    const customerRef = doc(db, "Users", userId, "customers", customerId);
    const customerSnap = await getDoc(customerRef);
    
    if (customerSnap.exists()) {
      const data = customerSnap.data();
      return {
        id: customerSnap.id,
        name: data.name || "",
        phone: data.phone || "",
        balance: data.balance || 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    }
    
    return null;
  } catch (error: any) {
    console.error("Error fetching customer:", error);
    return null;
  }
};

// Get customer transactions
export const getCustomerTransactions = async (userId: string, customerId: string) => {
  if (!userId || !customerId) {
    return [];
  }

  try {
    const transactionsRef = collection(db, "Users", userId, "customers", customerId, "transactions");
    const transactionsQuery = query(transactionsRef, orderBy("date", "desc"));
    
    const querySnapshot = await getDocs(transactionsQuery);
    const transactions: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const transactionData = doc.data();
      transactions.push({
        id: doc.id,
        amount: transactionData.amount || 0,
        type: transactionData.type || 'credit',
        description: transactionData.description || '',
        previousBalance: transactionData.previousBalance || 0,
        newBalance: transactionData.newBalance || 0,
        date: transactionData.date,
        createdAt: transactionData.createdAt,
      });
    });
    
    return transactions;
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    return [];
  }
};
import { db } from "@/FierbaseConfig";
import { collection, doc, getDoc, getDocs, orderBy, query, setDoc } from "firebase/firestore";
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
    // 1. Reference the user document
    const userRef = doc(db, "Users", userId);
    const userSnap = await getDoc(userRef);

    // Note: If you haven't created a document for the user in the "users" 
    // collection yet, this check will fail. 
    if (!userSnap.exists()) {
       console.warn("User doc missing, creating customer anyway...");
       // Optional: You can remove the 'return' here if you want to allow 
       // saving customers even if the user profile doc doesn't exist yet.
    }

    // 2. Create the customer in the subcollection
    // This creates the "customers" collection automatically if it doesn't exist
    const customerRef = doc(collection(db, "Users", userId, "customers"));
    
    await setDoc(customerRef, {
      name: name.trim(),
      phone: phone.trim(),
      balance: Number(balance) || 0,
      createdAt: new Date().toISOString(),
    });

    Alert.alert("Success", "Customer saved successfully!");
  } catch (error: any) {
    console.error("Firebase Error:", error.code, error.message);
    Alert.alert("Error", "Check your internet or permissions.");
  }
};


export const getAllCustomers = async (userId: string) => {
  if (!userId) {
    Alert.alert("Error", "You must be logged in to fetch customers.");
    return [];
  }

  try {
    const customersRef = collection(db, "Users", userId, "customers");
    
    // Create a query to get all customers, ordered by creation date (newest first)
    const customersQuery = query(customersRef, orderBy("createdAt", "desc"));
    
    // Execute the query
    const querySnapshot = await getDocs(customersQuery);
    
    // Map the documents to an array of customer objects
    const customers: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const customerData = doc.data();
      customers.push({
        id: doc.id,
        name: customerData.name || "",
        phone: customerData.phone || "",
        balance: customerData.balance ? String(customerData.balance) : "0",
        createdAt: customerData.createdAt || new Date().toISOString(),
      });
    });
    
    console.log(`Fetched ${customers.length} customers for user ${userId}`);
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
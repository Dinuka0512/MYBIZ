import { createUserWithEmailAndPassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential, signInWithEmailAndPassword, updatePassword } from 'firebase/auth'
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db,auth } from "../FierbaseConfig"
import { Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const registration = async (name:string, email:string, password:string)=>{
    try {
        // 1. Create the user account in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Create a user profile document in Firestore
        await setDoc(doc(db, "Users", user.uid), {
            uid: user.uid,
            name: name,
            email: email,
            createdAt: new Date(),
        });

        return user;
    } catch (error: any) {
        // Log the full error to your console so you can see exactly what happened
        console.error("Registration Error Code:", error.code);

        // Map Firebase error codes to user-friendly messages
        switch (error.code) {
            case 'auth/email-already-in-use':
                Alert.alert("Account Exists", "This email is already registered.");
                break;
            case 'auth/invalid-email':
                Alert.alert("Invalid Email", "Please enter a valid email address.");
                break;
            case 'auth/weak-password':
                Alert.alert("Weak Password", "Firebase requires a stronger password.");
                break;
            case 'permission-denied':
                Alert.alert("Database Error", "You do not have permission to save this profile.");
                break;
            default:
                Alert.alert("Error", "Something went wrong. Please try again later.");
        }
    }
}


export const login = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    Alert.alert("Success","Login Successful!");
    await AsyncStorage.setItem("user", JSON.stringify(user))
    router.push("/(dashboard)");

  } catch (error: any) {

    let message = "Login failed. Please try again.";

    switch (error.code) {
      case "auth/invalid-email":
        message = "The email address is badly formatted.";
        break;
      case "auth/user-not-found":
        message = "No user found with this email.";
        break;
      case "auth/wrong-password":
        message = "Incorrect password. Please try again.";
        break;
      case "auth/too-many-requests":
        message = "Too many attempts. Please wait and try again later.";
        break;
      case "auth/invalid-credential":
        message = "No User Found with email or Invalid Password."
        break;
      default:
        message = error.message;
    }

    Alert.alert("Login Failed", message);
    throw error;
  }
};


export const updateUserProfile = async (userId: string, imageUrl: string) => {
  try{
    const userRef = doc(db, "Users", userId);

    await updateDoc(userRef, {
      profileImage: imageUrl,
      updatedAt: new Date()
    });

    Alert.alert("Success", "Image uploaded successfully ");
  }catch(error){
    Alert.alert("Error", "Image upload failed");
    console.log(error);
  }
}

export const getAllUserData = async (userId: string) => {
  try {
    const userRef = doc(db, "Users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data(); // actual user fields
      return data; // return for immediate use
    } else {
      Alert.alert("Not Found", "User document does not exist.");
      return null;
    }
  } catch (error: any) {
    if (error.code === "permission-denied") {
      Alert.alert("Warning!", "You don't have permission to read this document.");
    } else if (error.code === "unavailable") {
      Alert.alert("Network error", "Firestore unavailable.");
    } else {
      console.error("Unexpected error:", error);
      Alert.alert("Unexpected error");
    }
    throw error;
  }
};

export const updateUserName = async (userId: string, name: string) => {
  try{
    const userRef = doc(db, "Users", userId);

    await updateDoc(userRef, {
      name: name,
      updatedAt: new Date()
    });

    Alert.alert("Success", "successfully Updated your name!");
  }catch(error){
    Alert.alert("Error", "Update Failed");
    console.log(error);
  }
}

export const updateUserPassword = async (userId: string, oldPassword: string, newPassword: string ) => {
  try{
    const user = auth.currentUser;

      if (!user || !user.email) {
        throw new Error("User not authenticated");
      }

      // 1️⃣ Create credential using old password
      const credential = EmailAuthProvider.credential(
        user.email,
        oldPassword
      );

      // 2️⃣ Re-authenticate user
      await reauthenticateWithCredential(user, credential);

      // 3️⃣ Update password
      await updatePassword(user, newPassword);
      Alert.alert("Success", "Password updated successfully");
  } catch (error: any) {
    console.log("PASSWORD UPDATE ERROR:", error);
    if (error.code === "auth/invalid-credential") { 
      Alert.alert("Error", "Invalid credential. Check your email or current password."); 
    } else if (error.code === "auth/wrong-password") {
      Alert.alert("Error", "Old password is incorrect");
    } else if (error.code === "auth/weak-password") {
      Alert.alert("Error", "Password should be at least 6 characters");
    } else if (error.code === "auth/requires-recent-login") {
      Alert.alert(
        "Session Expired",
        "Please log in again and retry"
      );
    } else {
      Alert.alert("Error", "Password update failed\n Old password os ");
    }
  }
}

export const accountPermenentlyDelete = async (userId: string, password:string) => {
  try {
    const user = auth.currentUser;

    if (!user || !user.email) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    /* 1️⃣ RE-AUTHENTICATE USER */ 
    const credential = EmailAuthProvider.credential(user.email, password); 
    await reauthenticateWithCredential(user, credential);

    /* 1️⃣ DELETE USER DATA FROM FIRESTORE */
    await deleteDoc(doc(db, "Users", userId));

    // If you have sub-collections, delete them too
    // await deleteDoc(doc(db, "Orders", userId));
    // await deleteDoc(doc(db, "Businesses", userId));

    /* 2️⃣ DELETE USER FROM AUTH */
    await deleteUser(user);

    Alert.alert(
      "Account Deleted",
      "Your account has been permanently deleted"
    );
  } catch (error: any) {
    console.log("ACCOUNT DELETE ERROR:", error);

    if (error.code === "auth/requires-recent-login") {
      Alert.alert(
        "Session Expired",
        "Please log in again to delete your account"
      );
      return;
    }

    Alert.alert("Error", "Failed to delete account");
  }
};
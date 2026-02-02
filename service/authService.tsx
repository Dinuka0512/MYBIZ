import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
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

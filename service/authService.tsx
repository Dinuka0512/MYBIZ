import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { db,auth } from "../FierbaseConfig"
import { Alert } from 'react-native';
import { router } from 'expo-router';

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
    // Attempt login
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    Alert.alert("Login Successful")
    
    router.push("/(dashboard)")

  } catch (error: any) {
    Alert.alert("Login Failed!..")
    throw error;
  }
};

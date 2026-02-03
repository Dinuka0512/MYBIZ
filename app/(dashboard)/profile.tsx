import React, { use, useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Image, Alert } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { auth, db } from "../../FierbaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import uploadToCloudinary from "@/util/UploadCloudinary";
import { updateUserProfile } from "@/service/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Profile = () => {
  const [name, setName] = useState("Sample User");
  const [profileImage, setProfileImage] = useState("https://via.placeholder.com/150");
  const [email, setEmail] = useState("sample@gmail.com");
  const [modalVisible, setModalVisible] = useState(false);
  const [tempName, setTempName] = useState("");
  const [userDetails, setUserDetails] = useState<any>(null);
  const [user, setUser] = useState("");
  // Update Firestore + AsyncStorage with new image
  async function profileUpdate(imageUrl: string) {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (userString !== null) {
        const user = JSON.parse(userString);
        const userId = user.uid;
        await updateUserProfile(userId, imageUrl);
      } else {
        Alert.alert("Error", "Something went wrong!");
        router.push("/login");
      }
    } catch (error) {
      console.error("Error reading user:", error);
    }
  }

  // Pick image and upload to Cloudinary
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (result.canceled) return;

    try {
      const localUri = result.assets[0].uri;
      const response = await uploadToCloudinary(localUri);
      const imageUrl = response.secure_url;

      setProfileImage(imageUrl); // update UI
      profileUpdate(imageUrl);   // update DB
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Image upload failed");
    }
  };

  // 🔹 Update name in Firebase Auth + Firestore
  const handleUpdate = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, { displayName: tempName });
        await updateDoc(doc(db, "Users", user.uid), { name: tempName });

        setName(tempName);
        setModalVisible(false);
        Alert.alert("Success", "Profile updated!");
      }
    } catch (error) {
      Alert.alert("Error", "Could not update profile");
    }
  };

  // Load user details from AsyncStorage
  useEffect(() => {
    const setDetails = async () => {
      try {
        const ud = await AsyncStorage.getItem("userDetails");
        const u = await AsyncStorage.getItem("user");
        if (ud !== null) {
          const parsed = JSON.parse(ud);
          setUserDetails(parsed);
          setName(parsed.name ?? "Sample User");
          setProfileImage(parsed.profileImage ?? "https://via.placeholder.com/150");
          console.log("DETAILS", parsed);
        }

        if(u !== null){
          const user = JSON.parse(u);
          setEmail(user.email);
        }else{
          Alert.alert("Error", "Something went wrong!");
          router.push("/login");
        }
        
      } catch (error) {
        console.error("Error loading user details:", error);
      }
    };
    setDetails();
  }, []);

  return (
    <ScrollView className="flex-1 bg-[#F8F9FA] px-6 pt-12">
      {/* Header Section */}
      <View className="flex-row items-center mb-8">
        <View className="relative">
          <Image
            source={{ uri: profileImage }}
            className="border-4 border-white rounded-full shadow-sm w-28 h-28"
          />
          <TouchableOpacity
            onPress={pickImage}
            className="absolute bottom-0 right-0 p-2 bg-blue-600 border-2 border-white rounded-full"
          >
            <Feather name="camera" size={16} color="white" />
          </TouchableOpacity>
        </View>
        <View className="ml-4">
          <Text className="text-2xl font-bold text-gray-900">{name}</Text>
          <Text className="font-medium text-gray-500">{email}</Text>
          <Text className="text-sm font-medium text-gray-500">Business Owner</Text>
        </View>
      </View>

      {/* Settings List */}
      <View className="p-2 mb-6 bg-white shadow-sm rounded-3xl">
        <ProfileItem icon="user" title="Edit Profile" onPress={() => setModalVisible(true)} />
        <ProfileItem icon="briefcase" title="Business Details" />
        <ProfileItem icon="pie-chart" title="Reports" />
        <ProfileItem icon="settings" title="App Settings" />
        <ProfileItem icon="help-circle" title="Help & Support" />
      </View>

      {/* Logout */}
      <TouchableOpacity
        onPress={() => auth.signOut().then(() => router.replace("/login"))}
        className="flex-row items-center justify-center p-4 mb-10 bg-red-600 rounded-2xl"
      >
        <Feather name="log-out" size={20} color="#ffffff" />
        <Text className="ml-2 text-lg font-bold text-white">Sign Out</Text>
      </TouchableOpacity>

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="justify-end flex-1 bg-black/50">
          <View className="bg-white rounded-t-[40px] p-8 shadow-lg">
            <View className="items-center mb-6">
              <View className="w-12 h-1 mb-4 bg-gray-300 rounded-full" />
              <Text className="text-xl font-bold text-gray-800">Update Profile</Text>
            </View>

            <Text className="mb-2 ml-1 text-gray-500">Full Name</Text>
            <TextInput
              value={tempName}
              onChangeText={setTempName}
              placeholder="Enter your name"
              className="p-4 mb-6 text-lg bg-gray-100 border border-gray-200 rounded-2xl"
            />

            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="items-center flex-1 p-4 mr-2 bg-gray-100 rounded-2xl"
              >
                <Text className="font-semibold text-gray-600">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUpdate}
                className="items-center flex-1 p-4 ml-2 bg-blue-600 shadow-md rounded-2xl shadow-blue-300"
              >
                <Text className="font-bold text-white">Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// Reusable Item Component
const ProfileItem = ({ title, icon, onPress }: { title: string; icon: any; onPress?: () => void }) => (
  <TouchableOpacity onPress={onPress} className="flex-row items-center justify-between p-4">
    <View className="flex-row items-center">
      <View className="p-2 mr-4 bg-gray-100 rounded-xl">
        <Feather name={icon} size={20} color="#4B5563" />
      </View>
      <Text className="text-base font-medium text-gray-700">{title}</Text>
    </View>
    <Feather name="chevron-right" size={18} color="#D1D5DB" />
  </TouchableOpacity>
);

export default Profile;
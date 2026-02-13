import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { auth } from "../../FierbaseConfig";
import uploadToCloudinary from "@/util/UploadCloudinary";
import {
  updateUserProfile,
  updateUserName,
  getAllUserData,
  updateUserPassword,
  updateUserContact,
  accountPermenentlyDelete
} from "@/service/authService";
import { Validator } from "../../util/Validations";

const Profile = () => {
  const temparyUrl = "https://res.cloudinary.com/dgokbm0dx/image/upload/v1770408971/istockphoto-1695144958-612x612_jpzoft.jpg";
  const [name, setName] = useState("Sample User");
  const [tempName, setTempName] = useState("");
  const [contact, setContact] = useState("");
  const [tempContact, setTempContact] = useState("");
  const [profileImage, setProfileImage] = useState(temparyUrl);
  
  const [email, setEmail] = useState("");
  const [userDetails, setUserDetails] = useState<any>(null);

  const [editModal, setEditModal] = useState(false);
  const [editContactModal, setEditContactModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [deletecModal, setDeletecModal] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  // Format phone for display (shows with +94)
  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return '';
    if (phone.startsWith('94')) {
      return '+94 ' + phone.substring(2).replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3');
    }
    return phone;
  };

  // Validate phone number
  const validatePhoneNumber = (phone: string) => {
    if (!phone) return true; // Optional field
    // Sri Lankan mobile: 94 followed by 9 digits (starting with 7)
    const sriLankanPhoneRegex = /^94[7][0-9]{8}$/;
    return sriLankanPhoneRegex.test(phone);
  };

  // IMAGE UPDATE 
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (result.canceled) return;

    try {
      const uri = result.assets[0].uri;
      const upload = await uploadToCloudinary(uri);
      const imageUrl = upload.secure_url;

      setProfileImage(imageUrl);
      await updateUserProfile(userDetails.uid, imageUrl);
      refreshUser();
    } catch {
      Alert.alert("Error", "Image upload failed");
    }
  };

  //  NAME UPDATE
  const handleUpdate = async () => {
    if (!Validator.isName(tempName)) {
      Alert.alert(
        "Invalid Name",
        "Name must be 2–50 characters and contain only letters"
      );
      return;
    }

    try {
      await updateUserName(userDetails.uid, tempName);
      setName(tempName);
      setEditModal(false);
      refreshUser();
    } catch {
      Alert.alert("Error", "Profile update failed");
    }
  };

  //  CONTACT UPDATE
  const handleContactUpdate = async () => {
    if (!tempContact) {
      Alert.alert("Error", "Please enter a phone number");
      return;
    }

    if (!validatePhoneNumber(tempContact)) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid Sri Lankan phone number (e.g., 94XXXXXXXXX)"
      );
      return;
    }

    try {
      await updateUserContact(userDetails.uid, tempContact);
      setContact(tempContact);
      setEditContactModal(false);
      refreshUser();
      Alert.alert("Success", "Contact information updated successfully");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Contact update failed");
    }
  };

  //  PASSWORD UPDATE
  const handlePasswordUpdate = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if(!Validator.isPassword(newPassword)){
      Alert.alert("Invalid Password", "The Password must have more than 6 characters.")
      return
    }

    try {
      await updateUserPassword(userDetails.uid, oldPassword, newPassword);
      setPasswordModal(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Success", "Password updated successfully");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Password update failed");
    }
  };

  // DELETE ACCOUNT
 const handleDeleteAccount = async () => {
  try {
    if (!deletePassword) {
      Alert.alert("Error", "Please enter your password to confirm.");
      return;
    }

    await accountPermenentlyDelete(userDetails.uid, deletePassword);
    Alert.alert("Account Deleted", "Your account has been deleted");
    auth.signOut();
    router.replace("/login");
  } catch (error: any) {
    Alert.alert("Error", error.message || "Failed to delete account");
  }
};

  // REFRESH USER
  const refreshUser = async () => {
    const data = await getAllUserData(userDetails.uid);
    await AsyncStorage.setItem("userDetails", JSON.stringify(data));
  };

  // LOAD USER
  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem("userDetails");
      const authUser = await AsyncStorage.getItem("user");

      if (!stored || !authUser) {
        router.replace("/login");
        return;
      }

      const user = JSON.parse(stored);
      const authData = JSON.parse(authUser);

      setUserDetails(user);
      setName(user.name);
      setContact(user.phone || "");
      setProfileImage(user?.profileImage || temparyUrl);
      setEmail(authData.email);
    };

    load();
  }, []);

  return (
    <ScrollView className="flex-1 bg-[#F5F6F8]">

      {/* PROFILE CARD */}
      <View className="px-5 pt-10">
        <View className="p-5 bg-white shadow-sm rounded-2xl">
          <View className="flex-row items-center justify-between">
            
            {/* Left side: Profile image + name/email/contact */}
            <View className="flex-row items-center">
              <View className="relative">
                <Image
                  source={{ uri: profileImage }}
                  className="w-20 h-20 rounded-full"
                />
                <TouchableOpacity
                  onPress={pickImage}
                  className="absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full"
                >
                  <Feather name="camera" size={12} color="#fff" />
                </TouchableOpacity>
              </View>

              <View className="ml-4">
                <Text className="text-xl font-semibold text-gray-900">{name}</Text>
                <Text className="mt-1 text-sm text-gray-500">{email}</Text>
                {contact ? (
                  <Text className="mt-1 text-xs text-gray-400">{formatPhoneDisplay(contact)}</Text>
                ) : (
                  <Text className="mt-1 text-xs italic text-gray-400">No phone added</Text>
                )}
              </View>
            </View>

            {/* Right side: Sign Out button */}
            <TouchableOpacity
              onPress={() => auth.signOut().then(() => router.replace("/login"))}
              className="px-3 py-2 bg-red-600 rounded-lg"
            >
              <Text className="text-sm font-bold text-white">Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>


      {/* SETTINGS */}
      <View className="px-5 mt-8">
        <Text className="mb-2 text-xs font-semibold text-gray-500 uppercase">
          Settings
        </Text>
        <View className="bg-white shadow-sm rounded-2xl">
          <ProfileItem
            icon="edit"
            title="Edit Profile"
            onPress={() => {
              setTempName(name);
              setEditModal(true);
            }}
          />
          <ProfileItem
            icon="phone"
            title="Edit Contact Info"
            onPress={() => {
              setTempContact(contact);
              setEditContactModal(true);
            }}
          />
          <ProfileItem
            icon="key"
            title="Change Password"
            onPress={() => setPasswordModal(true)}
          />
          <ProfileItem
            icon="help-circle"
            title="Help & Support"
            onPress={() => {}}
          />
        </View>
      </View>

      {/* DANGER ZONE */}
      <View className="px-5 mt-8">
        <Text className="mb-2 text-xs font-semibold text-red-600 uppercase">
          Danger Zone
        </Text>
        <View className="bg-white border border-red-500 rounded-2xl">
          <ProfileItem
            icon="trash"
            title="Permanently Delete Account"
            onPress={() => setDeleteModal(true)}
          />
        </View>
      </View>


      {/* MODALS */}

      {/* EDIT PROFILE */}
      <Modal transparent animationType="slide" visible={editModal}>
        <View className="justify-end flex-1 bg-black/40">
          <View className="p-6 bg-white rounded-t-2xl">
            <Text className="mb-4 text-lg font-semibold">Edit Profile</Text>

            <TextInput
              value={tempName}
              onChangeText={setTempName}
              className="p-4 mb-6 bg-gray-100 rounded-xl"
              placeholder="Enter your name"
            />

            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setEditModal(false)}
                className="flex-1 p-4 mr-2 bg-gray-100 rounded-xl"
              >
                <Text className="text-center text-gray-600">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUpdate}
                className="flex-1 p-4 ml-2 bg-gray-900 rounded-xl"
              >
                <Text className="font-semibold text-center text-white">
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT CONTACT */}
      <Modal transparent animationType="slide" visible={editContactModal}>
        <View className="justify-end flex-1 bg-black/40">
          <View className="p-6 bg-white rounded-t-2xl">
            <Text className="mb-4 text-lg font-semibold">Edit Contact Info</Text>
            
            <Text className="mb-2 text-xs text-gray-500">Sri Lankan Phone Number</Text>
            
            <View className="mb-2">
              <TextInput
                placeholder="94XXXXXXXXX"
                value={tempContact}
                onChangeText={(text) => {
                  // Remove all non-numeric characters
                  let cleaned = text.replace(/[^0-9]/g, '');
                  
                  // Handle Sri Lankan phone number format
                  if (cleaned.startsWith('94')) {
                    cleaned = cleaned.substring(0, 11);
                  } else if (cleaned.startsWith('0')) {
                    cleaned = '94' + cleaned.substring(1, 10);
                  } else {
                    cleaned = '94' + cleaned.substring(0, 9);
                  }
                  
                  setTempContact(cleaned);
                }}
                keyboardType="phone-pad"
                maxLength={11}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:border-gray-400"
              />
            </View>
            
            {/* Preview of formatted number */}
            {tempContact && (
              <View className="p-3 mb-4 rounded-lg bg-blue-50">
                <Text className="text-xs text-blue-800">
                  Preview: {formatPhoneDisplay(tempContact)}
                </Text>
              </View>
            )}
            
            <Text className="mb-4 text-xs text-gray-500">
              Format: 94 XX XXX XXXX (e.g., 94 77 123 4567)
            </Text>

            <View className="flex-row">
              <TouchableOpacity
                onPress={() => {
                  setEditContactModal(false);
                  setTempContact(contact);
                }}
                className="flex-1 p-4 mr-2 bg-gray-100 rounded-xl"
              >
                <Text className="text-center text-gray-600">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleContactUpdate}
                className="flex-1 p-4 ml-2 bg-gray-900 rounded-xl"
              >
                <Text className="font-semibold text-center text-white">
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CHANGE PASSWORD */}
      <Modal transparent animationType="slide" visible={passwordModal}>
        <View className="justify-end flex-1 bg-black/40">
          <View className="p-6 bg-white rounded-t-2xl">
            <Text className="mb-4 text-lg font-semibold">Change Password</Text>

            {/* Old Password */}
            <View className="flex-row items-center mb-4 bg-gray-100 rounded-xl">
              <TextInput
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Old Password"
                secureTextEntry={!showOldPassword}
                className="flex-1 p-4"
              />
              <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)} className="p-2">
                <Feather name={showOldPassword ? "eye" : "eye-off"} size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {/* New Password */}
            <View className="flex-row items-center mb-4 bg-gray-100 rounded-xl">
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New Password"
                secureTextEntry={!showNewPassword}
                className="flex-1 p-4"
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} className="p-2">
                <Feather name={showNewPassword ? "eye" : "eye-off"} size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View className="flex-row items-center mb-6 bg-gray-100 rounded-xl">
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm New Password"
                secureTextEntry={!showConfirmPassword}
                className="flex-1 p-4"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="p-2">
                <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>


            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setPasswordModal(false)}
                className="flex-1 p-4 mr-2 bg-gray-100 rounded-xl"
              >
                <Text className="text-center text-gray-600">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePasswordUpdate}
                className="flex-1 p-4 ml-2 bg-gray-900 rounded-xl"
              >
                <Text className="font-semibold text-center text-white">
                  Update
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* DELETE ACCOUNT CONFIRMATION */}
      <Modal transparent animationType="slide" visible={deleteModal}>
        <View className="justify-end flex-1 bg-black/40">
          <View className="p-6 bg-white rounded-3xl">
            <Text className="mb-4 text-lg font-semibold text-red-500">
              Permanently Delete Account
            </Text>
            <Text className="mb-6 text-black">
              This action cannot be undone. To confirm, please type :
              <Text className="font-bold text-black"> DELETE ACCOUNT</Text>
            </Text>

            <TextInput
              value={confirmDelete}
              onChangeText={setConfirmDelete}
              placeholder="DELETE ACCOUNT"
              className="p-4 mb-6 bg-gray-100 rounded-xl"
            />

            <View className="flex-row">
              <TouchableOpacity
                onPress={() => { setDeleteModal(false); setConfirmDelete(""); }}
                className="flex-1 p-4 mr-2 bg-gray-100 rounded-xl"
              >
                <Text className="text-center text-gray-600">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (confirmDelete === "DELETE ACCOUNT") {
                    setDeleteModal(false);
                    setDeletecModal(true); // open password modal
                  }
                }}
                disabled={confirmDelete !== "DELETE ACCOUNT"}
                className={`flex-1 p-4 ml-2 rounded-xl ${
                  confirmDelete === "DELETE ACCOUNT" ? "bg-red-600" : "bg-red-200"
                }`}
              >
                <Text className="font-semibold text-center text-white">
                  Continue
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* DELETE ACCOUNT PASSWORD CONFIRM */}
      <Modal transparent animationType="slide" visible={deletecModal}>
        <View className="justify-center flex-1 bg-black/40">
          <View className="p-6 mx-6 bg-white rounded-2xl">
            <Text className="mb-4 text-lg font-semibold text-red-600">
              Confirm Account Deletion
            </Text>
            <Text className="mb-6 text-gray-700">
              Please enter your password to permanently delete your account.
            </Text>

            {/* Password input with eye toggle */}
            <View className="flex-row items-center mb-6 bg-gray-100 rounded-xl">
              <TextInput
                value={deletePassword}
                onChangeText={setDeletePassword}
                placeholder="Enter your password"
                secureTextEntry={!showDeletePassword}
                className="flex-1 p-4"
              />
              <TouchableOpacity
                onPress={() => setShowDeletePassword(!showDeletePassword)}
                className="p-2"
              >
                <Feather
                  name={showDeletePassword ? "eye" : "eye-off"}
                  size={20}
                  color="#4B5563"
                />
              </TouchableOpacity>
            </View>

            <View className="flex-row">
              <TouchableOpacity
                onPress={() => { setDeletecModal(false); setDeletePassword(""); }}
                className="flex-1 p-4 mr-2 bg-gray-100 rounded-xl"
              >
                <Text className="text-center text-gray-600">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteAccount}
                className="flex-1 p-4 ml-2 bg-red-600 rounded-xl"
              >
                <Text className="font-semibold text-center text-white">
                  Delete Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

// COMPONENTS 
const ProfileItem = ({
  icon,
  title,
  onPress,
}: {
  icon: any;
  title: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center justify-between p-4 border-b border-gray-100"
  >
    <View className="flex-row items-center">
      <View className="p-2 mr-4 bg-gray-100 rounded-xl">
        <Feather name={icon} size={18} color="#4B5563" />
      </View>
      <Text className="text-base text-gray-700">{title}</Text>
    </View>
    <Feather name="chevron-right" size={18} color="#D1D5DB" />
  </TouchableOpacity>
);

export default Profile;
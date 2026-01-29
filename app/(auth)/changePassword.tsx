import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Validator } from '../../util/Validations'; // Using your custom validator
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../../FierbaseConfig';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async () => {
    // 1. Basic Validations
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Alert.alert("Error", "All fields are required.");
    }

    if (!Validator.isPassword(newPassword)) {
      return Alert.alert("Invalid Password", "New password must be more than 5 characters.");
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert("Mismatch", "New password and confirmation do not match.");
    }

    try {
      const user = auth.currentUser;
      if (user && user.email) {
        // 2. Re-authenticate user (Firebase requirement for sensitive changes)
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // 3. Update the password
        await updatePassword(user, newPassword);
        
        Alert.alert("Success", "Password updated successfully!", [
          { text: "OK", onPress: () => router.back() }
        ]);
      }
    } catch (error: any) {
      console.error(error.code);
      Alert.alert("Error", "Current password may be incorrect or session expired.");
    }
  };

  return (
    <ScrollView 
      className="bg-white" 
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
    >
      <View className="p-8">
        
        {/* Header */}
        <View className="items-center mb-10">
          <Text className="text-3xl font-extrabold text-gray-800">Change Password</Text>
          <Text className="px-4 mt-3 text-center text-gray-500">
            Create a strong password to keep your account secure.
          </Text>
        </View>

        {/* Inputs */}
        <View className="space-y-4">
          <View className="mt-4">
            <Text className="mb-2 font-medium text-gray-600 mlq-1">New Password</Text>
            <TextInput
              className="p-4 text-gray-800 border border-gray-200 rounded-2xl bg-gray-50"
              placeholder="••••••••"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
          </View>

          <View className="mt-4">
            <Text className="mb-2 ml-1 font-medium text-gray-600">Confirm New Password</Text>
            <TextInput
              className="p-4 text-gray-800 border border-gray-200 rounded-2xl bg-gray-50"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className="items-center p-4 mt-10 bg-gray-800 shadow-lg rounded-2xl"
          onPress={handleChangePassword}
        >
          <Text className="text-lg font-bold text-white">Update Password</Text>
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity onPress={() => router.back()} className="mt-6">
          <Text className="font-bold text-center text-gray-400">Cancel</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
};

export default ChangePassword;
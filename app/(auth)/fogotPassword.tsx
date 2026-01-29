import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import EmailSender from '../../util/EmailSender'; // instance import

const ForgotPassword = () => {
  const [email, setEmail] = useState('');

  const handleReset = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    try {
      await EmailSender.sendEmail(
        email,
        `Hi! Click this link to reset your password: https://yourapp.com/reset`
      );

      Alert.alert("Success", "Reset link has been sent to your email!");
    } catch (error) {
      Alert.alert("Error", "Failed to send email. Try again later.");
    }
  };

  return (
    <ScrollView 
      className="bg-white" 
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
    >
      <View className="p-8">
        <View className="items-center mb-10">
          <Text className="text-3xl font-extrabold text-center text-gray-800">
            Forgot Password?
          </Text>
          <Text className="px-4 mt-3 text-center text-gray-500">
            Don't worry! Enter your email below to receive a password reset link.
          </Text>
        </View>

        <View className="mb-8">
          <Text className="mb-2 ml-1 font-medium text-gray-600">Email Address</Text>
          <TextInput
            className="p-4 text-gray-800 border border-gray-200 rounded-2xl bg-gray-50"
            placeholder="example@mail.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          className="items-center p-4 bg-gray-800 shadow-lg rounded-2xl"
          onPress={handleReset}
        >
          <Text className="text-lg font-bold text-white">Send Reset Link</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.back()} 
          className="mt-10"
        >
          <Text className="font-bold text-center text-gray-800">
            Back to Login
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ForgotPassword;

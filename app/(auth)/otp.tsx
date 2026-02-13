import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';

const OTPVerify = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text.length !== 0 && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Move to previous input on backspace
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    router.push("/changePassword")
  };

  return (
    <ScrollView 
      className="bg-white" 
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
    >
      <View className="p-8">
        
        {/* Header */}
        <View className="items-center mb-10">
          <Text className="text-3xl font-extrabold text-gray-800">Verification</Text>
          <Text className="px-4 mt-3 text-center text-gray-500">
            We sent a 4-digit code to your email. Enter it below to continue.
          </Text>
        </View>

        {/* OTP Inputs Box */}
        <View className="flex-row justify-between px-4 mb-10">
          {otp.map((digit, index) => (
            <TextInput
              key={index}
            //   ref={(el) => (inputs.current[index] = el)}
              className="w-16 h-16 text-2xl font-bold text-center text-gray-800 border-2 border-gray-200 rounded-2xl bg-gray-50 focus:border-gray-800"
              maxLength={1}
              keyboardType="number-pad"
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          className="items-center p-4 bg-gray-800 shadow-lg rounded-2xl"
          onPress={handleVerify}
        >
          <Text className="text-lg font-bold text-white">Verify Code</Text>
        </TouchableOpacity>

        {/* Resend Link */}
        <View className="flex-row justify-center mt-10">
          <Text className="text-gray-500">Didn't receive the code? </Text>
          <TouchableOpacity onPress={() => Alert.alert("Sent", "New code sent!")}>
            <Text className="font-bold text-gray-800">Resend</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
};

export default OTPVerify;
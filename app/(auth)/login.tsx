import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native'
import React, { useState } from 'react'
import { router } from 'expo-router'
import { login } from "../../service/authService"
import { Validator } from '../../util/validations'
// 1. Import Feather icons
import { Feather } from '@expo/vector-icons';

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // 2. Add state for visibility
  const [passwordVisible, setPasswordVisible] = useState(false);

  function loginFunction() {    
    if (!email || !password) {
      Alert.alert("Error", "Email and password are required");
      return;
    }

    if (!Validator.isEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    login(email, password);
  }

  return (
    <ScrollView className="bg-white">
      <View className="p-6">

        {/* Logo */}
        <View className="items-center mt-10 mb-10">
          <Image
            source={require('../../assets/images/bL.png')}
            className="w-32 h-32"
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-gray-800">
            Welcome Back
          </Text>
          <Text className="text-gray-500">
            Please sign in to continue
          </Text>
        </View>

        {/* Email */}
        <View className="mb-4">
          <Text className="mb-2 ml-1 text-gray-600">Email Address</Text>
          <TextInput
            className="p-4 border border-gray-300 rounded-2xl bg-gray-50"
            placeholder="example@mail.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password */}
        <View className="mb-2">
          <Text className="mb-2 ml-1 text-gray-600">Password</Text>
          <View className="relative flex-row items-center">
            <TextInput
              className="flex-1 p-4 border border-gray-300 rounded-2xl bg-gray-50"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              // 3. Connect the state here
              secureTextEntry={!passwordVisible} 
            />
            {/* 4. The Eye Icon Button */}
            <TouchableOpacity 
              onPress={() => setPasswordVisible(!passwordVisible)}
              className="absolute right-4"
            >
              <Feather 
                name={passwordVisible ? "eye" : "eye-off"} 
                size={20} 
                color="#6B7280" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          className="items-center p-4 mt-8 bg-gray-700 rounded-2xl"
          onPress={loginFunction}
        >
          <Text className="text-lg font-bold text-white">Login</Text>
        </TouchableOpacity>

        {/* Sign Up */}
        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-600">Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text className="font-bold text-gray-700">
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={() => router.push('/fogotPassword')}>
            <Text className="mt-3 font-bold text-center text-gray-700">Forgot Password?</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  )
}

export default Login
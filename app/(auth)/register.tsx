import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native'
import React, { useState } from 'react'
import { router } from 'expo-router';
import { registration } from "../../service/authService"
import { Validator } from '../../util/validations';
// 1. Import the icon library
import { Feather } from '@expo/vector-icons';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2. State for visibility toggles
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  // register user
  function register() {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Missing Information", "Please fill in all the details.");
      return;
    }

    if (!Validator.isEmail(email)) {
      return Alert.alert("Invalid Email", "Please enter a valid email address.");
    }

    if (!Validator.isName(name)) {
      return Alert.alert("Invalid Name", "Name should only contain letters.");
    }

    if (!Validator.isPassword(password)) {
      return Alert.alert("Invalid Password", "The Password must have more than 6 characters.");
    }

    if (password !== confirmPassword) {
      return Alert.alert("Password Mismatch", "Passwords do not match.");
    }

    registration(name, email, password);
    clearText();
    router.push("/login");
    return Alert.alert("Success", "User Registered Successfully!");
  }

  function clearText() {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-white">
      <View className="justify-center flex-1 p-6">
        
        {/* Header Section */}
        <View className="items-center mb-8">
          <Image
            source={require('../../assets/images/bL.png')}
            className="w-32 h-32"
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-gray-800">Create Account</Text>
          <Text className="text-gray-500">Join us to get started</Text>
        </View>

        {/* Input Fields */}
        <View>
          {/* Name Field */}
          <View className="mb-4">
            <Text className="mb-2 ml-1 text-gray-600">Full Name</Text>
            <TextInput
              className="p-4 border border-gray-300 rounded-2xl bg-gray-50"
              placeholder="Your Name"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Email Field */}
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

          {/* Password Field */}
          <View className="mb-4">
            <Text className="mb-2 ml-1 text-gray-600">Password</Text>
            <View className="relative flex-row items-center">
              <TextInput
                className="flex-1 p-4 border border-gray-300 rounded-2xl bg-gray-50"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
              />
              <TouchableOpacity 
                onPress={() => setPasswordVisible(!passwordVisible)}
                className="absolute right-4"
              >
                <Feather name={passwordVisible ? "eye" : "eye-off"} size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Field */}
          <View className="mb-4">
            <Text className="mb-2 ml-1 text-gray-600">Confirm Password</Text>
            <View className="relative flex-row items-center">
              <TextInput
                className="flex-1 p-4 border border-gray-300 rounded-2xl bg-gray-50"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!confirmVisible}
              />
              <TouchableOpacity 
                onPress={() => setConfirmVisible(!confirmVisible)}
                className="absolute right-4"
              >
                <Feather name={confirmVisible ? "eye" : "eye-off"} size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Register Button */}
        <TouchableOpacity 
          className="items-center p-4 mt-4 bg-gray-700 shadow-md rounded-2xl"
          onPress={register}
        >
          <Text className="text-lg font-bold text-white">Sign Up</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View className="flex-row justify-center mt-6 mb-10">
          <Text className="text-gray-600">Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="font-bold text-gray-700">Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

export default Register
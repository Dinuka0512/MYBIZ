import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native'
import React, { useState } from 'react'
import { router } from 'expo-router';
import { registration } from "../../service/authService"
import { Validator } from '../../util/validations';


const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // register user
  function register(){
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert(
        "Missing Information",
        "Please fill in all the details to create your account."
      )
      return;
    }

    if(!Validator.isEmail(email)){
      return Alert.alert("Invalid Email", "Please enter a valid email address.");
    }

    if(!Validator.isName(name)){
      return Alert.alert("Invalid Name", "Name should only contain letters.");
    }

    // 1. Check Length First
    if (!Validator.isPassword(password)) {
      return Alert.alert("Invalid Password", "The Password must have more than 6 characters.");
    }

    // 2. Check Match Second
    if (password !== confirmPassword) {
      return Alert.alert(
        "Password Mismatch",
        "Your password and confirm password do not match. Please try again."
      );
    }

    
    registration(name, email, password);
    clearText();
    router.push("/login");
    return alert("User Registed Successfuly..")
  }

  // clear_Text
  function clearText(){
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    // ScrollView is better for Register screens in case the keyboard covers inputs
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
        <View className="space-y-4">
          {/* Name Field */}
          <View>
            <Text className="mb-2 ml-1 text-gray-600">Full Name</Text>
            <TextInput
              className="p-4 border border-gray-300 rounded-2xl bg-gray-50"
              placeholder="Your Name"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Email Field */}
          <View>
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
          <View>
            <Text className="mb-2 ml-1 text-gray-600">Password</Text>
            <TextInput
              className="p-4 border border-gray-300 rounded-2xl bg-gray-50"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Confirm Password Field */}
          <View>
            <Text className="mb-2 ml-1 text-gray-600">Confirm Password</Text>
            <TextInput
              className="p-4 border border-gray-300 rounded-2xl bg-gray-50"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
        </View>

        {/* Register Button */}
        <TouchableOpacity 
          className="items-center p-4 mt-8 bg-gray-700 shadow-md rounded-2xl"
          onPress={() =>register()}
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
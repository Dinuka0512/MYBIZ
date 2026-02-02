import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import Index from "./index";

import Home from "./home";
import Customers from "./customer";
import Items from "./item";
import Sales from "./sales";
import Profile from "./profile";


const _layout = () => {  
  const [goto, setGoto] = useState(1);
  function findNavigation() {
    switch (goto) {
      case 1:
        return <Home />;
      case 2:
        return <Customers />;
      case 3:
        return <Items />;
      case 4:
        return <Sales />;
      case 5:
        return <Profile />;
      default:
        return <Home />;
    }
  }

  return (
    <View className="flex-1 bg-white">

      <Index/>
      {/* Screen content */}
      <View className="flex-1">
        {findNavigation()}
      </View>

      {/* Bottom Navigation */}
      <View className="border-t border-gray-200 mb-14">
        <View className="flex-row items-center justify-around h-16">

          <TouchableOpacity onPress={() => setGoto(1)} className="items-center">
            <Ionicons name="home-outline" size={24} />
            <Text className="text-xs">Home</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setGoto(2)} className="items-center">
            <Ionicons name="people-outline" size={24} />
            <Text className="text-xs">Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setGoto(3)} className="items-center">
            <Ionicons name="cube-outline" size={24} />
            <Text className="text-xs">Item</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setGoto(4)} className="items-center">
            <Ionicons name="cart-outline" size={24} />
            <Text className="text-xs">Sales</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setGoto(5)} className="items-center">
            <Ionicons name="person-circle-outline" size={24} />
            <Text className="text-xs">Profile</Text>
          </TouchableOpacity>

        </View>
      </View>

    </View>
  );
};

export default _layout;

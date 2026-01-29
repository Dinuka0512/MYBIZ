import { Slot } from 'expo-router'
import { Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

const _layout = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      
      {/* Screen content */}
      <View className="flex-1">
        <Slot />
      </View>

      {/* Bottom Navigation */}
      <View className="flex items-center justify-center w-full h-16">
        {/* Yellow bar centered inside red container */}
        <View className="flex-row items-center justify-around w-full p-2 border-t-2 border-gray-200">
          
          <TouchableOpacity className="items-center justify-center">
            <Ionicons name="home-outline" size={24} color="#000" />
            <Text className="mt-1 text-xs text-black">Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="items-center justify-center">
            <Ionicons name="people-outline" size={24} color="#000" />
            <Text className="mt-1 text-xs text-black">Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center justify-center">
            <Ionicons name="cube-outline" size={24} color="#000" />
            <Text className="mt-1 text-xs text-black">Item</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="items-center justify-center">
            <Ionicons name="cart-outline" size={24} color="#000" />
            <Text className="mt-1 text-xs text-black">Sales</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="items-center justify-center">
            <Ionicons name="person-circle-outline" size={24} color="#000" />
            <Text className="mt-1 text-xs text-black">Profile</Text>
          </TouchableOpacity>

        </View>
      </View>

    </SafeAreaView>
  )
}

export default _layout

import { useLocalSearchParams } from 'expo-router'
import { View, Text, Image } from 'react-native'

const Index = () => {
  const params = useLocalSearchParams();
  console.log(params)
  return (
      <View className="justify-center w-full pb-8 pl-2 bg-gray-900 pt-14 h-28">
      
        <Image
          source={require('../../assets/images/wL.png')}
          className="self-start w-36 h-36" 
          resizeMode="contain"
        />
      </View>
  )
}

export default Index
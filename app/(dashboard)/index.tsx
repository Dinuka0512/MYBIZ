import { View, Text, Image } from 'react-native'

const Index = () => {
  return (
      <View className="justify-center w-full h-24 p-4 bg-gray-900">
      
        <Image
          source={require('../../assets/images/wL.png')}
          className="self-start w-36 h-36" 
          resizeMode="contain"
        />
      </View>
  )
}

export default Index
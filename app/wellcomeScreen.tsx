import {
  View,
  Image,
  Animated
} from 'react-native'
import React, { useEffect, useRef } from 'react'
import { router } from 'expo-router'

const Welcome = () => {

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  useEffect(() => {

    // Start animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true
      })
    ]).start()

    // Navigate after 2 seconds
    const timer = setTimeout(() => {
      router.replace('/login')   // use replace for splash/welcome
    }, 1000)

    return () => clearTimeout(timer)

  }, [])

  return (
    <View className="justify-center flex-1 bg-white">

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
        className="items-center"
      >
        <Image
          source={require('../assets/images/bL.png')}
          className="h-20 w-44"
          resizeMode="contain"
        />
      </Animated.View>

    </View>
  )
}

export default Welcome

import { Redirect, router } from 'expo-router'
import WelcomeScreen from './wellcomeScreen' // Create this as separate file or include here
import '../global.css'

// Check if user is authenticated - replace with your auth logic
const isAuthenticated = false // Change this based on your auth state

const Index = () => {
  return <WelcomeScreen />
}

export default Index
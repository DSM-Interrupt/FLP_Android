import Start from "./app/screens/start"
import { createStackNavigator } from "@react-navigation/stack"
import { NavigationContainer } from "@react-navigation/native"
import Login from "./app/screens/login"
import Signup from "./app/screens/signup"
import Member from "./app/screens/member"
import { RootStackParamList } from "./app/types/navigation"

export default function App() {
    const Stack = createStackNavigator<RootStackParamList>()

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="start"
                screenOptions={{
                    headerShown: false,
                    headerStyle: {
                        backgroundColor: "#fff",
                        shadowColor: "transparent",
                        elevation: 0,
                    },
                }}
            >
                <Stack.Screen name="start" component={Start} />
                <Stack.Screen name="login" component={Login} />
                <Stack.Screen name="signup" component={Signup} />
                <Stack.Screen name="member" component={Member} />
            </Stack.Navigator>
        </NavigationContainer>
    )
}

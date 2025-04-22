import Start from "./app/screens/start"
import { createStackNavigator } from "@react-navigation/stack"
import { NavigationContainer } from "@react-navigation/native"
import Login from "./app/screens/login"

export default function App() {
    const Stack = createStackNavigator()

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="시작"
                screenOptions={{
                    headerShown: false,
                    headerStyle: {
                        backgroundColor: "#fff",
                        shadowColor: "transparent",
                        elevation: 0,
                    },
                }}
            >
                <Stack.Screen name="시작" component={Start} />
                <Stack.Screen name="로그인" component={Login} />
            </Stack.Navigator>
        </NavigationContainer>
    )
}

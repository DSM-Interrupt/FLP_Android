import { StyleSheet, View, Text } from "react-native"
import TextInput from "../components/common/TextInput"
import { useState } from "react"
import LogoContainer from "../components/LogoContainer"
import Button from "../components/common/Button"
import { colorTable } from "../constants"
import { fontTable } from "../constants"
import { RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { RootStackParamList } from "../types/navigation"

interface props {
    navigation: NativeStackNavigationProp<RootStackParamList, "login">
    route: RouteProp<RootStackParamList, "login">
}

function Login({ navigation, route }: props) {
    const { role } = route.params
    const [data, setData] = useState({
        userId: "",
        password: "",
    })

    const changeHandler = (text: string, id: string) => {
        setData({ ...data, [id]: text })
    }

    const loginHandler = () => {
        if (role == "admin") {
            // 어드민 로그인
        } else {
            // 멤버 로그인
        }
        navigation.navigate(role == "admin" ? "admin" : "member")
    }

    return (
        <>
            <View style={styles.container}>
                <LogoContainer />

                <View style={styles.inputContainer}>
                    <TextInput
                        label="아이디"
                        placeholder="아이디를 입력하세요"
                        value={data.userId}
                        id="userId"
                        onChange={changeHandler}
                    />
                    <TextInput
                        label="비밀번호"
                        placeholder="비밀번호를 입력하세요"
                        password={true}
                        value={data.password}
                        onChange={changeHandler}
                    />
                </View>

                <View style={styles.buttonContainer}>
                    <Button text="로그인" onPress={loginHandler} />
                    <Text style={styles.text}>
                        회원이 아니신가요?{"  "}
                        <Text
                            style={styles.accent}
                            onPress={() =>
                                navigation.navigate("signup", { role })
                            }
                        >
                            회원가입
                        </Text>
                    </Text>
                </View>
            </View>
        </>
    )
}

export default Login

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        backgroundColor: "white",
        alignItems: "center",
        justifyContent: "center",
        gap: 50,
    },
    inputContainer: {
        width: "90%",
        gap: 15,
    },
    buttonContainer: {
        width: "90%",
        gap: 5,
    },
    text: {
        width: "100%",
        textAlign: "center",
        ...fontTable["label"][2],
    },
    accent: {
        color: `${colorTable["main"]["light"][500]}`,
    },
})

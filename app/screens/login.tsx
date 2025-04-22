import { StyleSheet, View, Text } from "react-native"
import TextInput from "../components/common/TextInput"
import { useState } from "react"
import LogoContainer from "../components/LogoContainer"
import Button from "../components/common/Button"
import { colorTable } from "../constants"

function Login() {
    const [id, setId] = useState<string>("")
    const [password, setPassword] = useState<string>("")

    return (
        <>
            <View style={styles.container}>
                <LogoContainer />

                <View style={styles.inputContainer}>
                    <TextInput
                        label="아이디"
                        placeholder="아이디를 입력하세요"
                        value={id}
                        onChange={(text) => setId(text)}
                    />
                    <TextInput
                        label="비밀번호"
                        placeholder="비밀번호를 입력하세요"
                        password={true}
                        value={password}
                        onChange={(text) => setPassword(text)}
                    />
                </View>

                <View style={styles.buttonContainer}>
                    <Button text="로그인" />
                    <Text style={styles.text}>
                        회원이 아니신가요?{" "}
                        <Text style={styles.accent}>회원가입</Text>
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
    },
    text: {
        width: "100%",
        textAlign: "center",
    },
    accent: {
        color: `${colorTable["main"]["light"][500]}`,
    },
})

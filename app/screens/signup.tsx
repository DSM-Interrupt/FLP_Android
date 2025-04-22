import { StyleSheet, View, Text } from "react-native"
import TextInput from "../components/common/TextInput"
import { useState } from "react"
import LogoContainer from "../components/LogoContainer"
import Button from "../components/common/Button"
import { colorTable, fontTable } from "../constants"

function Signup({ navigation }: any) {
    const [name, setName] = useState<string>("")
    const [id, setId] = useState<string>("")
    const [password, setPassword] = useState<string>("")

    return (
        <>
            <View style={styles.container}>
                <LogoContainer />

                <View style={styles.inputContainer}>
                    <TextInput
                        label="이름"
                        placeholder="이름을 입력하세요"
                        value={name}
                        onChange={(text) => setName(text)}
                    />
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
                    <Button text="회원가입" />
                    <Text style={styles.text}>
                        이미 회원이신가요?{"  "}
                        <Text
                            style={styles.accent}
                            onPress={() => navigation.navigate("로그인")}
                        >
                            로그인
                        </Text>
                    </Text>
                </View>
            </View>
        </>
    )
}

export default Signup

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

import { View, Text, TouchableOpacity } from "react-native"
import { StyleSheet } from "react-native"
import LogoContainer from "../components/LogoContainer"
import { colorTable, fontTable } from "../constants"

function Start() {
    return (
        <View style={styles.container}>
            <LogoContainer />

            <Text style={{ ...fontTable["heading"][3] }}>
                역할을 선택해주세요.
            </Text>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>어드민</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>멤버</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default Start

const styles = StyleSheet.create({
    container: {
        width: "100%",
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        gap: 48,
    },
    buttonContainer: {
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    button: {
        width: "70%",
        height: 60,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: `${colorTable["main"]["light"][400]}`,
    },
    buttonText: {
        color: "white",
        ...fontTable["subTitle"][2],
    },
})

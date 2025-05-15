import { StyleSheet, View, Text, TouchableOpacity } from "react-native"
import { colorTable } from "../constants"
import Ionicons from "@expo/vector-icons/Ionicons"

interface props {
    name: string
    danger: number
    onPress?: () => void
}

function Person({ name, danger, onPress }: props) {
    const location = !danger
        ? "안전 구역"
        : danger == 1
        ? "경고 구역"
        : danger == 2
        ? "위험 구역"
        : "이탈 상태"

    const levelColors = [
        `${colorTable["main"]["light"][500]}`,
        `${colorTable["main"]["light"][700]}`,
        `${colorTable["error"]["dark"]}`,
        `${colorTable["error"]["light"]}`,
    ]

    return (
        <>
            <TouchableOpacity style={styles.container} onPress={onPress}>
                <View style={styles.profile}>
                    <Ionicons name="person" size={30} color="gray" />
                    <Text style={styles.name}>{name}</Text>
                </View>

                <Text
                    style={{
                        ...styles.location,
                        color: `${levelColors[danger]}`,
                    }}
                >
                    {location}
                </Text>
            </TouchableOpacity>
        </>
    )
}

export default Person

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: 50,
        borderRadius: 12,
        backgroundColor: "white",
        shadowColor: "black",
        shadowOffset: {
            width: 1,
            height: 1,
        },
        shadowOpacity: 0.25,
        elevation: 5,
        flexDirection: "row",
        padding: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    profile: {
        flexDirection: "row",
        gap: 15,
        justifyContent: "center",
        alignItems: "center",
    },
    name: {
        fontSize: 16,
    },
    location: {
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: "auto",
    },
})

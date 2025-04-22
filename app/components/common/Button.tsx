import { StyleSheet, Text, TouchableOpacity } from "react-native"
import { colorTable } from "../../constants"

interface props {
    text?: string
    onPress?: () => void
}

function Button({ text, onPress }: props) {
    return (
        <>
            <TouchableOpacity style={styles.container} onPress={onPress}>
                <Text style={styles.textStyle}>{text}</Text>
            </TouchableOpacity>
        </>
    )
}

export default Button

const styles = StyleSheet.create({
    container: {
        backgroundColor: `${colorTable["main"]["light"][500]}`,
        width: "100%",
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 8,
    },
    textStyle: {
        color: "white",
        fontSize: 16,
    },
})

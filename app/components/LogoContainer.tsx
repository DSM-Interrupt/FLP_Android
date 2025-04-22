import { Image, View } from "react-native"
import { StyleSheet } from "react-native"

function LogoContainer() {
    return (
        <View>
            <Image
                source={require("../assets/splash.png")}
                style={styles.image}
            />
        </View>
    )
}

export default LogoContainer

const styles = StyleSheet.create({
    image: {
        width: 135,
        height: 140,
        marginBottom: 48,
    },
})

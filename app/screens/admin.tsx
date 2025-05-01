import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"
import Map from "../components/Map"
import MyBottomSheet from "../components/common/BottomSheet"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import Ionicons from "@expo/vector-icons/Ionicons"
import { colorTable } from "../constants"

function Admin() {
    return (
        <>
            <BottomSheetModalProvider>
                <Map />

                <MyBottomSheet>
                    <View style={styles.container}>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.button}>
                                <Ionicons name="locate" style={styles.icon} />
                            </TouchableOpacity>
                            <Text style={styles.buttonText}>반경 설정</Text>
                        </View>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.button}>
                                <Ionicons
                                    style={styles.icon}
                                    name="people-circle-sharp"
                                />
                            </TouchableOpacity>
                            <Text style={styles.buttonText}>인원 확인</Text>
                        </View>
                    </View>
                </MyBottomSheet>
            </BottomSheetModalProvider>
        </>
    )
}

export default Admin

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 50,
    },
    buttonContainer: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        width: 100,
    },
    button: {
        alignItems: "center",
        justifyContent: "center",
        width: 70,
        height: 70,
    },
    icon: {
        fontSize: 70,
        color: `${colorTable["main"]["light"][500]}`,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
    },
})

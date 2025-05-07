import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"
import Map from "../components/Map"
import MyBottomSheet from "../components/common/BottomSheet"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import Ionicons from "@expo/vector-icons/Ionicons"
import { colorTable } from "../constants"
import MyModal from "../components/Modal"
import React, { useState } from "react"

function Admin() {
    const center = { latitude: 37.5665, longitude: 126.978 }
    const radii = { safe: 100, warning: 200, danger: 300 }

    const [show, setShow] = useState<boolean>(false)

    return (
        <>
            {show && <MyModal show={show} setShow={setShow} />}
            <BottomSheetModalProvider>
                <Map center={center} radii={radii} />

                <MyBottomSheet>
                    <View style={styles.container}>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.button}
                                onPress={() => setShow(true)}
                            >
                                <Ionicons name="locate" style={styles.icon} />
                            </TouchableOpacity>
                            <Text
                                allowFontScaling={false}
                                adjustsFontSizeToFit={false}
                                style={styles.buttonText}
                            >
                                반경
                            </Text>
                        </View>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.button}>
                                <Ionicons
                                    style={styles.icon}
                                    name="people-circle-sharp"
                                />
                            </TouchableOpacity>
                            <Text
                                allowFontScaling={false}
                                adjustsFontSizeToFit={false}
                                style={styles.buttonText}
                            >
                                인원
                            </Text>
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
        gap: 150,
    },
    buttonContainer: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: 100,
    },
    button: {
        alignItems: "center",
        justifyContent: "center",
        width: 70,
        height: 70,
    },
    icon: {
        fontSize: 60,
        color: `${colorTable["main"]["light"][500]}`,
    },
    buttonText: {
        fontSize: 16,
        textAlign: "center",
    },
})

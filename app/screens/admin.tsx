import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"
import Map from "../components/Map"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import Ionicons from "@expo/vector-icons/Ionicons"
import { colorTable } from "../constants"
import MyModal from "../components/Modal"
import React, { useRef, useState } from "react"
import MyBottomSheet, {
    MyBottomSheetRef,
} from "../components/common/BottomSheet"
import Person from "../components/Person"

function Admin() {
    const center = { latitude: 37.5665, longitude: 126.978 }
    const radii = { safe: 100, warning: 200, danger: 300 }

    const [show, setShow] = useState<boolean>(false)
    const bottomSheetRef = useRef<MyBottomSheetRef>(null)

    return (
        <>
            {show && <MyModal show={show} setShow={setShow} />}
            <BottomSheetModalProvider>
                <Map center={center} radii={radii} />

                <MyBottomSheet ref={bottomSheetRef}>
                    <View style={styles.container}>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.button}
                                onPress={() => setShow(true)}
                            >
                                <Ionicons name="locate" style={styles.icon} />
                            </TouchableOpacity>
                            <Text style={styles.buttonText}>반경</Text>
                        </View>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.button}
                                onPress={() =>
                                    bottomSheetRef.current?.presentToIndex(1)
                                }
                            >
                                <Ionicons
                                    style={styles.icon}
                                    name="people-circle-sharp"
                                />
                            </TouchableOpacity>
                            <Text style={styles.buttonText}>인원</Text>
                        </View>
                    </View>

                    <View style={styles.peopleContainer}>
                        <Person name="서지유" danger={1} />
                        <Person name="서지유" danger={1} />
                        <Person name="서지유" danger={1} />
                        <Person name="서지유" danger={1} />
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
    peopleContainer: {
        marginTop: 50,
        width: "100%",
        gap: 10,
    },
})

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"
import Map from "../components/Map"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import Ionicons from "@expo/vector-icons/Ionicons"
import { colorTable } from "../constants"
import MyModal from "../components/common/Modal"
import React, { useRef, useState } from "react"
import MyBottomSheet, {
    MyBottomSheetRef,
} from "../components/common/BottomSheet"
import Person from "../components/Person"
import TextInput from "../components/common/TextInput"

function Admin() {
    const center = { latitude: 37.5665, longitude: 126.978 }
    const radii = { safe: 100, warning: 200, danger: 300 }

    const [show, setShow] = useState<boolean>(false)
    const bottomSheetRef = useRef<MyBottomSheetRef>(null)
    const [safe, setSafe] = useState<string>("100")
    const [warning, setWarning] = useState<string>("200")
    const [danger, setDanger] = useState<string>("300")
    const [error, setError] = useState<boolean>(false)

    const submitHandler = () => {
        const s = parseInt(safe)
        const w = parseInt(warning)
        const d = parseInt(danger)
        if (s < w && w < d) {
            setShow(false)
        } else {
            setError(true)
        }
    }

    const dummy = [
        {
            name: "서지유",
            danger: 1,
        },
        {
            name: "홍길동",
            danger: 0,
        },
        {
            name: "김철수",
            danger: 2,
        },
        {
            name: "김영희",
            danger: 3,
        },
    ]

    return (
        <>
            {show && (
                <MyModal show={show}>
                    <View style={styles.form}>
                        <TextInput
                            label="안전구역"
                            type="number-pad"
                            value={safe}
                            onChange={(e) => {
                                setSafe(e)
                            }}
                        />
                        <TextInput
                            label="경고구역"
                            type="number-pad"
                            value={warning}
                            onChange={(e) => {
                                setWarning(e)
                            }}
                        />
                        <TextInput
                            label="위험영역"
                            type="number-pad"
                            value={danger}
                            onChange={(e) => {
                                setDanger(e)
                            }}
                        />
                    </View>

                    {error && (
                        <Text
                            allowFontScaling={false}
                            adjustsFontSizeToFit={false}
                            style={{
                                color: `${colorTable["error"]["light"]}`,
                                fontSize: 14,
                            }}
                        >
                            {"구역 크기는 안전 < 경고 < 위험이어야합니다."}
                        </Text>
                    )}

                    <View style={styles.buttonWrapper}>
                        <TouchableOpacity
                            onPress={() => {
                                setShow(false)
                            }}
                            style={{
                                ...styles.button1,
                                backgroundColor: "#00000050",
                            }}
                        >
                            <Text>닫기</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={submitHandler}
                            style={{
                                ...styles.button1,
                                backgroundColor: `${colorTable["main"]["light"][400]}`,
                            }}
                        >
                            <Text>저장하기</Text>
                        </TouchableOpacity>
                    </View>
                </MyModal>
            )}
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
                        {dummy.map((v, i) => (
                            <Person name={v.name} danger={v.danger} key={i} />
                        ))}
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

    modal: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        gap: 20,
    },
    form: {
        gap: 10,
    },
    button1: {
        width: 145,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 20,
    },
    buttonWrapper: {
        flexDirection: "row",
        gap: 10,
    },
})

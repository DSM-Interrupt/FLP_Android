import React, { SetStateAction, useState } from "react"
import { Modal, StyleSheet, TouchableOpacity, View, Text } from "react-native"
import TextInput from "./common/TextInput"
import { colorTable } from "../constants"

interface props {
    show: boolean
    setShow: React.Dispatch<SetStateAction<boolean>>
}

function MyModal({ show, setShow }: props) {
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

    return (
        <>
            <View style={styles.container}>
                <Modal animationType="fade" transparent={true} visible={show}>
                    <View style={styles.container}>
                        <View style={styles.modal}>
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
                                    {
                                        "구역 크기는 안전 < 경고 < 위험이어야합니다."
                                    }
                                </Text>
                            )}

                            <View style={styles.buttonWrapper}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShow(false)
                                    }}
                                    style={{
                                        ...styles.button,
                                        backgroundColor: "#00000050",
                                    }}
                                >
                                    <Text>닫기</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={submitHandler}
                                    style={{
                                        ...styles.button,
                                        backgroundColor: `${colorTable["main"]["light"][400]}`,
                                    }}
                                >
                                    <Text>저장하기</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </>
    )
}

export default MyModal

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundColor: "#00000050",
        justifyContent: "center",
        alignItems: "center",
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
    button: {
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

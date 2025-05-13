import React, { SetStateAction, useState } from "react"
import { Modal, StyleSheet, TouchableOpacity, View, Text } from "react-native"

interface props {
    show: boolean
    children: React.ReactNode
}

function MyModal({ show, children }: props) {
    return (
        <>
            <View style={styles.container}>
                <Modal animationType="fade" transparent={true} visible={show}>
                    <View style={styles.container}>
                        <View style={styles.modal}>{children}</View>
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

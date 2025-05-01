import React from "react"
import { StyleSheet, View, Text } from "react-native"
import { colorTable } from "../constants"

interface Props {
    level: number
}

function Notice({ level }: Props) {
    const warning = [
        ["현재 안전 구역입니다.", "멀리 가지 않도록 주의하세요."],
        ["현재 주의 구역입니다.", "구역을 넘어가지 않도록 주의하세요."],
        [
            "현재 경고 구역입니다.",
            "위치를 벗어나지 않도록 안전 구역으로 돌아가주세요.",
        ],
    ]

    const levelColors = [
        `${colorTable["main"]["light"][500]}`,
        `${colorTable["error"]["dark"]}`,
        `${colorTable["error"]["light"]}`,
    ]
    const color = levelColors[level]

    return (
        <View style={styles.container}>
            <Text
                allowFontScaling={false}
                adjustsFontSizeToFit={false}
                style={[styles.text, { color: color }]}
            >
                {warning[level][0]}
            </Text>
            <Text
                allowFontScaling={false}
                adjustsFontSizeToFit={false}
                style={[styles.text, { color: "black" }]}
            >
                {warning[level][1]}
            </Text>
        </View>
    )
}

export default Notice

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 50,
        left: "5%",
        width: "90%",
        height: 50,
        backgroundColor: "white",
        borderRadius: 25,
        overflow: "hidden",
        justifyContent: "center",
        shadowColor: "black",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        elevation: 5,
    },
    text: {
        fontSize: 14,
        fontWeight: "bold",
        textAlign: "center",
    },
})

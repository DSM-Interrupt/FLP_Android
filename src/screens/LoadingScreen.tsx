import type React from "react"
import { View, Text, ActivityIndicator, StyleSheet } from "react-native"
import { colorTable } from "../styles/colorTable"

export const LoadingScreen: React.FC = () => {
    const colors = colorTable.main.light
    const grayColors = colorTable.gray.light

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: grayColors[50],
        },
        title: {
            fontSize: 32,
            fontWeight: "bold",
            color: colors[500],
            marginBottom: 20,
        },
        subtitle: {
            fontSize: 16,
            color: grayColors[600],
            marginBottom: 40,
        },
    })

    return (
        <View style={styles.container}>
            <Text style={styles.title}>FLP</Text>
            <Text style={styles.subtitle}>위치 추적 시스템</Text>
            <ActivityIndicator size="large" color={colors[500]} />
        </View>
    )
}

import React, { useEffect, useRef, useState } from "react"
import { StyleSheet, View, Text, Animated, Dimensions } from "react-native"
import { Easing } from "react-native"

interface Props {
    text?: string
}

function Notice({ text = "" }: Props) {
    const translateX = useRef(new Animated.Value(0)).current
    const [textWidth, setTextWidth] = useState(0)
    const screenWidth = Dimensions.get("window").width

    useEffect(() => {
        if (textWidth === 0) return

        const distance = textWidth * 2 + screenWidth
        const duration = distance * 12

        const loop = Animated.loop(
            Animated.timing(translateX, {
                toValue: -distance,
                duration,
                useNativeDriver: true,
                easing: Easing.linear,
            })
        )

        loop.start()
        return () => loop.stop()
    }, [textWidth])

    return (
        <View style={styles.container}>
            <View style={styles.clip}>
                <Animated.View
                    style={{
                        flexDirection: "row",
                        transform: [{ translateX }],
                    }}
                >
                    {[...Array(3)].map((_, i) => (
                        <Text
                            key={i}
                            allowFontScaling={false}
                            numberOfLines={1}
                            ellipsizeMode="clip"
                            onLayout={
                                i === 0
                                    ? (e) =>
                                          setTextWidth(
                                              e.nativeEvent.layout.width
                                          )
                                    : undefined
                            }
                            style={styles.marqueeText}
                        >
                            {text.trim() + "   "}
                        </Text>
                    ))}
                </Animated.View>
            </View>
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
        height: 40,
        backgroundColor: "white",
        borderRadius: 20,
        justifyContent: "center",
        paddingHorizontal: 10,
        elevation: 5,
        zIndex: 10,
    },
    clip: {
        overflow: "hidden",
        width: "100%",
        height: 40,
    },
    marqueeText: {
        fontSize: 13,
        lineHeight: 22,
        height: 40,
        color: "black",
        fontWeight: 800,
        paddingRight: 40,
        includeFontPadding: false,
        textAlignVertical: "center",
        flexShrink: 0,
        flexGrow: 0,
    },
})

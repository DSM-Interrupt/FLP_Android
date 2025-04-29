import { BottomSheetModal } from "@gorhom/bottom-sheet"
import React, { useCallback, useMemo, useRef } from "react"
import { View, Text, Button, StyleSheet } from "react-native"

interface props {
    children?: React.ReactNode
}

function MyBottomSheet({ children }: props) {
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)

    const snapPoints = useMemo(() => ["25%", "50%"], [])

    const handlePresentModalPress = useCallback(() => {
        bottomSheetModalRef.current?.present()
    }, [])

    return (
        <>
            <View style={styles.buttonWrapper}>
                <Button
                    onPress={handlePresentModalPress}
                    title="PRESENT MODAL"
                    color="black"
                />
            </View>

            <BottomSheetModal
                ref={bottomSheetModalRef}
                index={1}
                snapPoints={snapPoints}
            >
                <View style={styles.bottomSheet}>{children}</View>
            </BottomSheetModal>
        </>
    )
}

export default MyBottomSheet

const styles = StyleSheet.create({
    buttonWrapper: {
        position: "absolute",
        top: 40,
        left: 20,
        right: 20,
        zIndex: 100,
    },
    bottomSheet: {
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
})

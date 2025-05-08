import {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetModal,
} from "@gorhom/bottom-sheet"
import React, {
    useCallback,
    useMemo,
    useRef,
    forwardRef,
    useImperativeHandle,
} from "react"
import { View, StyleSheet, TouchableOpacity } from "react-native"
import Feather from "@expo/vector-icons/Feather"

export interface MyBottomSheetRef {
    presentToIndex: (index: number) => void
}

interface props {
    children?: React.ReactNode
}

const MyBottomSheet = forwardRef<MyBottomSheetRef, props>(
    ({ children }, ref) => {
        const bottomSheetModalRef = useRef<BottomSheetModal>(null)
        const snapPoints = useMemo(() => ["20%", "80%"], [])

        const presentToIndex = (index: number) => {
            bottomSheetModalRef.current?.present()
            bottomSheetModalRef.current?.snapToIndex(index)
        }

        useImperativeHandle(ref, () => ({
            presentToIndex,
        }))

        const handlePresentModalPress = useCallback(() => {
            bottomSheetModalRef.current?.present()
        }, [])

        const renderBackdrop = useCallback(
            (props: BottomSheetBackdropProps) => (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                />
            ),
            []
        )

        return (
            <>
                <View style={styles.buttonWrapper}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handlePresentModalPress}
                    >
                        <Feather name="menu" size={24} color="black" />
                    </TouchableOpacity>
                </View>

                <BottomSheetModal
                    ref={bottomSheetModalRef}
                    index={0}
                    snapPoints={snapPoints}
                    backdropComponent={renderBackdrop}
                >
                    <View style={styles.bottomSheet}>{children}</View>
                </BottomSheetModal>
            </>
        )
    }
)

export default MyBottomSheet

const styles = StyleSheet.create({
    buttonWrapper: {
        position: "absolute",
        top: 40,
        right: 20,
        zIndex: -1,
        backgroundColor: "transparent",
    },
    bottomSheet: {
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 2,
    },
    button: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "black",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        elevation: 5,
    },
})

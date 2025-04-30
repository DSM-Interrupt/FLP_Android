import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"
import MyBottomSheet from "../components/common/BottomSheet"
import Map from "../components/Map"
import { Text } from "react-native"

function Member() {
    return (
        <BottomSheetModalProvider>
            <Map />

            <MyBottomSheet>
                <Text>Hello World!</Text>
            </MyBottomSheet>
        </BottomSheetModalProvider>
    )
}

export default Member

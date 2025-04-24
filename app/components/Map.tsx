import React from "react"
import { StyleSheet, View } from "react-native"
import MapView, { Marker } from "react-native-maps"

function Map() {
    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                provider="google"
                initialRegion={{
                    latitude: 37.5665,
                    longitude: 126.978,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                <Marker
                    coordinate={{ latitude: 37.5665, longitude: 126.978 }}
                    title="서울특별시"
                    description="대한민국 수도"
                />
            </MapView>
        </View>
    )
}

export default Map

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
})

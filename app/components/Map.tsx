import React from "react"
import { StyleSheet, View } from "react-native"
import MapView, { Marker } from "react-native-maps"
import Radius from "./Radius"

interface member {
    cordinate: {
        latitude: number
        longitude: number
    }
    name: string
}

interface props {
    center: {
        latitude: number
        longitude: number
    }
    radii: {
        safe: number
        warning: number
        danger: number
    }
    members?: member[]
}

function Map({ center, radii, members }: props) {
    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                provider="google"
                initialRegion={{
                    ...center,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                <Marker
                    coordinate={center}
                    title="서울특별시"
                    description="대한민국 수도"
                />

                {members &&
                    members.map((v, i) => (
                        <Marker
                            coordinate={v.cordinate}
                            title={v.name}
                            pinColor="green"
                            key={i}
                        />
                    ))}

                <Radius center={center} radii={radii} />
            </MapView>
        </View>
    )
}

export default Map

const styles = StyleSheet.create({
    container: {
        flex: 1,
        zIndex: -2,
    },
    map: {
        flex: 1,
    },
})

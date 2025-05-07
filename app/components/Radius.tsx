import { Circle } from "react-native-maps"

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
}

function Radius({ center, radii }: props) {
    return (
        <>
            <Circle
                center={center}
                radius={radii.safe}
                fillColor="transparent"
                strokeColor="#ff3c3258"
                strokeWidth={1}
            />
            <Circle
                center={center}
                radius={radii.warning}
                fillColor="transparent"
                strokeColor="#ff3c3258"
                strokeWidth={1}
            />
            <Circle
                center={center}
                radius={radii.danger}
                fillColor="#ff3c3227"
                strokeColor="#ff3c3258"
                strokeWidth={1}
            />
        </>
    )
}

export default Radius

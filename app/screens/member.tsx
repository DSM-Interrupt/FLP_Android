import Map from "../components/Map"
import Notice from "../components/notice"

function Member() {
    const center = { latitude: 37.5665, longitude: 126.978 }
    const radii = { safe: 100, warning: 200, danger: 300 }

    return (
        <>
            <Notice level={3} />
            <Map center={center} radii={radii} />
        </>
    )
}

export default Member

import Map from "../components/Map"
import Notice from "../components/notice"

function Member() {
    const center = { latitude: 37.5665, longitude: 126.978 }
    const radii = { safe: 100, warning: 200, danger: 300 }

    const members = [
        {
            cordinate: {
                latitude: 37.5648,
                longitude: 126.98,
            },
            name: "서지유",
        },
    ]

    return (
        <>
            <Notice level={3} />
            <Map center={center} radii={radii} members={members} />
        </>
    )
}

export default Member

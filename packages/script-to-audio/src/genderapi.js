export const getGenders = async (namesArr) => {
    try {
        const body = JSON.stringify({
            personalNames: namesArr.map(name => ({ id: '', name }))
        })

        const res = await fetch('https://v2.namsor.com/NamSorAPIv2/api2/json/genderFullBatch', {
            method: 'POST',
            body,
            headers: {
                'X-API-KEY': process.env.NAMESOR_API_KEY,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        })

        const data = await res.json()

        return data?.personalNames

    } catch(e) {
        console.log("Error getting genders", e)
        return []
    }
}
export const getGenders = async (namesArr) => {
    if (!namesArr || !namesArr.length) return []
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

        const dataText = await res.text()

        try {
            return JSON.parse(dataText).personalNames
        } catch(e) {
            console.log('error parsing gender res', dataText)
            throw `genderapi.ts: ${dataText}`
    }


    } catch(e) {
        console.log("Error getting genders", e)
        throw e
    }
}
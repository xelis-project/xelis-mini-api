const fetchInfo = () => {
	return fetch(`https://node.xelis.io/json_rpc`, {
		method: `POST`,
		body: JSON.stringify({
			'id': 1,
			'jsonrpc': `2.0`,
			'method': `get_info`
		})
	})
}

const internalServerErrorResponse = () => {
	return new Response(`Internal Server Error`, {
		status: 500,
		statusText: `Internal Server Error`
	})
}

const circulatingSupplyResponse = async (env) => {
	let value = await env.API.get(`circulating_supply`)
	if (value) {
		return new Response(parseFloat(value))
	} else {
		try {
			const res = await fetchInfo()
			const data = await res.json()
			let circulating_supply = data['result']['circulating_supply'] // this is in atomic value
			circulating_supply = parseFloat(circulating_supply) / Math.pow(10, 8)
			const expirationTtl = 300 // expiration for 5min
			await env.API.put(`circulating_supply`, circulating_supply, { expirationTtl })
			await env.API.put(`circulating_supply_bk`, circulating_supply) // always stays and gets overwritten

			return new Response(circulating_supply)
		} catch (e) {
			console.log(e)

			// try backup
			value = await env.API.get(`circulating_supply_bk`)
			if (value) {
				return new Response(parseFloat(value))
			} else {
				return internalServerErrorResponse()
			}
		}
	}
}

const maxSupplyResponse = () => {
	return new Response(18_400_000)
}

const homeResponse = () => {
	return new Response(`XELIS Mini Api - Use key querystring to fetch data. Ex: ?key=circulating_supply`)
}

const apiFetch = async (request, env, ctx) => {
	const url = new URL(request.url)
	const key = url.searchParams.get('key') || ''

	let res = null
	switch (key) {
		case `circulating_supply`:
			res = await circulatingSupplyResponse(env)
			break
		case `total_supply`:
			// total_suppy is the same as circulating_supply because we don't staking rewards, etc...
			res = await circulatingSupplyResponse(env)
			break
		case `max_supply`:
			res = maxSupplyResponse()
			break
		default:
			res = homeResponse()
			break
	}

	res.headers.append('Access-Control-Allow-Origin', '*')
	return res
}

export default {
	fetch: apiFetch
}
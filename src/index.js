export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url)

		const key = url.searchParams.get('key') || ''

		let value = null
		switch (key) {
			case `circulating_supply`:
				value = await this.getCirculatingSupply(env)
				break
			case `total_supply`:
				// total_suppy is the same as circulating_supply because we don't staking rewards, etc...
				value = await this.getCirculatingSupply(env)
				break
			case `max_supply`:
				value = 18_400_000
				break
			default:
				value = "XELIS Mini Api - Use key querystring to fetch data. Ex: ?key=circulating_supply"
				break
		}

		return new Response(value, {
			headers: {
				//'Content-Type': 'application/json;charset=UTF-8',
				'Access-Control-Allow-Origin': '*'
			}
		})
	},
	async fetchInfo() {
		return fetch(`https://node.xelis.io/json_rpc`, {
			method: `POST`,
			body: JSON.stringify({
				'id': 1,
				'jsonrpc': `2.0`,
				'method': `get_info`
			})
		})
	},
	async getCirculatingSupply(env) {
		let value = await env.API.get(`circulating_supply`)
		if (value) {
			return parseFloat(value)
		} else {
			try {
				const res = await this.fetchInfo()
				const data = await res.json()
				let circulating_supply = data['result']['circulating_supply'] // this is in atomic value
				circulating_supply = parseFloat(circulating_supply) / Math.pow(10, 8)
				const expirationTtl = 300 // expiration for 5min
				await env.API.put(`circulating_supply`, circulating_supply, { expirationTtl })
				await env.API.put(`circulating_supply_bk`, circulating_supply) // always stays and gets overwritten

				return circulating_supply
			} catch (e) {
				console.log(e)

				// try backup
				value = await env.API.get(`circulating_supply_bk`)
				if (value) return parseFloat(value)

				return ''
			}
		}
	},
}

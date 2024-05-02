# XELIS-GEOIP-CACHE

This is a simple caching server for IP geolocation.  
It uses <https://ipwhois.io/> to fetch the data of origin and immediately stores it within Cloudflare KV service.  
This helps avoid overloading the API servers by saving everything to cache.  
Additionally, it also serves as an HTTPS proxy and gives the ability to fetch in batch.
On another note, IP location does not need to be precise or updated regularly, making it perfect for our usecases.  

async function req(route, params = {}, method = "GET") {
    try {
        const isFetch = {
            "GET": true,
            "POST": false,
            "PUT": false,
            "DELETE": false
        };
    
        if (!(method in isFetch)) {
            console.error(`'${method}' is not a valid method`);
            return null;
        }
    
        let url = `/${route}`;
        const useFetch = isFetch[method];
    
        if (useFetch) {
            const queryParams = new URLSearchParams();
    
            for (const [key, value] of Object.entries(params)) {
                queryParams.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
            }
    
            const queryString = queryParams.toString();
            if (queryString) {
                url += `?${queryString}`;
            }
        }
    
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: useFetch ? undefined : JSON.stringify(params)
        });
    
        return await response.json();
    } catch(err) {
        console.error(err)
    }
}

const axios = require('axios')
const HttpsProxyAgent = require("https-proxy-agent")

const removeEmptyValue = obj => {
    if (!(obj instanceof Object)) return {}
    Object.keys(obj).forEach(key => isEmptyValue(obj[key]) && delete obj[key])
    return obj
}

const isEmptyValue = input => {
    /**
     * Scope of empty value: falsy value (except for false and 0),
     * string with white space characters only, empty object, empty array
     */
    return (!input && input !== false && input !== 0) ||
        ((typeof input === 'string' || input instanceof String) && /^\s+$/.test(input)) ||
        (input instanceof Object && !Object.keys(input).length) ||
        (Array.isArray(input) && !input.length)
}

const buildQueryString = params => {
    if (!params) return ''
    return Object.entries(params)
        .map(stringifyKeyValuePair)
        .join('&')
}

/**
 * NOTE: The array conversion logic is different from usual query string.
 * E.g. symbols=["BTCUSDT","BNBBTC"] instead of symbols[]=BTCUSDT&symbols[]=BNBBTC
 */
const stringifyKeyValuePair = ([key, value]) => {
    const valueString = Array.isArray(value) ? `["${value.join('","')}"]` : value
    return `${key}=${encodeURIComponent(valueString)}`
}

const getRequestInstance = (config) => {
    return axios.create({
        ...config
    })
}

const createRequest = (config) => {
    const { baseURL, method, url, ip, port, params, configs } = config
    let headers = configs.headers
    if (configs.headers == undefined) {
        headers = {
            'Content-Type': "application/x-www-form-urlencoded; charset=UTF-8",
            'user-agent': "user-agent: Mozilla/5.0 (Linux; Android 10; SPN-AL00 Build/HUAWEISPN-AL00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/88.0.4324.93 Mobile Safari/537.36 uni-app Html5Plus/1.0 (Immersed/36.0)",
            "Host": "transmission.shouqianpay.com",
            "Cookie": "PHPSESSID=cco3ni7n7t053n2slf4mfkr539; acw_tc=2760826816647030143377022eb0c06fd6c6f12a8f066037a415d2d9dc5b65",
        }
    }
    let reqData = {
        baseURL,
        headers: headers,
        timeout: 5000,
    }
    if (configs.proxy != undefined) {
        reqData.agent = HttpsProxyAgent(configs.proxy)
    }
    if (ip != '' && ip != undefined && port != '' && port != undefined) {
        let httpsAgent = new HttpsProxyAgent({ host: ip, port: port })
        reqData.proxy = false;
        reqData.httpsAgent = httpsAgent;
    }
    if (method.toUpperCase() == 'POST') {

        return getRequestInstance(reqData).request({
            method,
            url,
            data: params
        })
    } else {
        return getRequestInstance(reqData).request({
            method,
            url
        })
    }

}
const publicRequest = (baseURL, method, path, params = {}, configs = {}) => {
    // params = removeEmptyValue(params)
    params = buildQueryString(params)
    if (params !== '') {
        path = `${path}?${params}`
    }
    return createRequest({
        method: method,
        headers: configs.headers,
        baseURL: baseURL,
        params: params,
        url: path,
        ip: configs.ip,
        port: configs.port,
        configs: configs
    })
}


module.exports = {
    isEmptyValue,
    removeEmptyValue,
    buildQueryString,
    createRequest,
    publicRequest
}

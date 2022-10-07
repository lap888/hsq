const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const crypto = require('crypto');
const { LocalStorage } = require("node-localstorage");
let _g = new LocalStorage('./root');
let _r = new LocalStorage('./register');
let _a = new LocalStorage('./auth');
let data = fs.readFileSync("./data.txt");

const { publicRequest } = require('./util')


const yzUrl = 'http://api.sqhyw.net:81/'
const baseURL = 'http://transmission.shouqianpay.com/'
const orderno = 'ZF2022751403jdqm8G';
const secret = '11cba7c904c94668ab3adea326693ff4';

// 存储
function _G(key, value = '') {
    if (value == '') {
        return _g.getItem(key)
    } else {
        _g.setItem(key, value)
    }
}
function _R(key, value = '') {
    if (value == '') {
        return _r.getItem(key)
    } else {
        _r.setItem(key, value)
    }
}
function _A(key, value = '') {
    if (value == '') {
        return _a.getItem(key)
    } else {
        _a.setItem(key, value)
    }
}
// 延时
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
//登录椰子云短信接码平台
async function loginYzy(name, pwd) {
    let res = await publicRequest(yzUrl, 'GET', 'api/logins', { username: name, password: pwd })
    console.log(`椰子云:${res.data.message} | token:${res.data.token}`)
    return res.data.token;
}
//获取椰子云云余额
async function getYzyBalance(token) {
    let res = await publicRequest(yzUrl, 'GET', 'api/get_myinfo', { token: token })
    console.log(`获取椰子云云余额:${res.data.data[0].money} | ${res.data.message}`)
    return res.data.data[0].money
}
//取卡
async function getYzyMobile(token, pId) {
    let res = await publicRequest(yzUrl, 'GET', 'api/get_mobile', { token: token, project_id: pId })
    console.log(`获取椰子云手机号:${res.data.mobile} | ${res.data.message}`)
    let count = res.data['1分钟内剩余取卡数::']
    let mobile = res.data.mobile;
    if (count <= 10) {
        mobile = 0;
    }
    return mobile
}
// 获取短信
async function getYzyMessage(token, pId, mobile, count = 1) {
    let res = await publicRequest(yzUrl, 'GET', 'api/get_message', { token: token, project_id: pId, phone_num: mobile })
    console.log(`获取椰子云短信${count}次:${res.data.code} | ${res.data.message} | ${res.data.data[0] != undefined ? JSON.stringify(res.data.data[0]) : ''}`)
    let code = 0;
    if (res.data.code == undefined) {
        code = 0;
    } else {
        code = res.data.code
    }
    return code;
}
//释放用户手机号
async function freeYzyMobile(token, pId, mobile) {
    let res = await publicRequest(yzUrl, 'GET', 'api/free_mobile', { token: token, project_id: pId, phone_num: mobile })
    console.log(`叶子云释放手机号:${mobile} | ${res.data.message}`)
}
// 拉黑用户手机号
async function blackYzyMobile(token, pId, mobile) {
    let res = await publicRequest(yzUrl, 'GET', 'api/add_blacklist', { token: token, project_id: pId, phone_num: mobile })
    console.log(`叶子云释放手机号:${mobile} | ${res.data.message}`)
}
// 获取已对接专属
async function getYzyJoin(token, proId) {
    let res = await publicRequest(yzUrl, 'GET', 'api/get_join', { token: token })
    res.data.data.sort((a, b) => a.price - b.price)
    let proIdList = []
    res.data.data.map(v => {
        if (v.project_id == proId) {
            proIdList.push(v)
        }
    })
    console.log(`叶子云获取已对接专属:${JSON.stringify(res.data.data[0])} | ${res.data.message}`)
    return proIdList;
}
//汇收钱 发码接口
async function hsqSendCode(mobile) {
    let timestamp = parseInt(new Date().getTime() / 1000);
    let plantext = 'orderno=' + orderno + ',secret=' + secret + ',timestamp=' + timestamp;
    let md5 = crypto.createHash('md5');
    md5.update(plantext);
    let sign = md5.digest('hex');
    sign = sign.toUpperCase();
    let options = {
        proxy: 'http://forward.xdaili.cn:80',
        headers: {
            'Content-Type': "application/x-www-form-urlencoded; charset=UTF-8",
            'user-agent': "user-agent: Mozilla/5.0 (Linux; Android 10; SPN-AL00 Build/HUAWEISPN-AL00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/88.0.4324.93 Mobile Safari/537.36 uni-app Html5Plus/1.0 (Immersed/36.0)",
            "Host": "transmission.shouqianpay.com",
            "Cookie": "PHPSESSID=cco3ni7n7t053n2slf4mfkr539; acw_tc=2760826816647030143377022eb0c06fd6c6f12a8f066037a415d2d9dc5b65",
            'Proxy-Authorization': 'sign=' + sign + '&orderno=' + orderno + "&timestamp=" + timestamp
        }
    };
    let res = await publicRequest(baseURL, 'POST', 'App/Login/sendCode', { tel: mobile, desc: '邀请注册新用户' }, options)
    console.log(`汇收钱 发码接口:${JSON.stringify(res.data)}`)
}
//汇收钱 注册接口
async function hsqRegister(mobile, code, pwd, cpwd, inviteCode) {
    let timestamp = parseInt(new Date().getTime() / 1000);
    let plantext = 'orderno=' + orderno + ',secret=' + secret + ',timestamp=' + timestamp;
    let md5 = crypto.createHash('md5');
    md5.update(plantext);
    let sign = md5.digest('hex');
    sign = sign.toUpperCase();
    let options = {
        proxy: 'http://forward.xdaili.cn:80',
        headers: {
            'Content-Type': "application/x-www-form-urlencoded; charset=UTF-8",
            'user-agent': "user-agent: Mozilla/5.0 (Linux; Android 10; SPN-AL00 Build/HUAWEISPN-AL00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/88.0.4324.93 Mobile Safari/537.36 uni-app Html5Plus/1.0 (Immersed/36.0)",
            "Host": "transmission.shouqianpay.com",
            "Cookie": "PHPSESSID=cco3ni7n7t053n2slf4mfkr539; acw_tc=2760826816647030143377022eb0c06fd6c6f12a8f066037a415d2d9dc5b65",
            'Proxy-Authorization': 'sign=' + sign + '&orderno=' + orderno + "&timestamp=" + timestamp
        }
    };
    let res = await publicRequest(baseURL, 'POST', 'Weixin/Register/register', { account: mobile, code: code, pwd: pwd, cpwd: cpwd, t: inviteCode }, options)
    console.log(`汇收钱 注册接口:${JSON.stringify(res.data)}`)
    return res.data;
}
//汇收钱 登录接口
async function hsqLogin(mobile, pwd) {
    let res = await publicRequest(baseURL, 'POST', 'App/Login/login', { account: mobile, pwd: pwd, longitude: '', latitude: '' })
    console.log(`汇收钱 登录接口 ${JSON.stringify(res.data)}`)
    let token = res.data.data.token
    return token;
}
//汇收钱 实名认证接口
async function hsqRealName(token, name, card, bankCard, provinceId, cityId, areaId, address, certIndate, endIndate, bank, bankCode, tel) {
    let params = {}
    params.token = token
    params.name = name
    params.card = card
    params.bank_card = bankCard
    params.provinceid = provinceId
    params.cityid = cityId
    params.areaid = areaId

    params.address = address
    params.cert_indate = certIndate
    params.end_indate = endIndate

    params.bank_provinceid = provinceId
    params.bank_cityid = cityId
    params.bank_areaid = areaId

    params.bank = bank
    params.bank_code = bankCode

    params.tel = tel
    params.img3 = `http://storage.shouqianpay.com/${uuidv4}`
    let res = await publicRequest(baseURL, 'POST', 'app/realname/real_name_integration', params)
    console.log(`汇收钱 实名认证接口:${res.data}`)
}
//模拟数据
async function MockData() {
    // 获取总行 bank b_id
    // curl -H 'user-agent: Mozilla/5.0 (Linux; Android 10; SPN-AL00 Build/HUAWEISPN-AL00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/88.0.4324.93 Mobile Safari/537.36 uni-app Html5Plus/1.0 (Immersed/36.0)' -H 'Host: transmission.shouqianpay.com' -H 'Cookie: PHPSESSID=cco3ni7n7t053n2slf4mfkr539; acw_tc=2760826816647858138441784eb0a781b80a6f15029fed05191671d64eac9f' --data "token=74d6f2a50ac6bbdea17e7f3fa11dba39" --compressed 'http://transmission.shouqianpay.com//app/bank/getlist'
    // 获取支行 code
    // curl -H 'user-agent: Mozilla/5.0 (Linux; Android 10; SPN-AL00 Build/HUAWEISPN-AL00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/88.0.4324.93 Mobile Safari/537.36 uni-app Html5Plus/1.0 (Immersed/36.0)' -H 'Host: transmission.shouqianpay.com' -H 'Cookie: PHPSESSID=cco3ni7n7t053n2slf4mfkr539; acw_tc=2760826816647858138441784eb0a781b80a6f15029fed05191671d64eac9f' --data "token=74d6f2a50ac6bbdea17e7f3fa11dba39&branch_name=&bank_id=3" --compressed 'http://transmission.shouqianpay.com//app/bank/getBranchList'

    // 获取地址 1
    // curl -H 'user-agent: Mozilla/5.0 (Linux; Android 10; SPN-AL00 Build/HUAWEISPN-AL00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/88.0.4324.93 Mobile Safari/537.36 uni-app Html5Plus/1.0 (Immersed/36.0)' -H 'Host: transmission.shouqianpay.com' -H 'Cookie: PHPSESSID=cco3ni7n7t053n2slf4mfkr539; acw_tc=2760826816647858138441784eb0a781b80a6f15029fed05191671d64eac9f' --data "token=74d6f2a50ac6bbdea17e7f3fa11dba39" --compressed 'http://transmission.shouqianpay.com//App/Address/choose_address'
    // 获取地址 2
    // curl -H 'user-agent: Mozilla/5.0 (Linux; Android 10; SPN-AL00 Build/HUAWEISPN-AL00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/88.0.4324.93 Mobile Safari/537.36 uni-app Html5Plus/1.0 (Immersed/36.0)' -H 'Host: transmission.shouqianpay.com' -H 'Cookie: PHPSESSID=cco3ni7n7t053n2slf4mfkr539; acw_tc=2760826816647858138441784eb0a781b80a6f15029fed05191671d64eac9f' --data "token=74d6f2a50ac6bbdea17e7f3fa11dba39&id=10" --compressed 'http://transmission.shouqianpay.com//App/Address/choose_address'
    // 获取地址 3
    // curl -H 'user-agent: Mozilla/5.0 (Linux; Android 10; SPN-AL00 Build/HUAWEISPN-AL00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/88.0.4324.93 Mobile Safari/537.36 uni-app Html5Plus/1.0 (Immersed/36.0)' -H 'Host: transmission.shouqianpay.com' -H 'Cookie: PHPSESSID=cco3ni7n7t053n2slf4mfkr539; acw_tc=2760826816647858138441784eb0a781b80a6f15029fed05191671d64eac9f' --data "token=74d6f2a50ac6bbdea17e7f3fa11dba39&id=140" --compressed 'http://transmission.shouqianpay.com//App/Address/choose_address'

    //身份证
    //文本分割
}
function splitHh(str) {
    let snsArr = str.toString().split(/[(\r\n)\r\n]+/);
    snsArr.forEach((item, index) => {
        if (!item) {
            snsArr.splice(index, 1);
        }
    })
    return snsArr;
}
function splitSp(str) {
    let arr = []
    let snsArr = str.toString().split(' ');
    snsArr.forEach((item, index) => {
        if (item == '' || item == ' ') {
            snsArr.splice(index, 1);
        } else {
            arr.push(item)
        }
    })
    return arr;
}
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
//生成密码
function genPwd() {
    let r = Math.random()
    let m = Math.round(r * 10000000)
    let abc = 'a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z';
    let absArr = abc.split(',')
    let n = absArr[getRandomInt(absArr.length)]
    return `${n}${m}`

}
function CardData() {
    let data = {}
    let r = getRandomInt(9);
    let r2 = getRandomInt(29)
    let d1 = `201${r}-0${r == 0 ? 1 : r}-${r2 == 0 ? 01 : r2 <= 9 ? '0' + r2 : r2}`
    let d2 = '长期'
    data.d1 = d1
    data.d2 = d2
    return data;
}

async function run() {
    // let d1 = splitHh(data)
    // console.log(d1)
    // let d2 = splitSp(d1[1])
    // console.log(d2)
    // let i = 0;
    // while (1) {
    //     if (i > 100) {
    //         break;
    //     }
    //     i++;
    //     await sleep(2000)
    //     console.log(i, CardData())
    // }
    // return;

    let inviteCode = '10511168'
    let yzyName = '18333103619'
    let yzyPwd = 'yaya123456'
    let yzyRootProId = '76593'
    let proId = ''

    let token = await loginYzy(yzyName, yzyPwd)
    let joinList = await getYzyJoin(token, yzyRootProId)
    if (joinList.length <= 0) {
        console.log('没有添加专属对接')
        throw '没有添加专属对接'
    }
    proId = joinList[0].key_;
    let i = 0;
    let mobile = ''
    let pwd = ''
    while (i < 1) {
        try {
            let count = 1;
            //余额
            let balance = await getYzyBalance(token)
            if (balance < 1) {
                console.log('余额不足')
                await sleep(30 * 1000);
                continue;
            }
            // 取号
            mobile = await getYzyMobile(token, proId)
            if (mobile == 0) {
                console.log(`第${i}次,手机号短缺`)
                continue;
            }
            // 发码
            await hsqSendCode(mobile)
            // 拿码
            let code = await getYzyMessage(token, proId, mobile, count)
            while (code == 0) {
                await sleep(1000)
                count++;
                if (count > 60) {
                    break;
                }
                code = await getYzyMessage(token, proId, mobile, count)
            }
            if (count > 60) {
                //拉黑
                await blackYzyMobile(token, proId, mobile)
                console.log(`第${i}次,手机号:${mobile},取码${count}次,未收到验证码`)
                continue;
            }
            await sleep(2000)
            //注册
            pwd = genPwd()
            let rInfo = await hsqRegister(mobile, code, pwd, pwd, inviteCode)
            if (rInfo.code == 1) {
                // {"message":"注册成功","code":1}
            }
            //注册记录保存===
            let register = _R('register')
            if (register == null) {
                register = []
            } else {
                register = JSON.parse(register)
            }
            let data = { mobile: mobile, code: code, pwd: pwd, inviteCode: inviteCode }
            console.log(JSON.stringify(data))
            register.push(data)
            let rData = JSON.stringify(register)
            _R('register', rData)
            //==|==
            let mobleRecord = _G('mobleRecord')
            mobleRecord += `手机号:${mobile} | 密码:${pwd} \r\n`
            _G('mobleRecord', mobleRecord)
            //注册记录保存===
            await sleep(5000)
            //实名
            i++
        } catch (error) {
            await blackYzyMobile(token, proId, mobile)
            console.log(mobile, pwd, '系统异常=>', error)
        }
        await sleep(5000)
    }
}
run()
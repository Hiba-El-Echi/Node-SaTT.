const { Wallet, CustomToken } = require('../model/index')
const { responseHandler } = require('../helpers/response-handler')
const { erc20Connexion, bep20Connexion } = require('../blockchainConnexion')

var rp = require('request-promise')
const Big = require('big.js')

var bip32 = require('bip32')
var bip38 = require('bip38')
var bip39 = require('bip39')
var bitcoinjs = require('bitcoinjs-lib')
var ethUtil = require('ethereumjs-util')
const { Constants } = require('../conf/const')
const {
    Tokens,
    token200,
    networkSegWitCompat,
    networkSegWit,
    pathBtcSegwitCompat,
    pathBtcSegwit,
    pathEth,
    booltestnet,
} = require('../conf/config')
exports.unlock = async (req, res) => {
    try {
        let UserId = req.user._id
        let pass = req.body.pass
        let account = await Wallet.findOne({ UserId })
        let Web3ETH = await erc20Connexion()
        Web3ETH.eth.accounts.wallet.decrypt([account.keystore], pass)

        let Web3BEP20 = await bep20Connexion()
        Web3BEP20.eth.accounts.wallet.decrypt([account.keystore], pass)

        return { address: '0x' + account.keystore.address, Web3ETH, Web3BEP20 }
    } catch (err) {
        // console.log('errrr', err)
        res.status(500).send({
            code: 500,
            error: err.message ? err.message : err.error,
        })
    }
}

exports.unlockBsc = async (req, res) => {
    try {
        let UserId = req.user._id
        let pass = req.body.pass
        let account = await Wallet.findOne({ UserId })
        let Web3BEP20 = await bep20Connexion()
        Web3BEP20.eth.accounts.wallet.decrypt([account.keystore], pass)
        return { address: '0x' + account.keystore.address, Web3BEP20 }
    } catch (err) {
        res.status(500).send({
            code: 500,
            error: err.message ? err.message : err.error,
        })
    }
}

exports.lockBSC = async (credentials) => {
    credentials.Web3BEP20.eth.accounts.wallet.remove(credentials.address)
}

exports.lock = async (credentials) => {
    credentials.Web3ETH.eth.accounts.wallet.remove(credentials.address)
    credentials.Web3BEP20.eth.accounts.wallet.remove(credentials.address)
}

exports.lockERC20 = async (credentials) => {
    credentials.Web3ETH.eth.accounts.wallet.remove(credentials.address)
}

exports.lockBEP20 = async (credentials) => {
    credentials.Web3BEP20.eth.accounts.wallet.remove(credentials.address)
}

exports.exportkeyBtc = async (req, res) => {
    let id = req.user._id
    let pass = req.body.pass
    let account = await Wallet.findOne({ UserId: parseInt(id) })

    if (account) {
        try {
            var Web3ETH = await erc20Connexion()
            Web3ETH.eth.accounts.wallet.decrypt([account.keystore], pass)
            return account.btc.ek
        } catch (e) {
            return responseHandler.makeResponseError(res, 401, 'Wrong password')
        } finally {
            let cred = { Web3ETH, address: '0x' + account.keystore.address }
            this.lockERC20(cred)
        }
    } else {
        return responseHandler.makeResponseError(res, 404, 'Account not found')
    }
}
exports.exportkey = async (req, res) => {
    let id = req.user._id
    let pass = req.body.pass
    let account = await Wallet.findOne({ UserId: parseInt(id) })

    if (account) {
        try {
            var Web3ETH = await erc20Connexion()
            Web3ETH.eth.accounts.wallet.decrypt([account.keystore], pass)
            return account.keystore
        } catch (e) {
            return responseHandler.makeResponseError(res, 401, 'Wrong password')
        } finally {
            let cred = { Web3ETH, address: '0x' + account.keystore.address }
            this.lockERC20(cred)
        }
    } else {
        res.status(404).send('Account not found')
    }
}

exports.getAccount = async (req, res) => {
    let UserId = req.user._id

    let account = await Wallet.findOne({ UserId })

    if (account) {
        var address = '0x' + account.keystore.address
        let Web3ETH = await erc20Connexion()
        let Web3BEP20 = await bep20Connexion()
        var ether_balance = await Web3ETH.eth.getBalance(address)

        var bnb_balance = await Web3BEP20.eth.getBalance(address)

        contractSatt = new Web3ETH.eth.Contract(
            Constants.token.abi,
            Constants.token.satt
        )

        var satt_balance = await contractSatt.methods.balanceOf(address).call()

        var result = {
            address: '0x' + account.keystore.address,
            ether_balance: ether_balance,
            bnb_balance: bnb_balance,
            satt_balance: satt_balance ? satt_balance.toString() : 0,
            version: account.mnemo ? 2 : 1,
        }
        result.btc_balance = 0
        if (
            process.env.NODE_ENV === 'mainnet' &&
            account.btc &&
            account.btc.addressSegWitCompat
        ) {
            result.btc = account.btc.addressSegWitCompat

            try {
                var utxo = JSON.parse(
                    child.execSync(
                        process.env.BTC_CMD +
                            ' listunspent 1 1000000 \'["' +
                            account.btc.addressSegWitCompat +
                            '"]\''
                    )
                )

                if (!utxo.length) result.btc_balance = '0'
                else {
                    var red = utxo.reduce(function (r, cur) {
                        r.amount += parseFloat(cur.amount)
                        return r
                    })
                    result.btc_balance = Math.floor(red.amount * 100000000)
                }
            } catch (e) {
                result.btc_balance = 0
            }
        }

        return result
    } else {
        return res.status(401).end('Account not found')
    }
}

exports.getPrices = async () => {
    try {
        var prices = null
        if (!prices) {
            var options = {
                method: 'GET',
                uri:
                    'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=200&convert=USD&CMC_PRO_API_KEY=' +
                    process.env.CMCAPIKEY,

                json: true,
            }

            var options2 = {
                method: 'GET',
                uri:
                    'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=SATT%2CJET&convert=USD&CMC_PRO_API_KEY=' +
                    process.env.CMCAPIKEY,

                json: true,
            }

            var result = await rp(options)
            var response = result

            var result2 = await rp(options2)
            var responseSattJet = result2

            response.data.push(responseSattJet.data.SATT)
            response.data.push(responseSattJet.data.JET)

            var priceMap = response.data.map((elem) => {
                var obj = {}
                obj = {
                    symbol: elem.symbol,
                    name: elem.name,
                    price: elem.quote.USD.price,
                    percent_change_24h: elem.quote.USD.percent_change_24h,
                    market_cap: elem.quote.USD.market_cap,
                    volume_24h: elem.quote.USD.volume_24h,
                    circulating_supply: elem.circulating_supply,
                    total_supply: elem.total_supply,
                    max_supply: elem.max_supply,
                    logo:
                        'https://s2.coinmarketcap.com/static/img/coins/128x128/' +
                        elem.id +
                        '.png',
                }

                return obj
            })
            var finalMap = {}
            for (var i = 0; i < priceMap.length; i++) {
                finalMap[priceMap[i].symbol] = priceMap[i]
                delete finalMap[priceMap[i].symbol].symbol
            }

            for (var i = 0; i < token200.length; i++) {
                var token = token200[i]

                if (finalMap[token.symbol]) {
                    finalMap[token.symbol].network = token.platform.network
                    finalMap[token.symbol].tokenAddress =
                        token.platform.token_address
                    finalMap[token.symbol].decimals = token.platform.decimals
                }
            }

            response.data = finalMap
            prices = response

            return finalMap
        } else if (
            prices.status &&
            Date.now() - new Date(prices.status.timestamp).getTime() < 1200000
        ) {
            return prices.data
        }
    } catch (err) {}
}

exports.filterAmount = function (input, nbre = 10) {
    if (input) {
        var out = input
        let size = input.length
        let toAdd = parseInt(nbre) - parseInt(size)

        if (input == 0) {
            toAdd--
        }
        if (toAdd > 0) {
            if (input.includes('.')) {
                for (let i = 0; i < toAdd; i++) {
                    out += '0'
                }
            } else {
                out += '.'
                for (let i = 0; i < toAdd; i++) {
                    out += '0'
                }
            }
        } else if (toAdd < 0) {
            if (input.includes('.')) {
                if (input.split('.')[0].length > nbre) {
                    out = input.substring(0, nbre)
                } else {
                    out = input.substring(0, nbre)
                    if (out[nbre - 1] == '.') {
                        out = input.substring(0, nbre - 1)
                    }
                }
            }
        }

        return out
    } else {
        return '-'
    }
}

exports.getBalance = async (Web3, token, address) => {
    try {
        let contract = new Web3.eth.Contract(Constants.token.abi, token)
        amount = await contract.methods.balanceOf(address).call()
        return amount.toString()
    } catch (err) {
        return '0'
    }
}

exports.sendBep20 = async (token, to, amount, credentials) => {
    try {
        var contract = await this.getTokenContractByToken(
            token,
            credentials,
            'BEP20'
        )

        var gasPrice = await contract.getGasPrice()
        var gas = await contract.methods
            .transfer(to, amount)
            .estimateGas({ from: credentials.address })

        var receipt = await contract.methods.transfer(to, amount).send({
            from: credentials.address,
            gas: gas,
            gasPrice: gasPrice,
        })
        return {
            transactionHash: receipt.transactionHash,
            address: credentials.address,
            to: to,
            amount: amount,
        }
    } catch (err) {
        console.log(err)
    }
}

exports.getListCryptoByUid = async (req, res) => {
    let id = req.user._id
    let crypto = await this.getPrices()
    var listOfCrypto = []
    try {
        var token_info = Object.assign({}, Tokens)
        delete token_info['SATT']
        delete token_info['BNB']
        var CryptoPrices = crypto

        var ret = await this.getAccount(req, res)
        delete ret.btc
        delete ret.version

        let userTokens = await CustomToken.find({
            sn_users: { $in: [id] },
        })

        if (userTokens.length) {
            for (let i = 0; i < userTokens.length; i++) {
                let symbol = userTokens[i].symbol
                if (token_info[symbol])
                    symbol = `${symbol}_${userTokens[i].network}`
                token_info[symbol] = {
                    dicimal: Number(userTokens[i].decimal),
                    symbol: userTokens[i].symbol,
                    network: userTokens[i].network,
                    contract: userTokens[i].tokenAdress,
                    name: userTokens[i].tokenName,
                    picUrl: userTokens[i].picUrl,
                    addedToken: true,
                }
            }
        }
        for (let T_name in token_info) {
            let network = token_info[T_name].network
            let crypto = {}
            crypto.picUrl = token_info[T_name].picUrl || false
            crypto.symbol = token_info[T_name].symbol.split('_')[0]
            crypto.name = token_info[T_name].name
            crypto.AddedToken = token_info[T_name].addedToken
                ? token_info[T_name].contract
                : false
            crypto.contract = token_info[T_name].contract
            crypto.decimal = +token_info[T_name].dicimal
            crypto.network = network
            crypto.undername = token_info[T_name].undername
            crypto.undername2 = token_info[T_name].undername2
            ;[crypto.price, crypto.total_balance] = Array(2).fill(0.0)
            let Web3ETH = await erc20Connexion()
            let Web3BEP20 = await bep20Connexion()
            let balance = {}
            if (network == 'ERC20') {
                balance.amount = await this.getBalance(
                    Web3ETH,
                    token_info[T_name].contract,
                    ret.address
                )
            } else {
                balance.amount = await this.getBalance(
                    Web3BEP20,
                    token_info[T_name].contract,
                    ret.address
                )
            }

            let key = T_name.split('_')[0]

            if (
                token_info[T_name]?.contract ==
                    token_info['SATT_BEP20']?.contract ||
                token_info[T_name]?.contract == token_info['WSATT']?.contract
            ) {
                key = 'SATT'
            }
            if (key == 'WBNB') key = 'BNB'
            if (CryptoPrices.hasOwnProperty(key)) {
                crypto.price = CryptoPrices[key].price
                crypto.variation = CryptoPrices[key].percent_change_24h
                crypto.total_balance =
                    this.filterAmount(
                        new Big(balance['amount'])
                            .div((10 ** +token_info[T_name].dicimal).toString())
                            .toNumber() + ''
                    ) *
                    CryptoPrices[key].price *
                    1
            }
            crypto.quantity = this.filterAmount(
                new Big(balance['amount'] * 1)
                    .div((10 ** +token_info[T_name].dicimal).toString())
                    .toNumber()
            )
            listOfCrypto.push(crypto)
        }

        delete ret.address
        for (const Amount in ret) {
            let crypto = {}
            let tokenSymbol = Amount.split('_')[0].toUpperCase()
            let decimal = tokenSymbol === 'BTC' ? 8 : 18
            tokenSymbol = tokenSymbol === 'ETHER' ? 'ETH' : tokenSymbol
            if (tokenSymbol == 'BTC') {
                crypto.name = 'Bitcoin'
                crypto.network = 'BTC'
            }
            if (tokenSymbol == 'ETH') {
                crypto.name = 'Ethereum'
                crypto.network = 'ERC20'
            }
            if (tokenSymbol == 'SATT') {
                crypto.name = 'SaTT'
                crypto.network = 'ERC20'
                crypto.contract = Constants.token.satt
            } else if (tokenSymbol == 'BNB') {
                crypto.name = 'BNB'
                crypto.network = 'BEP20'
            }
            ;[crypto.symbol, crypto.undername, crypto.undername2] =
                Array(3).fill(tokenSymbol)
            crypto.price = CryptoPrices[tokenSymbol].price
            crypto.variation = CryptoPrices[tokenSymbol].percent_change_24h

            crypto.total_balance =
                this.filterAmount(
                    new Big(await ret[Amount])
                        .div(new Big(10).pow(decimal))
                        .toNumber() + ''
                ) * CryptoPrices[tokenSymbol].price
            crypto.quantity = new Big(await ret[Amount])
                .div(new Big(10).pow(decimal))
                .toNumber()
                .toFixed(8)
            listOfCrypto.push(crypto)
        }

        return { listOfCrypto }
    } catch (err) {
        console.log(err)
    }
}

exports.getBalanceByUid = async (req, res) => {
    try {
        var userId = req.user._id
        let crypto = await this.getPrices()

        var [Total_balance, CryptoPrices] = [0, crypto]
        var token_info = Object.assign({}, Tokens)
        delete token_info['SATT']
        delete token_info['BNB']

        let ret = await this.getAccount(req, res)
        delete ret.btc
        delete ret.version

        let userTokens = await CustomToken.find({
            sn_users: { $in: [userId] },
        })

        if (userTokens.length) {
            for (let i = 0; i < userTokens.length; i++) {
                let symbol = userTokens[i].symbol
                if (token_info[symbol])
                    symbol = `${symbol}_${userTokens[i].network}`
                token_info[symbol] = {
                    dicimal: Number(userTokens[i].decimal),
                    symbol: userTokens[i].symbol,
                    network: userTokens[i].network,
                    contract: userTokens[i].tokenAdress,
                    name: userTokens[i].tokenName,
                    picUrl: userTokens[i].picUrl,
                    addedToken: true,
                }
            }
        }

        for (const T_name in token_info) {
            var network = token_info[T_name].network

            let Web3ETH = await erc20Connexion()
            let Web3BEP20 = await bep20Connexion()

            let balance = {}
            if (network == 'ERC20') {
                balance.amount = await this.getBalance(
                    Web3ETH,
                    token_info[T_name].contract,
                    ret.address
                )
            } else {
                balance.amount = await this.getBalance(
                    Web3BEP20,
                    token_info[T_name].contract,
                    ret.address
                )
            }

            let key = T_name.split('_')[0]
            if (
                token_info[T_name].contract ==
                    token_info['SATT_BEP20'].contract ||
                token_info[T_name].contract == token_info['WSATT'].contract
            ) {
                key = 'SATT'
            }
            if (CryptoPrices.hasOwnProperty(key)) {
                Total_balance +=
                    this.filterAmount(
                        new Big(balance['amount'] * 1)
                            .div((10 ** +token_info[T_name].dicimal).toString())
                            .toNumber() + ''
                    ) * CryptoPrices[key].price
            }
        }

        delete ret.address
        for (const Amount in ret) {
            let tokenSymbol = Amount.split('_')[0].toUpperCase()
            tokenSymbol = tokenSymbol === 'ETHER' ? 'ETH' : tokenSymbol

            let decimal = tokenSymbol === 'BTC' ? 8 : 18

            Total_balance +=
                this.filterAmount(
                    new Big((await ret[Amount]) * 1)
                        .div(new Big(10).pow(decimal))
                        .toNumber() + ''
                ) * CryptoPrices[tokenSymbol].price
        }

        Total_balance = Total_balance.toFixed(2)

        return { Total_balance }
    } catch (err) {
        console.log(err)
        //    return responseHandler.makeResponseError(
        // 		 res,
        // 		 500,
        // 		 err.message ? err.message : err.error
        // 		 )
    }
}

exports.getTokenContractByToken = async (token, credentials, network) => {
    if (network === 'ERC20') {
        var contract = new credentials.Web3ETH.eth.Contract(
            Constants.token.abi,
            token
        )
        contract.getGasPrice = credentials.Web3ETH.eth.getGasPrice
    } else {
        var contract = new credentials.Web3BEP20.eth.Contract(
            Constants.bep20.abi,
            token
        )

        contract.getGasPrice = credentials.Web3BEP20.eth.getGasPrice
    }

    return contract
}

exports.transfer = async (token, to, amount, credentials) => {
    try {
        var contract = await this.getTokenContractByToken(
            token,
            credentials,
            'ERC20'
        )

        var gasPrice = await contract.getGasPrice()
        var gas = 60000
        var receipt = await contract.methods.transfer(to, amount).send({
            from: credentials.address,
            gas: gas,
            gasPrice: gasPrice,
        })
        return {
            transactionHash: receipt.transactionHash,
            address: credentials.address,
            to: to,
            amount,
        }
    } catch (err) {
        console.log(err)
    }
}

exports.sendBtc = async function (id, pass, to, amount) {
    var account = await Wallet.findOne({ UserId: parseInt(id) })

    var escpass = pass.replace(/'/g, "\\'")

    var priv = bip38.decrypt(account.btc.ek, escpass)

    var wif = wif.encode(0x80, priv.privateKey, priv.compressed)

    var addr = account.btc.addressSegWitCompat

    var utxo = JSON.parse(
        child.execSync(
            process.env.BTC_CMD + ' listunspent 1 1000000 \'["' + addr + '"]\''
        )
    )

    if (!utxo.length) {
        return { error: 'insufficient funds ' }
    }

    var max = 0.0
    for (var i = 0; i < utxo.length; i++) {
        max += parseFloat(utxo[i].amount)
    }
    max = Math.floor(parseFloat(max) * 100000000)

    var body = await rp({ uri: process.env.BTS_FEES, json: true })
    var feeRate = 150 // parseInt(body.fastestFee);

    var maxFee = 20000

    const keyPair = bitcoinjs.ECPair.fromWIF(wif)
    const txb = new bitcoinjs.TransactionBuilder()

    var input_sum = 0
    var fee = (45 + utxo.length * 93) * feeRate
    for (var i = 0; i < utxo.length; i++) {
        txb.addInput(utxo[i].txid, parseInt(utxo[i].vout))
        input_sum += Math.round(parseFloat(utxo[i].amount) * 100000000)
    }
    var change = input_sum - parseInt(amount) - (fee + 34 * feeRate)
    txb.addOutput(to, parseInt(amount))

    if (change > fee) {
        txb.addOutput(addr, parseInt(change))
        fee += 34 * feeRate
    }

    if (parseInt(amount) + parseInt(fee) > max) {
        return {
            error: 'insufficient funds, fee requirement : ' + fee + ' satoshis',
        }
    }

    const p2wpkh = bitcoinjs.payments.p2wpkh({ pubkey: keyPair.publicKey })
    const p2sh = bitcoinjs.payments.p2sh({ redeem: p2wpkh })

    for (var i = 0; i < utxo.length; i++) {
        txb.sign(
            i,
            keyPair,
            p2sh.redeem.output,
            null,
            Math.round(parseFloat(utxo[i].amount) * 100000000)
        )
    }
    var tx = txb.build()

    var signed = tx.toHex()
    var hash = tx.getId()

    var rec = child.execSync(
        process.env.BTC_CMD + ' sendrawtransaction "' + signed + '"'
    )
    return hash
}

exports.transferNativeBNB = async (to, amount, credentials) => {
    var gasPrice = await credentials.Web3BEP20.eth.getGasPrice()

    var gas = 21000

    try {
        var receipt = await credentials.Web3BEP20.eth
            .sendTransaction({
                from: credentials.address,
                value: amount,
                gas: gas,
                to: to,
                gasPrice: gasPrice,
            })
            .once('transactionHash', (transactionHash) => {})
        return {
            transactionHash: receipt.transactionHash,
            to: to,
            amount: amount,
        }
    } catch (err) {
        console.log(err)
    }
}

exports.transferEther = async (to, amount, credentials) => {
    if (!credentials.Web3ETH.utils.isAddress(to))
        return { error: 'Invalid address' }
    try {
        var gasPrice = await credentials.Web3ETH.eth.getGasPrice()
        var gas = 21000

        var receipt = await credentials.Web3ETH.eth
            .sendTransaction({
                from: credentials.address,
                value: amount,
                gas: gas,
                to: to,
                gasPrice: gasPrice,
            })
            .once('transactionHash', function (hash) {})

        return {
            transactionHash: receipt.transactionHash,
            address: credentials.address,
            to: to,
            amount: amount,
        }
    } catch (e) {
        console.log(e)
    }
}

exports.getCount = async function () {
    try {
        var count = await Wallet.countDocuments()
        return count + 1
    } catch (err) {
        console.log(err)
    }
}

exports.createSeed = async (req, res) => {
    try {
        var UserId = req.user._id
        var pass = req.body.pass

        var escpass = pass.replace(/'/g, "\\'")

        const mnemonic = bip39.generateMnemonic(256)
        const seed = bip39.mnemonicToSeedSync(mnemonic, pass)
        const rootBtc = bip32.fromSeed(seed, networkSegWitCompat)
        const rootBtcBc1 = bip32.fromSeed(seed, networkSegWit)
        const rootEth = bip32.fromSeed(seed)
        const childBtc = rootBtc.derivePath(pathBtcSegwitCompat)
        const childBtcBc1 = rootBtcBc1.derivePath(pathBtcSegwit)
        const childEth = rootEth.derivePath(pathEth)

        const address = bitcoinjs.payments.p2sh({
            redeem: bitcoinjs.payments.p2wpkh({
                pubkey: childBtc.publicKey,
                network: networkSegWitCompat,
            }),
            network: networkSegWitCompat,
        }).address

        const addressbc1 = bitcoinjs.payments.p2wpkh({
            pubkey: childBtcBc1.publicKey,
            network: networkSegWit,
        }).address

        var addressBuffer = ethUtil.privateToAddress(childEth.privateKey)
        var checksumAddress = ethUtil.toChecksumAddress(
            '0x' + addressBuffer.toString('hex')
        )
        // var addressEth = ethUtil.addHexPrefix(checksumAddress);
        var privkey = ethUtil.addHexPrefix(childEth.privateKey.toString('hex'))

        var pubBtc = childBtc.publicKey.toString('hex')

        let Web3ETH = await erc20Connexion()

        var account = Web3ETH.eth.accounts
            .privateKeyToAccount(privkey)
            .encrypt(pass)

        if (!booltestnet) {
            child.execSync(
                process.env.BTC_CMD +
                    ' importpubkey ' +
                    pubBtc +
                    " 'default' false"
            )

            const client = new bitcoinCore({
                host: process.env.BTC_HOST,
                username: process.env.BTC_USER,
                password: process.env.BTC_PASSWORD,
            })

            await new Client().importPubKey('default', false)
        }

        var ek = bip38.encrypt(childBtc.privateKey, true, escpass)
        var btcWallet = {
            publicKey: pubBtc,
            addressSegWitCompat: address,
            addressSegWit: addressbc1,
            publicKeySegWit: childBtcBc1.publicKey.toString('hex'),
            ek: ek,
        }
        var count = await this.getCount()

        await Wallet.create({
            UserId: parseInt(UserId),
            keystore: account,
            num: count,
            btc: btcWallet,
            mnemo: mnemonic,
        })

        return {
            address: '0x' + account.address,
            btcAddress: btcWallet.addressSegWitCompat,
        }
    } catch (error) {
        console.log(error)
    }
}

exports.FilterTransactionsByHash = (
    All_Transactions,
    Erc20_OR_BEP20_Transactions,
    Network
) => {
    var transaction_content = All_Transactions.result
    var erc20_or_bep20_transaction_content = Erc20_OR_BEP20_Transactions.result

    transaction_content.map((elem) => {
        for (var i = 0; i < erc20_or_bep20_transaction_content.length; i++) {
            if (erc20_or_bep20_transaction_content[i].hash == elem.hash) {
                erc20_or_bep20_transaction_content[i].network = Network
            }
        }
        if (!elem.network) {
            elem.network = Network
        }
    })
    return transaction_content.concat(erc20_or_bep20_transaction_content)
}

const { Wallet, Campaigns, Event, User } = require('../model/index')
const { responseHandler } = require('../helpers/response-handler')
const {
    erc20Connexion,
    bep20Connexion,
    getContractByToken,
    getPromContract,
    getContractCampaigns,
} = require('../blockchainConnexion')

const { Constants } = require('../conf/const')
const { config } = require('../conf/config')
const rp = require('request-promise')

exports.unlock = async (req, res) => {
    try {
        let UserId = req.user._id
        let pass = req.body.pass
        let account = await Wallet.findOne({ UserId })

        let Web3ETH = await erc20Connexion()
        let Web3BEP20 = await bep20Connexion()
        Web3ETH.eth.accounts.wallet.decrypt([account.keystore], pass)
        Web3BEP20.eth.accounts.wallet.decrypt([account.keystore], pass)
        return { address: '0x' + account.keystore.address, Web3ETH, Web3BEP20 }
    } catch (err) {
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

exports.lock = async (credentials) => {
    credentials.Web3ETH.eth.accounts.wallet.remove(credentials.address)
    credentials.Web3BEP20.eth.accounts.wallet.remove(credentials.address)
}

exports.lockERC20 = async (credentials) => {
    credentials.Web3ETH.eth.accounts.wallet.remove(credentials.address)
}

exports.getAccount = async (req, res) => {
    let UserId = req.user._id

    let account = await Wallet.findOne({ UserId })

    if (account) {
        var address = '0x' + account.keystore.address
        let Web3ETH = await erc20Connexion()
        let Web3BEP20 = await bep20Connexion()
        var ether_balance = Web3ETH.eth.getBalance(address)

        var bnb_balance = Web3BEP20.eth.getBalance(address)

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

exports.createPerformanceCampaign = async (
    dataUrl,
    startDate,
    endDate,
    ratios,
    token,
    amount,
    credentials,
    res
) => {
    try {
        var ctr = await getContractByToken(token, credentials)
        var gasPrice = await ctr.getGasPrice()
        var gas = 600000
        var receipt = await ctr.methods
            .createPriceFundAll(
                dataUrl,
                startDate,
                endDate,
                ratios,
                token,
                amount
            )
            .send({
                from: credentials.address,
                gas: gas,
                gasPrice: gasPrice,
            })

        receipt.transactionHash &&
            console.log(
                'createCampaignAll',
                credentials.address,
                `${receipt.events.CampaignCreated.transactionHash} confirmed campaign ${receipt.events.CampaignCreated.returnValues.id} launched`
            )
        return {
            hash: receipt.events.CampaignCreated.returnValues.id,
            transactionHash: receipt.events.CampaignCreated.transactionHash,
        }
    } catch (err) {
        res.status(500).send({
            code: 500,
            error: err.message ? err.message : err.error,
        })
    }
}

exports.createBountiesCampaign = async (
    dataUrl,
    startDate,
    endDate,
    bounties,
    token,
    amount,
    credentials,
    res
) => {
    var ctr = await getContractByToken(token, credentials)
    var gasPrice = await ctr.getGasPrice()
    var gas = 600000

    try {
        var receipt = await ctr.methods
            .createPriceFundBounty(
                dataUrl,
                startDate,
                endDate,
                bounties,
                token,
                amount
            )
            .send({
                from: credentials.address,
                gas: gas,
                gasPrice: gasPrice,
            })
        let transactionHash = receipt.events.CampaignCreated.transactionHash
        transactionHash &&
            console.log(
                'createCampaignBounties',
                credentials.address,
                `${transactionHash} confirmed campaignBounty ${receipt.events.CampaignCreated.returnValues.id} launched`
            )
        return {
            hash: receipt.events.CampaignCreated.returnValues.id,
            transactionHash,
        }
    } catch (err) {
        res.status(500).send({
            code: 500,
            error: err.message ? err.message : err.error,
        })
    }
}

exports.bep20Allow = async (token, credentials, spender, amount, res) => {
    try {
        var contract = new credentials.Web3BEP20.eth.Contract(
            Constants.token.abi,
            token
        )
        var gasPrice = await credentials.Web3BEP20.eth.getGasPrice()
        var gas = await contract.methods
            .approve(spender, amount)
            .estimateGas({ from: credentials.address })
        var receipt = await contract.methods
            .approve(spender, amount)
            .send({ from: credentials.address, gas: gas, gasPrice: gasPrice })
            .once('transactionHash', function (transactionHash) {
                console.log('approve transactionHash', transactionHash)
            })

        return {
            transactionHash: receipt.transactionHash,
            address: credentials.address,
            spender: spender,
        }
    } catch (err) {
        res.status(500).send({
            code: 500,
            error: err.message ? err.message : err.error,
        })
    }
}

exports.bep20Approve = async (token, address, spender) => {
    try {
        let Web3BEP20 = await bep20Connexion()
        var contract = new Web3BEP20.eth.Contract(Constants.token.abi, token)
        var amount = await contract.methods.allowance(address, spender).call()
        return { amount: amount.toString() }
    } catch (err) {
        return { amount: '0' }
    }
}

exports.erc20Allow = async (token, credentials, spender, amount, res) => {
    try {
        var contract = new credentials.Web3ETH.eth.Contract(
            Constants.token.abi,
            token
        )
        var gasPrice = await credentials.Web3ETH.eth.getGasPrice()
        var gas = await contract.methods
            .approve(spender, amount)
            .estimateGas({ from: credentials.address })
        var receipt = await contract.methods
            .approve(spender, amount)
            .send({ from: credentials.address, gas: gas, gasPrice: gasPrice })
            .once('transactionHash', (transactionHash) => {
                console.log('approve transactionHash', transactionHash)
            })

        return {
            transactionHash: receipt.transactionHash,
            address: credentials.address,
            spender: spender,
        }
    } catch (err) {
        res.status(500).send({
            code: 500,
            error: err.message ? err.message : err.error,
        })
    }
}

exports.erc20Approve = async (token, address, spender) => {
    try {
        let Web3ETH = await erc20Connexion()
        var contract = new Web3ETH.eth.Contract(Constants.token.abi, token)
        var amount = await contract.methods.allowance(address, spender).call()
        console.log('approval', address, 'for', spender, amount.toString())
        return { amount: amount.toString() }
    } catch (err) {
        return { amount: '0' }
    }
}

exports.sortOutPublic = (req, idNode, strangerDraft) => {
    const title = req.query.searchTerm || ''
    const status = req.query.status
    const blockchainType = req.query.blockchainType || ''

    const dateJour = Math.round(new Date().getTime() / 1000)
    if (req.query._id) query['$and'].push({ _id: { $gt: req.query._id } })

    const remainingBudget = req.query.remainingBudget || []

    var query = {}
    query['$and'] = []

    if (
        (req.query.idWallet || req.query.showOnlyMyCampaigns) &&
        !req.query.showOnlyLiveCampaigns
    )
        query['$and'].push({ _id: { $nin: strangerDraft } })

    req.query.showOnlyMyCampaigns && query['$and'].push({ idNode })
    req.query.showOnlyLiveCampaigns &&
        query['$and'].push({ type: 'apply', hash: { $exists: true } })
    !req.query.idWallet && query['$and'].push({ hash: { $exists: true } })
    req.query.remuneration &&
        query['$and'].push({ remuneration: req.query.remuneration })

    if (req.query.oracles == undefined) {
        oracles = ['twitter', 'facebook', 'youtube', 'instagram', 'linkedin']
    } else if (typeof req.query.oracles === 'string') {
        oracles = Array(req.query.oracles)
    } else {
        oracles = req.query.oracles
    }
    if (req.query.oracles)
        query['$and'].push({
            $or: [
                { 'ratios.oracle': { $in: oracles } },
                { 'bounties.oracle': { $in: oracles } },
            ],
        })

    title &&
        query['$and'].push({
            title: { $regex: '.*' + title + '.*', $options: 'i' },
        })
    blockchainType && query['$and'].push({ 'token.type': blockchainType })

    if (status == 'active') {
        if (remainingBudget.length == 2) {
            query['$and'].push({ 'funds.1': { $exists: true } })
            query['$and'].push({
                'funds.1': {
                    $gte: remainingBudget[0],
                    $lte: remainingBudget[1],
                },
            })
        }
        query['$and'].push({ endDate: { $gt: dateJour } })
        query['$and'].push({ 'funds.1': { $ne: '0' } })
        query['$and'].push({ hash: { $exists: true } })
    } else if (status == 'finished') {
        query['$and'].push({
            $or: [{ endDate: { $lt: dateJour } }, { 'funds.1': { $eq: '0' } }],
        })
        query['$and'].push({ hash: { $exists: true } })
    } else if (status == 'draft') {
        query['$and'].push({ hash: { $exists: false } })
        query['$and'].push({ idNode: idNode })
    }

    query['$and'].push({
        type: {
            $in: ['draft', 'finished', 'inProgress', 'apply'],
        },
    })

    return query
}

exports.getUserIdByWallet = async (wallet) => {
    let user = await Wallet.findOne({ 'keystore.address': wallet })

    return user.UserId
}

exports.getLinkedinLinkInfo = async (accessToken, activityURN) => {
    try {
        let linkInfo = {}
        const linkedinData = {
            url: config.linkedinActivityUrl(activityURN),
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + accessToken,
            },
            json: true,
        }
        let postData = await rp(linkedinData)
        let urn = `urn:li:activity:${activityURN}`
        linkInfo.idUser =
            postData.results[urn]['domainEntity~'].owner ??
            postData.results[urn]['domainEntity~'].author
        linkInfo.idPost = postData.results[urn]['domainEntity']
        if (postData.results[urn]['domainEntity~'].content)
            linkInfo.mediaUrl =
                postData.results[urn][
                    'domainEntity~'
                ].content.contentEntities[0].entityLocaion
        return linkInfo
    } catch (err) {
        console.log(err.message)
    }
}

exports.applyCampaign = async (
    idCampaign,
    typeSN,
    idPost,
    idUser,
    credentials,
    token
) => {
    try {
        let web3 = await getContractByToken(token.addr, credentials)
        var gas = 400000
        var gasPrice = await web3.getGasPrice()
        var receipt = await web3.methods
            .applyCampaign(idCampaign, typeSN, idPost, idUser)
            .send({
                from: credentials.address,
                gas: gas,
                gasPrice: gasPrice,
            })
        let prom = receipt.events.CampaignApplied.returnValues.prom
        receipt.events.CampaignApplied.transactionHash &&
            console.log(
                'applyCampaign',
                credentials.address,
                `${receipt.events.CampaignApplied.transactionHash} confirmed apply prom ${prom} ${idCampaign}`
            )
        return {
            transactionHash: receipt.events.CampaignApplied.transactionHash,
            idCampaign: idCampaign,
            typeSN: typeSN,
            idPost: idPost,
            idUser: idUser,
            idProm: prom,
        }
    } catch (err) {
        console.log(err.message)
    }
}

exports.getRemainingFunds = async (token, hash, credentials) => {
    try {
        var gas = 200000
        var ctr = await getContractByToken(token.addr, credentials)
        var gasPrice = await ctr.getGasPrice()
        var receipt = await ctr.methods.getRemainingFunds(hash).send({
            from: credentials.address,
            gas: gas,
            gasPrice: gasPrice,
        })
        return {
            transactionHash: receipt.transactionHash,
            hash: hash,
        }
    } catch (err) {
        console.log(err.message)
    }
}

exports.getReachLimit = async (campaignRatio, oracle) => {
    let ratio = campaignRatio.find((item) => item.oracle == oracle)
    if (ratio) return ratio.reachLimit
    return
}

exports.fundCampaign = async (idCampaign, token, amount, credentials) => {
    try {
        var ctr = await getContractByToken(token, credentials)
        var gasPrice = await ctr.getGasPrice()
        var gas = 200000

        var receipt = await ctr.methods
            .fundCampaign(idCampaign, token, amount)
            .send({
                from: credentials.address,
                gas: gas,
                gasPrice: gasPrice,
            })
        receipt.transactionHash &&
            console.log(
                'fundCampaign',
                credentials.address,
                `${receipt.transactionHash} confirmed campaign ${idCampaign} funded`
            )
        return {
            transactionHash: receipt.transactionHash,
            idCampaign: idCampaign,
            token: token,
            amount: amount,
        }
    } catch (err) {
        console.log(err)
    }
}

exports.getGains = async (idProm, credentials) => {
    try {
        var ctr = await getPromContract(idProm, credentials)
        var gas = 200000
        var gasPrice = await ctr.getGasPrice()
        var receipt = await ctr.methods.getGains(idProm).send({
            from: credentials.address,
            gas: gas,
            gasPrice: gasPrice,
        })
        return {
            transactionHash: receipt.transactionHash,
            idProm: idProm,
        }
    } catch (err) {
        console.log(err)
    }
}

exports.filterLinks = (req, id_wallet) => {
    const status = req.query.status
    let oracles = req.query.oracles
    oracles = typeof oracles === 'string' ? [oracles] : oracles
    var query = { id_wallet: id_wallet }
    if (req.query.campaign && req.query.state === 'part') {
        query = { id_wallet: id_wallet, id_campaign: req.query.campaign }
    } else if (req.query.campaign && req.query.state === 'owner')
        query = { id_campaign: req.query.campaign }
    else if (!req.query.campaign && !req.query.state)
        query = { id_wallet: id_wallet }

    if (oracles) query.oracle = { $in: oracles }

    if (status == 'false') {
        query.status = false
        query.type = 'waiting_for_validation'
    } else {
        if (status == 'rejected') query.status = 'rejected'
        if (status == 'true') query.status = true
        query.type = {
            $in: [
                'indisponible',
                'waiting_for_validation',
                'harvest',
                'already_recovered',
                'not_enough_budget',
                'no_gains',
                'rejected',
                'none',
            ],
        }
    }

    return query
}

exports.influencersLinks = async (links) => {
    try {
        // let idproms = await ctr.methods.getProms(idCampaign).call();
        let proms = links

        if (links.length) {
            let addresses = []
            let ids = []
            let idByAddress = []
            let userById = []

            for (let i = 0; i < links.length; i++) {
                if (addresses.indexOf(links[i].id_wallet) == -1)
                    addresses.push(links[i].id_wallet.slice(2).toLowerCase())
            }

            let wallets = await Wallet.find({
                'keystore.address': { $in: addresses },
            })

            for (let i = 0; i < wallets.length; i++) {
                idByAddress['0x' + wallets[i].keystore.address] =
                    'id#' + wallets[i].UserId
                if (ids.indexOf(wallets[i].UserId) == -1)
                    ids.push(wallets[i].UserId)
            }
            let users = await User.find({ _id: { $in: ids } }).select({
                email: 1,
                _id: 1,
                picLink: 1,
                lastName: 1,
                firstName: 1,
            })

            for (let i = 0; i < users.length; i++) {
                userById['id#' + users[i]._id] = users[i]
            }
            for (let i = 0; i < proms.length; i++) {
                proms[i].meta =
                    userById[idByAddress[proms[i].id_wallet.toLowerCase()]]
            }
        }
        return proms
    } catch (err) {
        console.log(err)
    }
}

exports.updateBounty = async (idProm, credentials) => {
    try {
        var gas = 200000
        var ctr = await getPromContract(idProm)
        var gasPrice = await ctr.getGasPrice()

        var receipt = await ctr.methods.updateBounty(idProm).send({
            from: credentials.address,
            gas: gas,
            gasPrice: gasPrice,
        })
        return {
            transactionHash: receipt.transactionHash,
            idProm: idProm,
            events: receipt.events,
        }
    } catch (err) {
        console.log(err)
    }
}

exports.validateProm = async (idProm, credentials) => {
    try {
        var gas = 100000
        let ctr = await getPromContract(idProm, credentials)
        var gasPrice = await ctr.getGasPrice()
        var receipt = await ctr.methods.validateProm(idProm).send({
            from: credentials.address,
            gas: gas,
            gasPrice: gasPrice,
        })
        receipt.transactionHash &&
            console.log(
                'validateProm',
                credentials.address,
                `${receipt.transactionHash} confirmed validated prom ${idProm}`
            )
        return {
            transactionHash: receipt.transactionHash,
            idProm: idProm,
        }
    } catch (err) {
        console.log(err.message)
    }
}

exports.updatePromStats = async (idProm, credentials) => {
    try {
        var gas = 200000
        var ctr = await getPromContract(idProm, credentials)
        var gasPrice = await ctr.getGasPrice()
        var receipt = await ctr.methods.updatePromStats(idProm).send({
            from: credentials.address,
            gas: gas,
            gasPrice: gasPrice,
        })

        return {
            transactionHash: receipt.transactionHash,
            idProm: idProm,
            events: receipt.events,
        }
    } catch (err) {
        console.log(err)
    }
}

exports.getTransactionAmount = async (transactionHash, network) => {
    try {
        let data = await network.getTransactionReceipt(transactionHash)
        let hex =
            network == app.web3.eth
                ? await app.web3.utils.hexToNumberString(data.logs[0].data)
                : await app.web3Bep20.utils.hexToNumberString(data.logs[0].data)
        return hex
    } catch (e) {
        console.log(e.message)
    }
}

exports.campaignStatus = (campaign) => {
    try {
        let type = ''
        let dateNow = new Date()
        campaign.startDate = Date.parse(campaign.startDate)
            ? new Date(Date.parse(campaign.startDate))
            : new Date(+campaign.startDate * 1000)
        campaign.endDate = Date.parse(campaign.endDate)
            ? new Date(Date.parse(campaign.endDate))
            : new Date(+campaign.endDate * 1000)
        let isFinished =
            dateNow > campaign.endDate ||
            (campaign.funds && campaign.funds[1] == '0')
        if (!campaign.hash) type = 'draft'
        else if (isFinished && campaign.hash) type = 'finished'
        else if (campaign.hash && dateNow < campaign.startDate)
            type = 'inProgress'
        else if (!isFinished && campaign.hash) type = 'apply'
        else type = 'none'
        return type
    } catch (err) {
        console.error(err)
    }
}

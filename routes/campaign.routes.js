let express = require('express')
let router = express.Router()
const {
    rejectLink,
    bep20Approval,
    erc20Approval,
    campaignDetails,
    campaigns,
    launchCampaign,
    campaignPromp,
    launchBounty,
    apply,
    linkNotifications,
    linkStats,
    increaseBudget,
    getLinks,
    getFunds,
    gains,
    addKits,
    update,
    kits,
    saveCampaign,
    upload,
    validateCampaign,
    bep20Allow,
    erc20Allow,
    updateStatistics,
    coverByCampaign,
} = require('../controllers/campaign.controller')
const { verifyAuth } = require('../middleware/passport.middleware')

/**
 * @swagger
 * /campaign/bep20/approval:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: bep20 aprroval
 *     description: Approve the smart contract BEP20 to interact with user wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               tokenAddress:
 *                 type: string
 *               campaignAddress:
 *                 type: string
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "401":
 *          description: code,<br>error:"Unauthorized"
 *       "500":
 *          description: error:"error"
 */
router.post('/bep20/approval', verifyAuth, bep20Approval)

/**
 * @swagger
 * /campaign/bep20/allow:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: bep20 allow
 *     description: Allow user wallet to interact the smart contract BEP20
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               campaignAddress:
 *                 type: string
 *               amount:
 *                 type: string
 *               pass:
 *                 type: string
 *               tokenAddress:
 *                 type: string
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "401":
 *          description: code,<br>error:"unauthorized"
 *       "500":
 *          description: error:"error"
 */
router.post('/bep20/allow', verifyAuth, bep20Allow)
/**
 * @swagger
 * /campaign/erc20/approval:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: erc20 aprroval
 *     description: Approve the smart contract ERC20 to interact with user wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               tokenAddress:
 *                 type: string
 *               campaignAddress:
 *                 type: string
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "401":
 *          description: code,<br>error:"unauthorized"
 *       "500":
 *          description: error:"error"
 */
router.post('/erc20/approval', verifyAuth, erc20Approval)
/**
 * @swagger
 * /campaign/erc20/allow:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: erc20 allow
 *     description: Allow user wallet to interact the smart contract erc20
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               campaignAddress:
 *                 type: string
 *               amount:
 *                 type: string
 *               tokenAddress:
 *                 type: string
 *               pass:
 *                 type: string
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "401":
 *          description: code,<br>error:"unauthorized"
 *       "500":
 *          description: error:"error"
 */
router.post('/erc20/allow', verifyAuth, erc20Allow)
/**
 * @swagger
 * /campaign/launch/performance:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: Launch campaign.
 *     description: Launch new performance compaign (based of views, likes, shares) <br> with access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               tokenAddress:
 *                 type: string
 *               amount:
 *                 type: string
 *               pass:
 *                 type: string
 *               contract:
 *                 type: string
 *               dataUrl:
 *                 type: string
 *               endDate:
 *                 type: integer
 *               startDate:
 *                 type: integer
 *               idCampaign:
 *                 type: string
 *               ratios:
 *                 type: array
 *                 items:
 *                     oneOf:
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "401":
 *          description: code,<br>error:"unauthorized"
 *       "500":
 *          description: error:"error"
 */
router.post('/launch/performance', verifyAuth, launchCampaign)
/**
 * @swagger
 * /campaign/launchBounty:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: Launch campaign.
 *     description:  Launch new  bounties compaign (based of followers number) <br> with access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               tokenAddress:
 *                 type: string
 *               contract:
 *                 type: string
 *               idCampaign:
 *                 type: string
 *               dataUrl:
 *                 type: string
 *               amount:
 *                 type: string
 *               pass:
 *                 type: string
 *               startDate:
 *                 type: integer
 *               endDate:
 *                 type: integer
 *               bounties:
 *                 type: array
 *                 items:
 *                  id:
 *                      type: string
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "401":
 *          description: code,<br>error:"unauthorized"
 *       "500":
 *          description: error:"error"
 */

router.post('/launchBounty', verifyAuth, launchBounty)

/**
 * @swagger
 * /campaign/campaigns:
 *   get:
 *     tags:
 *     - "campaign"
 *     summary: get campaigns list
 *     description: Returns the list of campaigns <br> with access_token
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: idWallet
 *         description: idWallet
 *         in: query
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "401":
 *          description: code,<br>error:"unauthorized"
 *       "500":
 *          description: error:"error"
 */
router.get('/campaigns', campaigns)

/**
 * @swagger
 * /campaign/details/{id}:
 *   get:
 *     tags:
 *     - "campaign"
 *     summary: get campaign details
 *     description: return to user campaign details <br> with access_token
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: campaign id
 *         in: path
 *         required: true
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "404":
 *          description: error:error message<br>"Campaign  not found"
 *       "500":
 *          description: error:"error"
 */
router.get('/details/:id', campaignDetails)

/**
 * @swagger
 * /campaign/campaignPrompAll/{id}:
 *   get:
 *     tags: ["campaign"]
 *     summary: get campaign pending link
 *     description: return to user the list of campaign promp ALl <br> without access_token
 *     produces:
 *     - application/json
 *     parameters:
 *     - in: path
 *       name: id
 *       type: string
 *       description: the campaign id.
 *       required: true
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "401":
 *          description: error:error message<br>"unothorized"
 *       "500":
 *          description: error:"error"
 */
router.get('/campaignPrompAll/:id', verifyAuth, campaignPromp)

/**
 * @swagger
 * /campaign/apply:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: apply your link.
 *     description:  allow user to apply his post link for the campaign <br> with access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               pass:
 *                 type: string
 *               idCampaign:
 *                 type: string
 *               typeSN:
 *                 type: number
 *               idPost:
 *                 type: string
 *               idUser:
 *                 type: string
 *               title:
 *                 type: string
 *               hash:
 *                 type: string
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "401":
 *          description: error:error message<br>"unothorized"
 *       "500":
 *          description: error:error message
 */
router.post('/apply', verifyAuth, apply)
/**
 * @swagger
 * /campaign/linkNotification:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: get link notification.
 *     description:  return to user link notification <br> with access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               idCampaign:
 *                 type: string
 *               idProm:
 *                 type: string
 *               link:
 *                 type: string
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "401":
 *          description: error:error message<br>"unothorized"
 *       "500":
 *          description: error:error message
 */
router.post('/linkNotification', verifyAuth, linkNotifications)
/**
 * @swagger
 * /campaign/validate:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: validate participation.
 *     description:  Campaign admin accept user participation  <br> with access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               pass:
 *                 type: string
 *               idCampaign:
 *                 type: string
 *               idProm:
 *                 type: string
 *               link:
 *                 type: string
 *               email:
 *                 type: string
 *               idUser:
 *                 type: string
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "401":
 *          description: error:error message<br>"unothorized"
 *       "500":
 *          description: error:error message
 */
router.post('/validate', verifyAuth, validateCampaign)

/**
 * @swagger
 * /campaign/gains:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: get gains.
 *     description:  User recover his gains  <br> with access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               pass:
 *                 type: string
 *               idProm:
 *                 type: string
 *               hash:
 *                 type: string
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "401":
 *          description: error:error message<br>"unothorized"
 *       "404":
 *          description: error:error message<br>"oracle not available"
 *       "500":
 *          description: error:error message
 */

router.post('/gains', verifyAuth, gains)

/**
 * @swagger
 * /campaign/save:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: create new campaign as draft.
 *     description:  Admin create new campaign draft  <br> with access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               resume:
 *                 type: string
 *               brand:
 *                 type: string
 *               description:
 *                 type: string
 *               reference:
 *                 type: string
 *               countries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     item_id:
 *                            type: integer
 *                     item_text:
 *                            type: string
 *               token:
 *                 type: object
 *                 properties:
 *                    name:
 *                      type: string
 *                    type:
 *                      type: string
 *                    addr:
 *                      type: string
 *               tags:
 *                 type: array
 *                 items:
 *                  id:
 *                      type: string
 *               endDate:
 *                 type: integer
 *               startDate:
 *                 type: integer
 *               remuneration:
 *                 type: string
 *               cost:
 *                 type: string
 *               cost_usd:
 *                 type: string
 *               ratios:
 *                 type: array
 *                 items:
 *                     oneOf:
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *               bounties:
 *                 type: array
 *                 items:
 *                     oneOf:
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "401":
 *          description: error:error message<br>"unothorized"
 *       "500":
 *          description: error:error message
 */

router.post('/save', verifyAuth, saveCampaign)

/**
 * @swagger
 * /campaign/{idCampaign}/kits:
 *   get:
 *     tags:
 *     - "campaign"
 *     summary: get kits
 *     description: Get campaign kits <br> without access_token
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: idCampaign
 *         description: the  idCampaign.
 *         in: path
 *         required: true
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "401":
 *          description: code,<br>error:"unauthorized"
 *       "500":
 *          description: code,<br>error
 */
router.get('/:idCampaign/kits', verifyAuth, kits)

/**
 * @swagger
 * /campaign/addKits:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: add kits.
 *     description:  Upload campaign kits  <br> with access_token.
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               campaign:
 *                 type: string
 *               file:
 *                 type: string
 *                 format : base64
 *               link:
 *                 type: string
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "401":
 *          description: code,<br>error:"unauthorized"
 *       "500":
 *          description: error:error message
 */

router.post('/addKits', verifyAuth, upload, addKits)

/**
 * @swagger
 * /campaign/update/{idCampaign}:
 *   put:
 *     tags:
 *     - "campaign"
 *     summary: Update campaign .
 *     description: Admin can update campaign  <br> with access_token.
 *     parameters:
 *       - name: idCampaign
 *         description: the  campaign id.
 *         in: path
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               resume:
 *                 type: string
 *               brand:
 *                 type: string
 *               description:
 *                 type: string
 *               reference:
 *                 type: string
 *               cover:
 *                 type: string
 *               coverSrc:
 *                 type: string
 *               logo:
 *                 type: string
 *               countries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     item_id:
 *                            type: integer
 *                     item_text:
 *                            type: string
 *               token:
 *                 type: object
 *                 properties:
 *                    name:
 *                      type: string
 *                    type:
 *                      type: string
 *                    addr:
 *                      type: string
 *               tags:
 *                 type: array
 *                 items:
 *                  id:
 *                      type: string
 *               endDate:
 *                 type: number
 *               startDate:
 *                 type: number
 *               remuneration:
 *                 type: string
 *               cost:
 *                 type: string
 *               cost_usd:
 *                 type: string
 *               ratios:
 *                 type: array
 *                 items:
 *                     oneOf:
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *               bounties:
 *                 type: array
 *                 items:
 *                     oneOf:
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "401":
 *          description: code,<br>error:"unauthorized"
 *       "500":
 *          description: error:error message
 */

router.put('/update/:idCampaign', verifyAuth, update)
/**
 * @swagger
 * /campaign/prom/stats/{idProm}:
 *   get:
 *     tags:
 *     - "campaign"
 *     summary: link stats
 *     description: return to user the link info and statistics
 *     parameters:
 *       - in: path
 *         name: idProm
 *         description: the idProm.
 *         required: true
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "500":
 *          description: error:error message
 */

router.get('/prom/stats/:idProm', linkStats)

/**
 * @swagger
 * /campaign/funding:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: Increase budget.
 *     description: Increase campaign budget.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               amount:
 *                 type: string
 *               tokenAddress:
 *                 type: string
 *               hash:
 *                 type: string
 *               pass:
 *                 type: string
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "401":
 *          description: code,<br>error:"unauthorized"
 *       "500":
 *          description: error:error message
 */
router.post('/funding', verifyAuth, increaseBudget)

/**
 * @swagger
 * /campaign/filterLinks/{id_wallet}:
 *   get:
 *     tags:
 *     - "campaign"
 *     summary: get loggedin user links
 *     description: return  the links of users
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id_wallet
 *         description: the address wallet of user.
 *         in: path
 *         required: true
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "401":
 *          description: code,<br>error:"unauthorized"
 *       "500":
 *          description: error:error message
 */
router.get('/filterLinks/:id_wallet', verifyAuth, getLinks)

/**
 * @swagger
 * /campaign/remaining:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: get remaining funds in a campaign
 *     description: this api allow the user to retrieve his funds in an ended campaign
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               hash:
 *                 type: string
 *               pass:
 *                 type: string
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "401":
 *          description: code,<br>error:"unauthorized"
 *       "500":
 *          description: error:error message
 */

router.post('/remaining', verifyAuth, getFunds)

/**
 * @swagger
 * /campaign/reject/{idLink}:
 *   put:
 *     tags:
 *     - "campaign"
 *     summary: reject link
 *     description: admin of campaign can reject a link
 *     parameters:
 *       - name: idLink
 *         description: the  idLink.
 *         in: path
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               idCampaign:
 *                 type: string
 *               title:
 *                 type: string
 *               email:
 *                 type: string
 *               link:
 *                 type: string
 *               reason:
 *                 type: string
 *               lang:
 *                 type: string
 *               idUser:
 *                 type: string
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "401":
 *          description: code,<br>error:"unauthorized"
 *       "500":
 *          description: error:error message
 */
router.put('/reject/:idLink', verifyAuth, rejectLink)

/**
 * @swagger
 * /campaign/coverByCampaign/{id}:
 *   get:
 *     tags:
 *     - "campaign"
 *     summary: campaign cover
 *     description: get campaign cover
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: the id of campaign.
 *         in: path
 *         required: true
 *     responses:
 *       "200":
 *          description: code,image
 *       "500":
 *          description: error:error message
 */
router.get('/coverByCampaign/:id', coverByCampaign)

router.post('/updateStat', updateStatistics)
module.exports = router

const axios = require('axios')
const qs = require('query-string')

module.exports = function createVcxapiClient (baseUrl, auth = null, logger = null) {
  if (baseUrl === null || baseUrl === undefined) {
    throw Error(`baseUrl is not defined!`)
  }

  async function getRequest (url) {
    if (logger) {
      logger.debug(`[Request] [GET] ${url}`)
    }
    let res
    try {
      res = await axios.get(url, { auth })
    } catch (err) {
      if (logger) {
        const messageText = `[Response] [GET] ${url} \n Failed with Status code: ${err.response.status} \nResponse body: ${JSON.stringify(err.response.data, null, 2)}`
        if (err.response.status === 404) {
          logger.warn(messageText)
        } else {
          logger.error(messageText)
        }
      }
      throw err
    }
    if (logger) {
      logger.debug(`[GET] ${url} \n Status code: ${res.status} \nResponse body: ${JSON.stringify(res.data, null, 2)}`)
    }
    return res.data
  }

  async function postRequest (url, payload) {
    if (logger) {
      logger.debug(`[Request] [POST] ${url}\n Request body: ${JSON.stringify(payload, null, 2)}`)
    }
    let res
    try {
      res = await axios.post(url, payload, { auth })
    } catch (err) {
      if (logger) {
        logger.error(`[Response] [POST] ${url} \n Failed with Status code: ${err.response.status} \nResponse body: ${JSON.stringify(err.response.data, null, 2)}`)
      }
      throw err
    }
    if (logger) {
      logger.debug(`[Response] [POST] ${url} \n Status code: ${res.status} \nResponse body: ${JSON.stringify(res.data, null, 2)}`)
    }
    return res.data
  }

  async function putRequest (url, payload) {
    if (logger) {
      logger.debug(`[Request] [PUT] ${url}\n Request body: ${JSON.stringify(payload, null, 2)}`)
    }
    let res
    try {
      res = await axios.put(url, payload, { auth })
    } catch (err) {
      if (logger) {
        logger.error(`[Response] [PUT] ${url} \n Failed with Status code: ${err.response.status} \nResponse body: ${JSON.stringify(err.response.data, null, 2)}`)
      }
      throw err
    }
    if (logger) {
      logger.debug(`[Response] [PUT] ${url} \n Status code: ${res.status} \nResponse body: ${JSON.stringify(res.data, null, 2)}`)
    }
    return res.data
  }

  async function deleteRequest (url) {
    if (logger) {
      logger.debug(`[Request] [DELETE] ${url}`)
    }
    let res
    try {
      res = await axios.delete(url, { auth })
    } catch (err) {
      if (logger) {
        logger.error(`[Response] [DELETE] ${url} \n Failed with Status code: ${err.response.status} \nResponse body: ${JSON.stringify(err.response.data, null, 2)}`)
      }
      throw err
    }
    if (logger) {
      logger.debug(`[Response] [DELETE] ${url} \n Status code: ${res.status} \nResponse body: ${JSON.stringify(res.data, null, 2)}`)
    }
    return res.data
  }

  async function returnNullFor404 (axiosCallableReturningResponseData) {
    try {
      const data = await axiosCallableReturningResponseData()
      return data
    } catch (err) {
      if (err.response.status === 404) {
        return null
      } else throw err
    }
  }

  // ------------------------------ CONNECTIONS ------------------------------

  async function createConnection (connectionId) {
    return postRequest(`${baseUrl}/api/connections/${connectionId}`)
  }

  async function getConnectionInvite (connectionId, abbr = true) {
    const qs = `?abbr=${abbr}`
    const { invitationString } = await getRequest(`${baseUrl}/api/connections/${connectionId}/invite${qs}`)
    return invitationString
  }

  async function getConnections () {
    return getRequest(`${baseUrl}/api/connections`)
  }

  async function getConnectionIdByTheirPwDid (theirPwDid) {
    const qs = `?theirPwDid=${theirPwDid}`
    const data = await getRequest(`${baseUrl}/api/connections${qs}`)
    if (data.length > 1) {
      throw Error(`More than 1 connection with theirPwDid=${theirPwDid} found. This is VCXS server bug.`)
    }
    return data
  }

  async function getConnection (connectionId) {
    const axiosCall = async () => {
      return getRequest(`${baseUrl}/api/connections/${connectionId}`)
    }
    return returnNullFor404(axiosCall)
  }

  async function deleteConnection (connectionId) {
    return deleteRequest(`${baseUrl}/api/connections/${connectionId}`)
  }

  // ------------------------------  CHALLENGES AND SIGNATURES ------------------------------
  async function createChallenge (connectionId, challengeId) {
    const data = await postRequest(`${baseUrl}/api/connections/${connectionId}/challenges/${challengeId}`)
    return data.challengeBase64
  }

  async function submitChallengeSolution (connectionId, challengeId, signatureBase64) {
    const target = `${baseUrl}/api/connections/${connectionId}/challenges/${challengeId}/solution`
    const data = await postRequest(target, { signatureBase64 })
    return data.success
  }

  async function getSignedData (connectionId, stringToSign) {
    const { data, signature } = await getRequest(`${baseUrl}/api/connections/${connectionId}/sign/${stringToSign}`)
    return { data, signature }
  }

  // ------------------------------ SCHEMAS ------------------------------

  /*
  Creates new schema on ledger and stores a record about it in VCX api
   */
  async function createSchema (schemaId, schemaName, schemaVersion, attributes) {
    return postRequest(`${baseUrl}/api/schemas/${schemaId}`, {
      schemaName,
      schemaVersion,
      attributes,
      method: 'create'
    })
  }

  /*
  Only creates record about schema on VCX api side, the schemaId is assumed to exist on the ledger
   */
  async function loadSchema (schemaId, attributes, schemaLedgerId) {
    return postRequest(`${baseUrl}/api/schemas/${schemaId}`, {
      attributes,
      schemaLedgerId,
      method: 'load'
    })
  }

  async function getSchemas () {
    return getRequest(`${baseUrl}/api/schemas`)
  }

  async function getSchemaById (schemaId) {
    const axiosCall = async () => {
      return getRequest(`${baseUrl}/api/schemas?selection=${JSON.stringify({ schemaId })}`)
    }
    return returnNullFor404(axiosCall)
  }

  async function getSchemaByLedgerId (schemaLedgerId) {
    const axiosCall = async () => {
      return getRequest(`${baseUrl}/api/schemas?selection=${JSON.stringify({ schemaLedgerId })}`)
    }
    return returnNullFor404(axiosCall)
  }

  async function deleteSchema (id) {
    return deleteRequest(`${baseUrl}/api/schemas/${id}`)
  }

  // ------------------------------ CREDENTIAL DEFINITIONS ------------------------------
  async function createCredDef (schemaId, credDefId, credDefName) {
    return postRequest(`${baseUrl}/api/credential-defs/${credDefId}`, { schemaId, credDefName })
  }

  async function getCredDefs () {
    return getRequest(`${baseUrl}/api/credential-defs`)
  }

  async function getCredDef (credDefId) {
    const axiosCall = async () => {
      return getRequest(`${baseUrl}/api/credential-defs/${credDefId}`)
    }
    return returnNullFor404(axiosCall)
  }

  async function deleteCredDef (credDefId) {
    return deleteRequest(`${baseUrl}/api/credential-defs/${credDefId}`)
  }

  // ------------------------------ CREDENTIALS ------------------------------
  async function sendCredentialByConnection (credentialId, connectionId, credDefId, values, credentialName) {
    const data = await postRequest(
      `${baseUrl}/api/connections/${connectionId}/credentials/${credentialId}`,
      { credDefId, values, credentialName }
    )
    return data.id
  }

  async function sendCredentialByTheirPwDid (credentialId, theirPwDid, credDefId, values, credentialName) {
    const connections = await getConnectionIdByTheirPwDid(theirPwDid)
    if (!connections || connections.length < 1) {
      throw Error(`No connection was found by theirPwDid=${theirPwDid}`)
    }
    const connectionId = connections[0].id
    return sendCredentialByConnection(credentialId, connectionId, credDefId, values, credentialName)
  }

  async function getCredentials () {
    return getRequest(`${baseUrl}/api/credentials`)
  }

  async function getCredential (credentialId) {
    const axiosCall = async () => {
      return getRequest(`${baseUrl}/api/credentials/${credentialId}`)
    }
    return returnNullFor404(axiosCall)
  }

  async function deleteCredential (credentialId) {
    return deleteRequest(`${baseUrl}/api/credentials/${credentialId}`)
  }

  // ------------------------------ PROOFS ------------------------------
  async function sendProofRequest (connectionId, attributes, name) {
    const { id } = await postRequest(`${baseUrl}/api/connections/${connectionId}/proofs`, { attributes, name })
    return id
  }

  async function getProof (proofId) {
    const axiosCall = async () => {
      return getRequest(`${baseUrl}/api/proofs/${proofId}`)
    }
    return returnNullFor404(axiosCall)
  }

  async function getProofs () {
    return getRequest(`${baseUrl}/api/proofs`)
  }

  async function deleteProof (proofId) {
    return deleteRequest(`${baseUrl}/api/proofs/${proofId}`)
  }

  // ------------------------------ MESSAGES ------------------------------
  async function sendMessage (connectionId, msg, type, title) {
    return postRequest(`${baseUrl}/api/connections/${connectionId}/messages`, { msg, type, title })
  }

  async function getMessages (connectionId, types, statuses) {
    return getRequest(`${baseUrl}/api/connections/${connectionId}/messages?${qs.stringify({ types, statuses }, { arrayFormat: 'bracket' })}`)
  }

  async function updateMessages (connectionId, uids) {
    return putRequest(`${baseUrl}/api/connections/${connectionId}/messages`, { uids })
  }

  return {
    createConnection,
    getConnectionInvite,
    getConnections,
    getConnection,
    deleteConnection,

    createChallenge,
    getSignedData,
    submitChallengeSolution,

    createSchema,
    loadSchema,
    getSchemaById,
    getSchemaByLedgerId,
    getSchemas,
    deleteSchema,

    createCredDef,
    getCredDef,
    getCredDefs,
    deleteCredDef,

    sendCredentialByConnection,
    sendCredentialByTheirPwDid,
    getCredentials,
    getCredential,
    deleteCredential,

    sendProofRequest,
    getProof,
    getProofs,
    deleteProof,

    sendMessage,
    getMessages,
    updateMessages
  }
}

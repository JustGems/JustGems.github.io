window.addEventListener('web3sdk-ready', async _ => {
  //------------------------------------------------------------------//
  // Variables
  
  const network = Web3SDK.network('polygon')
  const index = network.contract('index')
  const sale = network.contract('sale')
  const nft = network.contract('nft')
  const usdc = network.contract('usdc')

  const template = {
    mint: document.getElementById('template-item-mint').innerHTML,
    minted: document.getElementById('template-item-minted').innerHTML,
    burned: document.getElementById('template-item-burned').innerHTML,
    redeem: document.getElementById('template-item-redeem').innerHTML,
    attribute: document.getElementById('template-attribute').innerHTML,
    modal: {
      redeem: document.getElementById('template-modal-redeem').innerHTML,
      transfer: document.getElementById('template-modal-transfer').innerHTML
    }
  }

  const results = document.querySelector('div.results')

  var formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  });

  //------------------------------------------------------------------//
  // Functions 

  const urlparams = function(key) {
    const params = {}
    const query = new URLSearchParams(window.location.search)
    for (const parameters of query) {
      params[parameters[0]] = isNaN(parseFloat(parameters[1])) 
        ? parseFloat(parameters[1])
        : parameters[1]
    }

    if (typeof key === 'string') return params[key]
    return params
  }

  const write = async (contract, method, args, success, error) => {
    try {
      await contract.gas(Web3SDK.state.account, 0)[method](...args)
    } catch(e) {
      const pattern = /have (\d+) want (\d+)/
      const matches = e.message.match(pattern)
      if (matches && matches.length === 3) {
        e.message = e.message.replace(pattern, `have ${
          Web3SDK.toEther(matches[1], 'int').toFixed(5)
        } ETH want ${
          Web3SDK.toEther(matches[2], 'int').toFixed(5)
        } ETH`)
      }
      return error(e, e.message.replace('err: i', 'I'))
    }

    try {
      const confirmations = 2
      await contract.write(Web3SDK.state.account, 0, {
        hash: function(resolve, reject, hash) {
          notify(
           'success', 
           `Transaction started on <a href="${network.config.chain_scanner}/tx/${hash}" target="_blank">
             ${network.config.chain_scanner}
           </a>. Please stay on this page and wait for ${confirmations} confirmations...`,
           1000000
          )
        },
        confirmation: function(resolve, reject, confirmationNumber, receipt) {
          if (confirmationNumber > confirmations) return
          if (confirmationNumber == confirmations) {
           notify('success', `${confirmationNumber}/${confirmations} confirmed on <a href="${network.config.chain_scanner}/tx/${receipt.transactionHash}" target="_blank">
             ${network.config.chain_scanner}
           </a>.`)
           success()
           resolve()
           return
          }
          notify('success', `${confirmationNumber}/${confirmations} confirmed on <a href="${network.config.chain_scanner}/tx/${receipt.transactionHash}" target="_blank">
           ${network.config.chain_scanner}
          </a>. Please stay on this page and wait for ${confirmations} confirmations...`, 1000000)
        },
        receipt: function(resolve, reject, receipt) {
          notify(
           'success', 
           `Confirming on <a href="${network.config.chain_scanner}/tx/${receipt.transactionHash}" target="_blank">
             ${network.config.chain_scanner}
           </a>. Please stay on this page and wait for ${confirmations} confirmations...`,
           1000000
          )
        }
      })[method](...args)
    } catch(e) {
      return error(e, e.message.replace('err: i', 'I'))
    }
  }

  const detail = async tokenId => {
    let token = null
    try {
      token = await index.read().detail(usdc.address, tokenId)
    } catch(e) {
      return null
    }

    let owner = null
    try {
      owner = await nft.read().ownerOf(tokenId)
    } catch(e) {}

    const response = await fetch(token.uri)
    const json = await response.json()

    return {
      id: tokenId,
      name: json.name,
      owner: owner,
      description: json.description,
      attributes: json.attributes,
      image: json.image,
      minted: token.minted,
      price: token.price
    }
  }

  //------------------------------------------------------------------//
  // Events

  window.addEventListener('mint-click',  async _ => {
    //check if logged in
    if (!(await network.active())) {
      return network.connectCB(Web3SDK.providers, (newstate, session) => {
        //update state
        Object.assign(Web3SDK.state, newstate, { connected: true })
        //update loggedin state
        window.localStorage.setItem('WEB3_LOGGED_IN', true)
        window.dispatchEvent(new Event('mint-click'))
      }, () => {})
    }
    const row = await detail(tokenId)
    if (!row) {
      return notify('error', `Token ${tokenId} not found.`)
    } else if (row.minted) {
      return notify('error', `Token ${tokenId} already minted.`)
    }

    notify('info', `Minting ${tokenId}. Please wait...`)

    //check balance
    const balance = await usdc.read().balanceOf(Web3SDK.state.account)
    if ((row.price - balance) > 0) return notify('error', 'You dont have enough USDC')
    const allowance = await usdc.read().allowance(Web3SDK.state.account, sale.address)
    if (allowance == 0) {
      return write(usdc, 'approve', [sale.address, row.price], () => {
        window.dispatchEvent(new Event('mint-click'))
      }, e => {
        return notify('error', e.message || e)
      })
    }

    return write(sale, 'mint(address,uint256,address)', [
      usdc.address, 
      tokenId,
      Web3SDK.state.account
    ], () => {
      window.location.reload()
    }, e => {
      return notify('error', e.message || e)
    })
  })

  window.addEventListener('redeem-click',  async _ => {
    //check if logged in
    if (!(await network.active())) {
      return network.connectCB(Web3SDK.providers, (newstate, session) => {
        //update state
        Object.assign(Web3SDK.state, newstate, { connected: true })
        //update loggedin state
        window.localStorage.setItem('WEB3_LOGGED_IN', true)
        window.dispatchEvent(new Event('redeem-click'))
      }, () => {})
    }
  
    const row = await detail(tokenId)
    if (!row) {
      return notify('error', `Token ${tokenId} not found.`)
    }

    let owner
    try {
      owner = await nft.read().ownerOf(tokenId)
    } catch(e) {
      return notify('error', `Could not retrieve token ${tokenId} owner.`)
    }
    //check owner
    if (owner.toLowerCase() !== Web3SDK.state.account.toLowerCase()) {
      return notify('error', `You are not the owner of token ${tokenId}.`)
    }

    const web3 = Web3SDK.web3()
    //make a message
    const message = web3.utils.sha3([
      web3.utils.toHex('redeem'),
      tokenId.toString(16).padStart(64, '0')
    ].join(''), { encoding: 'hex' }).slice(2);
    //sign a message
    let signed
    try {
      signed = await ethereum.request({ 
        method: 'personal_sign', 
        params: [ message, Web3SDK.state.account ] 
      });
    } catch(e) {
      return notify('error', e.message || e)
    }
    //make a url
    const url = `${window.location.origin}/redeem.html?token=${tokenId}&proof=${signed}`
    //make a QR code
    const modal = theme.toElement(template.modal.redeem)
    document.body.appendChild(modal)
    window.doon(modal)

    new QRCode(document.getElementById('qr-redeem'), {
      text: url,
      width: 250,
      height: 250,
      colorDark : "#000000",
      colorLight : "#FFFFFF",
      correctLevel : QRCode.CorrectLevel.H
    });
  })

  window.addEventListener('transfer-modal-click',  async _ => {
    //check if logged in
    if (!(await network.active())) {
      return network.connectCB(Web3SDK.providers, (newstate, session) => {
        //update state
        Object.assign(Web3SDK.state, newstate, { connected: true })
        //update loggedin state
        window.localStorage.setItem('WEB3_LOGGED_IN', true)
        window.dispatchEvent(new Event('redeem-click'))
      }, () => {})
    }
  
    const row = await detail(tokenId)
    if (!row) {
      return notify('error', `Token ${tokenId} not found.`)
    }

    let owner
    try {
      owner = await nft.read().ownerOf(tokenId)
    } catch(e) {
      return notify('error', `Could not retrieve token ${tokenId} owner.`)
    }
    //check owner
    if (Web3SDK.state?.account && owner.toLowerCase() !== Web3SDK.state.account.toLowerCase()) {
      return notify('error', `You are not the owner of token ${tokenId}.`)
    }

    const modal = theme.toElement(template.modal.transfer)
    document.body.appendChild(modal)
    window.doon(modal)
  })

  window.addEventListener('transfer-click',  async _ => {
    //check if logged in
    if (!(await network.active())) {
      return network.connectCB(Web3SDK.providers, (newstate, session) => {
        //update state
        Object.assign(Web3SDK.state, newstate, { connected: true })
        //update loggedin state
        window.localStorage.setItem('WEB3_LOGGED_IN', true)
        window.dispatchEvent(new Event('redeem-click'))
      }, () => {})
    }
  
    const row = await detail(tokenId)
    if (!row) {
      return notify('error', `Token ${tokenId} not found.`)
    }

    let owner
    try {
      owner = await nft.read().ownerOf(tokenId)
    } catch(e) {
      return notify('error', `Could not retrieve token ${tokenId} owner.`)
    }
    //check owner
    if (Web3SDK.state?.account && owner.toLowerCase() !== Web3SDK.state.account.toLowerCase()) {
      return notify('error', `You are not the owner of token ${tokenId}.`)
    }

    const walletAddress = document.getElementById('transfer-wallet').value

    if (!walletAddress?.length) {
      return notify('error', 'Invalid wallet address')
    }

    return write(nft, 'safeTransferFrom', [
      Web3SDK.state.account, 
      walletAddress,
      tokenId,
    ], () => {
      window.location.reload()
    }, e => {
      return notify('error', e.message || e)
    })
  })

  window.addEventListener('modal-close-click', () => {
    document.body.removeChild(document.querySelector('div.modal'))
  })

  //------------------------------------------------------------------//
  // Initialize
  const tokenId = parseInt(urlparams('token'))
  if (!tokenId) return (window.location.href = './shop.html')
  //initialize asyncronously
  ;(async _ => {
    const row = await detail(tokenId)
    if (!row) {
      window.location.href = './shop.html'
    }

    results.innerHTML = ''

    let itemTemplate
    if (!row.minted) {
      itemTemplate = template.mint
        .replace('{PRICE}', formatter.format(row.price / 1000000).substring(1))
    } else if (!row.owner) {
      itemTemplate = template.burned
    } else if (Web3SDK.state?.account && row.owner.toLowerCase() === Web3SDK.state.account.toLowerCase()) {
      itemTemplate = template.redeem
        .replace('{OPENSEA_OWNER_LINK}', `https://opensea.io/${row.owner}`)
        .replace('{OPENSEA_ITEM_LINK}', `${network.config.chain_marketplace}/${nft.address}/${tokenId}`)
    } else {
      itemTemplate = template.minted
        .replace('{OWNER}', `${row.owner.substring(0, 4)}...${
          row.owner.substring(row.owner.length - 4)
        }`)
        .replace('{OPENSEA_OWNER_LINK}', `https://opensea.io/${row.owner}`)
        .replace('{OPENSEA_ITEM_LINK}', `${network.config.chain_marketplace}/${nft.address}/${tokenId}`)
    }
    
    const item = theme.toElement(itemTemplate, {
      '{ID}': row.id,
      '{IMAGE}': row.image,
      '{NAME}': row.name,
      '{DESCRIPTION}': row.description
    })

    results.appendChild(item)

    if (Array.isArray(row.attributes)) {
      for (const trait of row.attributes) {
        item.querySelector('div.attributes').appendChild(
          theme.toElement(template.attribute, {
            '{NAME}': trait.trait_type,
            '{VALUE}': trait.value
          })
        )
      }
    }

    window.doon(item)
    theme.hide('#preload', true)
  })();
})
window.addEventListener('web3sdk-ready', async _ => {
  //------------------------------------------------------------------//
  // Variables
  
  const network = Web3SDK.network('polygon')
  const index = network.contract('index')
  const store = network.contract('store')
  const usdc = network.contract('usdc')

  const zero = '0x0000000000000000000000000000000000000000'

  const template = {
    item: document.getElementById('template-item').innerHTML,
    attribute: document.getElementById('template-attribute').innerHTML
  }

  const results = document.querySelector('div.results')

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

    const response = await fetch(token.uri)
    const json = await response.json()

    return {
      id: tokenId,
      name: json.name,
      description: json.description,
      attributes: json.attributes,
      image: json.image,
      minted: token.minted,
      price: token.price
    }
  }

  //------------------------------------------------------------------//
  // Events

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

    //check if has role
    const hasRole = store.read().hasRole(
      '0x9cf888df9829983a4501c3e5076732bbf523e06c6b31f6ce065f61c2aec20567',
      Web3SDK.state.account
    )

    if (!hasRole) {
      return notify('error', `${Web3SDK.state.account} does not have store role.`)
    }
  
    const row = await detail(tokenId)
    if (!row) {
      return notify('error', `Token ${tokenId} not found.`)
    }

    return write(store, 'redeem', [
      tokenId,
      proof
    ], () => {
      notify('success', `Token ${tokenId} is now redeemed`)
      window.location.reload()
    }, e => {
      return notify('error', e.message || e)
    })
  })

  //------------------------------------------------------------------//
  // Initialize
  const { token, proof } = urlparams()
  if (!token) return (window.location.href = './shop.html')
  const tokenId = parseInt(token)
  //initialize asyncronously
  ;(async _ => {
    const row = await detail(tokenId)
    if (!row) {
      window.location.href = './shop.html'
    }

    results.innerHTML = ''
    
    const item = theme.toElement(template.item, {
      '{ID}': row.id,
      '{IMAGE}': row.image,
      '{NAME}': row.name,
      '{DESCRIPTION}': row.description
    })

    if (!row.minted) {
      item.querySelector('div.action-redeem').innerHTML 
        = '<div class="alert alert-solid alert-error">Not Minted Yet</div>'
    } else if ((await store.read().redeemed(tokenId)) !== zero) {
      item.querySelector('div.action-redeem').innerHTML 
        = '<div class="alert alert-solid alert-error">Already Redeemed</div>'
    }

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
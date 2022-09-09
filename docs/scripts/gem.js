window.addEventListener('web3sdk-ready', async _ => {
  //------------------------------------------------------------------//
  // Variables
  
  const network = Web3SDK.network('polygon')
  const nft = network.contract('nft')
  const usdc = network.contract('usdc')

  const template = {
    item: document.getElementById('template-item').innerHTML,
    attribute: document.getElementById('template-attribute').innerHTML
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
    const params = { to: contract.address, from: Web3SDK.state.account }
    const rpc = contract.resource.methods[method](...args)
    
    //gas check
    try {
      await rpc.estimateGas(params)
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

      console.error(e)
      return error(e.message.replace('err: i', 'I'))
    }
    //now write
    const confirmations = 2
    const emitter = rpc.send(params)

    //listen to observers
    emitter.on('transactionHash', function(hash) {
      notify(
        'success', 
        `Transaction started on <a href="${network.config.chain_scanner}/tx/${hash}" target="_blank">
          ${network.config.chain_scanner}
        </a>. Please stay on this page and wait for ${confirmations} confirmations...`,
        1000000
      )
    });

    emitter.on('confirmation', function(confirmationNumber, receipt) {
      if (confirmationNumber > confirmations) return
      if (confirmationNumber == confirmations) {
        notify('success', `${confirmationNumber}/${confirmations} confirmed on <a href="${network.config.chain_scanner}/tx/${receipt.transactionHash}" target="_blank">
          ${network.config.chain_scanner}
        </a>.`)
        return success()
      }
      notify('success', `${confirmationNumber}/${confirmations} confirmed on <a href="${network.config.chain_scanner}/tx/${receipt.transactionHash}" target="_blank">
        ${network.config.chain_scanner}
      </a>. Please stay on this page and wait for ${confirmations} confirmations...`, 1000000)
    });

    emitter.on('receipt', function(receipt) {
      notify(
        'success', 
        `Confirming on <a href="${network.config.chain_scanner}/tx/${receipt.transactionHash}" target="_blank">
          ${network.config.chain_scanner}
        </a>. Please stay on this page and wait for ${confirmations} confirmations...`,
        1000000
      )
    });

    try {
      await emitter
    } catch(e) {
      console.error(e)
      return error(e.message.replace('err: i', 'I'))
    }
  }

  //------------------------------------------------------------------//
  // Events

  window.addEventListener('web3sdk-connected', async _ => {
    const lastTokenId = await nft.read().lastTokenId()
    let owner = null
    try {
      owner = await nft.read().ownerOf(tokenId)
    } catch(e) {}
    const mintable = tokenId <= lastTokenId && !owner
    const price = await nft.read()['priceOf(address,uint256)'](usdc.address, tokenId)
    const uri = await nft.read().tokenURI(tokenId)
    const response = await fetch(uri)
    const json = await response.json()
    const row = {
      id: tokenId,
      name: json.name,
      description: json.description,
      attributes: json.attributes,
      image: json.image,
      price: mintable ? price : 0
    }

    results.innerHTML = ''
    
    const item = theme.toElement(template.item, {
      '{ID}': row.id,
      '{IMAGE}': row.image,
      '{NAME}': row.name,
      '{DESCRIPTION}': row.description,
      '{ACTION}': mintable ? 'MINT NOW': 'VIEW ON OPENSEA',
      '{PRICE_HIDE}': parseInt(row.price) ? '': ' hide',
      '{PRICE}': parseInt(row.price) ? formatter.format(row.price / 1000000).substring(1): ''
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
  })

  window.addEventListener('web3sdk-disconnected',  async _ => {})

  window.addEventListener('mint-click',  async _ => {
    let owner = null
    try {
      owner = await nft.read().ownerOf(tokenId)
    } catch(e) {}
    if (owner) return (window.location.href = `${network.config.chain_marketplace}/${nft.address}/${tokenId}`)

    //check balance
    const price = await nft.read()['priceOf(address,uint256)'](usdc.address, tokenId)
    const balance = await usdc.read().balanceOf(Web3SDK.state.account)
    if (price > balance) return notify('error', 'You dont have enough USDC')

    const allowance = await usdc.read().allowance(Web3SDK.state.account, nft.address)
    if (allowance == 0) {
      return write(usdc, 'approve', [nft.address, price], () => {
        window.dispatchEvent(new Event('mint-click'))
      }, e => {
        return notify('error', e)
      })
    }

    return write(nft, 'mint(address,uint256,address)', [
      usdc.address, 
      tokenId,
      Web3SDK.state.account
    ], () => {
      window.location.reload()
    }, e => {
      return notify('error', e)
    })
  })

  //------------------------------------------------------------------//
  // Initialize
  const tokenId = parseInt(urlparams('token'))
  if (!tokenId) return (window.location.href = './shop.html')
})
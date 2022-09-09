window.addEventListener('web3sdk-ready', async _ => {
  //------------------------------------------------------------------//
  // Variables
  
  const network = Web3SDK.network('polygon')
  const nft = network.contract('nft')
  const usdc = network.contract('usdc')

  //------------------------------------------------------------------//
  // Functions 

  const upload = async file => {
    const body = new FormData
    body.append('file', file)
    const response = await fetch('https://ipfs.infura.io:5001/api/v0/add', {
      method: 'POST',
      headers: {
        Authorization: 'Basic MkVTdjNPOFhxWE9nQ2pxdFVPYjYxblp5MjVrOjIwZDBlMzE3NTUwZDgwYzNjZjRkMTA5ZTc4ZjFmMDNl'
      },
      body
    })
    return await response.json()
  }

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

  //------------------------------------------------------------------//
  // Events

  window.addEventListener('web3sdk-connected', async _ => {
    const tokenId = parseInt(urlparams('token'))
    if (!tokenId) return (window.location.href = './create.html')

    //get metadata
    const uri = await nft.read().tokenURI(tokenId)
    const response = await fetch(uri)
    const json = await response.json()
    //get price
    const price = await nft.read()['priceOf(address,uint256)'](usdc.address, tokenId)

    const fields = {
      name: document.getElementById('field-name'),
      description: document.getElementById('field-description'),
      image: document.getElementById('field-image-uri'),
      price: document.getElementById('field-price'),
      uri: document.getElementById('field-uri')
    }

    fields.name.setAttribute('value', json.name)
    fields.description.setAttribute('value', json.description)
    fields.image.setAttribute('value', json.image)
    fields.price.setAttribute('value', price / 1000000)
    fields.uri.setAttribute('value', uri)
    fields.image.parentNode.appendChild(document.createElement('img'))
    fields.image.parentNode.querySelector('img').setAttribute('src', json.image)

    if (Array.isArray(json.attributes)) {
      const template = `<div class="field-row input-group mb-3">
        <input
          class="meta-input name form-control"
          type="text"
          placeholder="Name"
          value="{NAME}"
          required
        />
        <input
          class="meta-input value form-control"
          placeholder="Value"
          value="{VALUE}"
          required
        />
        <div class="input-group-append">
          <a class="input-group-text text-danger remove" href="javascript:void(0)">
            <i class="fas fa-times"></i>
          </a>
        </div>
      </div>`
      json.attributes.forEach(trait => {
        const row = theme.toElement(template, {
          '{NAME}': trait.trait_type,
          '{VALUE}': trait.value
        })
        document.querySelector('div.field-attribute').prepend(row)
        row.querySelector('a.remove').addEventListener('click', _ => {
          row.parentNode.removeChild(row)
        })
      })
    }
  })

  window.addEventListener('web3sdk-disconnected', async _ => {})

  window.addEventListener('skip-click', async e => {
    theme.hide('section.section', true)
    theme.hide(`section.section-${e.for.getAttribute('data-step')}`, false)
  })

  window.addEventListener('update-image-keyup', async e => {
    const field = e.for
    if (!field.parentNode.querySelector('img')) {
      field.parentNode.appendChild(document.createElement('img'))
    }
    field.parentNode.querySelector('img').setAttribute('src', e.for.value)
  })

  window.addEventListener('field-attribute-init', async e => {
    const container = e.for
    const template = `<div class="field-row input-group mb-3">
      <input
        class="meta-input name form-control"
        type="text"
        placeholder="Name"
        required
      />
      <input
        class="meta-input value form-control"
        placeholder="Value"
        required
      />
      <div class="input-group-append">
        <a class="input-group-text text-danger remove" href="javascript:void(0)">
          <i class="fas fa-times"></i>
        </a>
      </div>
    </div>`

    const init = function(row) {
      row.querySelector('a.remove').addEventListener('click', _ => {
        row.parentNode.removeChild(row)
      })
    }
    container.querySelector('a.add').addEventListener('click', e => {
      const row = theme.toElement(template)
      container.prepend(row)
      init(row)
    })
  })

  window.addEventListener('upload-image-click', async _ => {
    const field = document.getElementById('field-image').files[0]
    if (!field) return notify('error', 'Image is required')
    //upload image
    notify('info', 'Uploading image...')
    const image = await upload(field)
    if (!image.Hash) return notify('error', 'Error when uploading')
    //set image value for next step
    const imageURI = `https://justgems.infura-ipfs.io/ipfs/${image.Hash}`
    const fieldImageURI = document.getElementById('field-image-uri')
    fieldImageURI.value = imageURI
    fieldImageURI.setAttribute('value', imageURI)
    if (!fieldImageURI.parentNode.querySelector('img')) {
      fieldImageURI.parentNode.appendChild(document.createElement('img'))
    }
    fieldImageURI.parentNode.querySelector('img').setAttribute('src', imageURI)
    //go to next step
    theme.hide('section.section-1', true)
    theme.hide('section.section-2', false)
  })

  window.addEventListener('upload-metadata-click', async _ => {
    //make metadata
    const metadata = {
      name: document.getElementById('field-name').value,
      description: document.getElementById('field-description').value,
      image: document.getElementById('field-image-uri').value
    }
    Array.from(document.querySelectorAll('div.field-attribute div.field-row')).forEach(row => {
      const name = row.querySelector('input.name').value
      const value = row.querySelector('input.value').value
      if (name.trim().length && value.trim().length) {
        if (!metadata.attributes) metadata.attributes = []
        metadata.attributes.push({
          trait_type: name.trim(),
          value: value.trim()
        })
      }
    })
    //validate data
    if (!metadata.name.trim().length) {
      return notify('error', 'Name is required')
    } else if (!metadata.description.trim().length) {
      return notify('error', 'Description is required')
    } else if (!metadata.image.trim().length) {
      return notify('error', 'Image is required')
    }
    //upload metadata
    notify('info', 'Uploading metadata...')
    const nextId = parseInt(await nft.read().lastTokenId()) + 1
    const file = new File([JSON.stringify(metadata, null, 2)], `${nextId}.json`, {
      type: 'application/json',
    });
    const json = await upload(file)
    if (!json.Hash) return notify('error', 'Error when uploading')
    //get uri needed for contract
    const metadataURI = `https://justgems.infura-ipfs.io/ipfs/${json.Hash}`
    const fieldMetadataURI = document.getElementById('field-uri')
    fieldMetadataURI.value = metadataURI
    fieldMetadataURI.setAttribute('value', metadataURI)
    //go to next step
    theme.hide('section.section-2', true)
    theme.hide('section.section-3', false)
  })

  window.addEventListener('update-metadata-click', async _ => {
    const tokenId = parseInt(urlparams('token'))
    const uri = document.getElementById('field-uri').value.trim()
    //gas check
    notify('info', 'Gas Check...')
    try {
      await nft.gas(Web3SDK.state.account, 0).updateTokenURI(tokenId, uri)
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
      notify('error', e.message.replace('err: i', 'I'))
      console.error(e)
      return
    }
    //now write
    notify('info', 'Writing to blockchain...')
    try {
      const confirmations = 2
      await nft.write(Web3SDK.state.account, 0, {
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
           window.location.reload()
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
      }).updateTokenURI(tokenId, uri)
    } catch(e) {
      notify('error', e.message.replace('err: i', 'I'))
      console.error(e)
      return
    }
  })

  window.addEventListener('update-price-click', async _ => {
    const tokenId = parseInt(urlparams('token'))
    const token = usdc.address
    const price = document.getElementById('field-price').value * 1000000
    //gas check
    notify('info', 'Gas Check...')
    try {
      await nft.gas(Web3SDK.state.account, 0)['updateTokenPrice(address,uint256,uint256)'](
        token, 
        tokenId,
        price
      )
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
      notify('error', e.message.replace('err: i', 'I'))
      console.error(e)
      return
    }
    //now write
    notify('info', 'Adding to blockchain...')
    try {
      const confirmations = 2
      await nft.write(Web3SDK.state.account, 0, {
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
           window.location.reload()
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
      })['updateTokenPrice(address,uint256,uint256)'](
        token, 
        tokenId,
        price
      )
    } catch(e) {
      notify('error', e.message.replace('err: i', 'I'))
      console.error(e)
      return
    }
  })

  //------------------------------------------------------------------//
  // Initialize
})
window.addEventListener('web3sdk-ready', async _ => {
  //------------------------------------------------------------------//
  // Variables
  
  const network = Web3SDK.network('polygon')
  const sale = network.contract('sale')
  const metadata = network.contract('metadata')
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

  //------------------------------------------------------------------//
  // Events

  window.addEventListener('web3sdk-connected', async _ => {
    Web3SDK.state.nextTokenId = parseInt(await metadata.read().lastTokenId()) + 1
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
    const add = container.querySelector('a.add')
    add.addEventListener('click', e => {
      const row = theme.toElement(template)
      container.insertBefore(row, add)
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
      image: document.getElementById('field-image-uri').value,
      external_url: `https://www.justgems.io/gem.html?token=${Web3SDK.state.nextTokenId}`
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
    const file = new File([JSON.stringify(metadata, null, 2)], `${Web3SDK.state.nextTokenId}.json`, {
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

  window.addEventListener('set-metadata-click', async _ => {
    const uri = document.getElementById('field-uri').value.trim()

    const traits = []
    const values = []
    Array.from(
      document.querySelectorAll('div.field-attribute div.field-row')
    ).forEach(row => {
      const name = row.querySelector('input.name').value
      const value = row.querySelector('input.value').value
      if (name.trim().length && value.trim().length) {
        traits.push(name.trim())
        values.push(value.trim())
      }
    })

    await write(metadata, 'setData', [
      Web3SDK.state.nextTokenId,
      uri, 
      traits,
      values
    ], () => {
      notify('success', `Metadata added for token ${Web3SDK.state.nextTokenId}`)
    }, (e, message) => {
      notify('error', message)
    })
  })

  window.addEventListener('set-price-click', async _ => {
    const token = usdc.address
    const price = Math.floor(document.getElementById('field-price').value * 1000000)

    await write(sale, 'setPrice(address,uint256,uint256)', [
      token,
      Web3SDK.state.nextTokenId,
      price
    ], () => {
      notify('success', `Price added for token ${Web3SDK.state.nextTokenId}`)
    }, (e, message) => {
      notify('error', message)
    })
  })

  //------------------------------------------------------------------//
  // Initialize
})
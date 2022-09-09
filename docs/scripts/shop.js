window.addEventListener('web3sdk-ready', async _ => {
  //------------------------------------------------------------------//
  // Variables
  
  const network = Web3SDK.network('polygon')
  const nft = network.contract('nft')
  const usdc = network.contract('usdc')

  const template = {
    item: document.getElementById('template-item').innerHTML
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

  const getDatabase = async callback => {
    const database = []
    const lastTokenId = await nft.read().lastTokenId()
    for (let i = 0; i < lastTokenId; i++) {
      const uri = await nft.read().tokenURI(i + 1)
      const price = await nft.read().priceOf(usdc.address, i + 1)
      let owner = null
      try {
        owner = await nft.read().ownerOf(i + 1)
      } catch(e) {}

      const response = await fetch(uri)
      const json = await response.json()
      const row = {
        id: i + 1,
        name: json.name,
        description: json.description,
        image: json.image,
        price: owner ? 0 : price
      }

      callback(row)
      database.push(row)
    }

    return database
  }

  //------------------------------------------------------------------//
  // Events

  window.addEventListener('web3sdk-connected', async _ => {
    results.innerHTML = ''
    getDatabase(row => {
      const item = theme.toElement(template.item, {
        '{ID}': row.id,
        '{IMAGE}': row.image,
        '{NAME}': row.name,
        '{PRICE_HIDE}': parseInt(row.price) ? '': ' hide',
        '{PRICE}': parseInt(row.price) ? formatter.format(row.price / 1000000).substring(1): ''
      })

      results.appendChild(item)
      window.doon(item)
    })
  })

  window.addEventListener('web3sdk-disconnected',  async _ => {})

  window.addEventListener('detail-click',  async e => {
    window.location.href = `./gem.html?token=${e.for.getAttribute('data-id')}`
  })

  //------------------------------------------------------------------//
  // Initialize
})
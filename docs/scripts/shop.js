window.addEventListener('web3sdk-ready', async _ => {
  //------------------------------------------------------------------//
  // Variables
  
  const network = Web3SDK.network('polygon')
  const nft = network.contract('nft')
  const index = network.contract('index')
  const metadata = network.contract('metadata')
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

  const search = async (traits, values, callback) => {
    const lastTokenId = await metadata.read().lastTokenId()
    const search = index.read()['search(address,uint256,uint256,string[],string[])']
    const results = await search(usdc.address, 1, lastTokenId, traits, values)

    let length = results.length

    for (const row of results) {
      let owner = null
      try {
        owner = await nft.read().ownerOf(row.id)
      } catch(e) {}

      if (row.minted && !owner) {
        length --
        continue
      }

      const response = await fetch(row.uri)
      const json = await response.json()

      callback({
        id: row.id,
        name: json.name,
        description: json.description,
        image: json.image,
        minted: row.minted,
        price: row.price
      })
    }

    if (!length) return []

    return results
  }

  //------------------------------------------------------------------//
  // Events

  window.addEventListener('detail-click',  async e => {
    window.location.href = `./gem.html?token=${e.for.getAttribute('data-id')}`
  })

  //------------------------------------------------------------------//
  // Initialize

  //initialize asyncronously
  ;(async _ => {
    results.innerHTML = ''

    const rows = await search([], [], row => {
      const item = theme.toElement(template.item, {
        '{ID}': row.id,
        '{IMAGE}': row.image,
        '{NAME}': row.name,
        '{PRICE_HIDE}': row.minted ? ' hide': '',
        '{PRICE}': parseInt(row.price) ? formatter.format(row.price / 1000000).substring(1): ''
      })

      results.appendChild(item)
      window.doon(item)
      theme.hide('#preload', true)
    })

    //if no rows
    if (!rows.length) {
      results.innerHTML = '<div class="alert alert-solid alert-info">No Gems Found.</div>'
      theme.hide('#preload', true)
    }
  })();
})
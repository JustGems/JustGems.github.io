(async (window) => {
  //sets up the Web3 SDK
  await Web3SDK.setupJSON(`/data/${
    document.getElementById('network').getAttribute('data-value')
  }.json`)

  //------------------------------------------------------------------//
  // Variables

  const WalletConnectProvider = window.WalletConnectProvider.default
  const Fortmatic = window.Fortmatic

  Web3SDK.providers = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        infuraId: "2a7154bb1cf244d9a412d1925398058c",
      }
    },

    fortmatic: {
      package: Fortmatic,
      options: {
        key: "pk_live_7C75AFDDC4136F81"
      }
    }
  }

  Web3SDK.state = { connected: false }

  const network = Web3SDK.network('polygon')

  let listening = false

  //------------------------------------------------------------------//
  // Functions

  const connected = (newstate, session) => {
    //update state
    Object.assign(Web3SDK.state, newstate, { connected: true })
    //update loggedin state
    window.localStorage.setItem('WEB3_LOGGED_IN', true)
    //update HTML state
    theme.hide('.connected', false)
    theme.hide('.disconnected', true)
    //if not connected via session
    if (!session) {
      notify('success', 'Wallet connected')
    }

    Array.from(document.querySelectorAll('.btn-address')).forEach((button) => {
      button.innerHTML = `${Web3SDK.state.account.substring(0, 4)}...${
        Web3SDK.state.account.substring(Web3SDK.state.account.length - 4)
      }`
    })

    setTimeout(_ => {
      window.dispatchEvent(new Event('web3sdk-connected'))
    }, 100)
  }

  const disconnected = (newstate, error, session) => {
    //update state
    Object.assign(Web3SDK.state, newstate)
    //update loggedin state
    window.localStorage.setItem('WEB3_LOGGED_IN', false)
    //if error, report it
    if (!session && error) notify('error', error.message)
    //update html state
    theme.hide('.connected', true)
    theme.hide('.disconnected', false)

    setTimeout(_ => {
      window.dispatchEvent(new Event('web3sdk-disconnected'))
    }, 100)
  }

  //------------------------------------------------------------------//
  // Events

  window.addEventListener('connect-click', _ => {
    network.connectCB(Web3SDK.providers, (newstate, session) => {
      connected(newstate, session)
      window.location.reload()
    }, (newstate, error, session) => {
      disconnected(newstate, error, session)
      window.location.reload()
    })
  })

  window.addEventListener('disconnect-click', _ => {
    disconnected({ connected: false, account: undefined, provider: undefined })
    window.location.reload()
  })

  //------------------------------------------------------------------//
  // Initialize

  try {
    window.dispatchEvent(new Event('web3sdk-ready'))
  } catch(e) {
    console.error(e)
  }

  if (window.localStorage.getItem('WEB3_LOGGED_IN') === 'true') {
    network.startSession(connected, disconnected, listening === false)
    listening = true
  }

  window.addEventListener('toggle-show-click', e => {
    theme.toggle(e.for.getAttribute('data-target'), 'hide')
  })

  window.doon(document.body)
})(window)
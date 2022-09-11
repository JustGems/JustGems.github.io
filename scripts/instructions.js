//to run this on testnet:
// $ npx hardhat run scripts/instructions.js

const hardhat = require('hardhat')

function getRole(name) {
  if (!name || name === 'DEFAULT_ADMIN_ROLE') {
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  }

  return '0x' + Buffer.from(
    hardhat.ethers.utils.solidityKeccak256(['string'], [name]).slice(2)
    , 'hex'
  ).toString('hex');
}

async function main() {
  const network = hardhat.config.networks[hardhat.config.defaultNetwork]
  const nft = { address: network.contracts.nft }
  const metadata = { address: network.contracts.metadata }
  const sale = { address: network.contracts.sale }
  const store = { address: network.contracts.store }
  const index = { address: network.contracts.index }
  const usdc = { address: network.contracts.usdc }

  console.log('-----------------------------------')
  console.log('Instructions for adding a Role Admin')
  console.log('')
  console.log('In JustGems contract, grant DEFAULT_ADMIN_ROLE')
  console.log(` - ${network.scanner}/address/${nft.address}#writeContract`)
  console.log(` - grantRole( ${getRole('DEFAULT_ADMIN_ROLE')}, [ROLE ADMIN ADDRESS] )`)
  console.log('In JustGemsData contract, grant DEFAULT_ADMIN_ROLE')
  console.log(` - ${network.scanner}/address/${metadata.address}#writeContract`)
  console.log(` - grantRole( ${getRole('DEFAULT_ADMIN_ROLE')}, [MANAGER ADDRESS] )`)
  console.log('In JustGemsIndex contract, grant DEFAULT_ADMIN_ROLE')
  console.log(` - ${network.scanner}/address/${index.address}#writeContract`)
  console.log(` - grantRole( ${getRole('DEFAULT_ADMIN_ROLE')}, [ROLE ADMIN ADDRESS] )`)
  console.log('In JustGemsSale contract, grant DEFAULT_ADMIN_ROLE')
  console.log(` - ${network.scanner}/address/${sale.address}#writeContract`)
  console.log(` - grantRole( ${getRole('DEFAULT_ADMIN_ROLE')}, [ROLE ADMIN ADDRESS] )`)
  console.log('In JustGemsStore contract, grant DEFAULT_ADMIN_ROLE')
  console.log(` - ${network.scanner}/address/${store.address}#writeContract`)
  console.log(` - grantRole( ${getRole('DEFAULT_ADMIN_ROLE')}, [ROLE ADMIN ADDRESS] )`)
  console.log('')
  console.log('-----------------------------------')
  console.log('Instructions for adding a Contract Admin')
  console.log('')
  console.log('In JustGems contract, grant CURATOR_ROLE')
  console.log(` - ${network.scanner}/address/${nft.address}#writeContract`)
  console.log(` - grantRole( ${getRole('CURATOR_ROLE')}, [CONTRACT ADMIN ADDRESS] )`)
  console.log('In JustGemsIndex contract, grant CURATOR_ROLE')
  console.log(` - ${network.scanner}/address/${index.address}#writeContract`)
  console.log(` - grantRole( ${getRole('CURATOR_ROLE')}, [CONTRACT ADMIN ADDRESS] )`)
  console.log('')
  console.log('-----------------------------------')
  console.log('Instructions for adding a Store Manager')
  console.log('')
  console.log('In JustGemsData contract, grant CURATOR_ROLE')
  console.log(` - ${network.scanner}/address/${metadata.address}#writeContract`)
  console.log(` - grantRole( ${getRole('CURATOR_ROLE')}, [MANAGER ADDRESS] )`)
  console.log('In JustGemsSale contract, grant CURATOR_ROLE')
  console.log(` - ${network.scanner}/address/${sale.address}#writeContract`)
  console.log(` - grantRole( ${getRole('CURATOR_ROLE')}, [MANAGER ADDRESS] )`)
  console.log('')
  console.log('-----------------------------------')
  console.log('Instructions for adding a Store Consumer')
  console.log('')
  console.log('In JustGemsStore contract, grant STORE_ROLE')
  console.log(` - ${network.scanner}/address/${store.address}#writeContract`)
  console.log(` - grantRole( ${getRole('STORE_ROLE')}, [STORE ADDRESS] )`)
  console.log('')
  console.log('-----------------------------------')
  console.log('Instructions for adding a Funder')
  console.log('')
  console.log('In JustGemsSale contract, grant FUNDER_ROLE')
  console.log(` - ${network.scanner}/address/${sale.address}#writeContract`)
  console.log(` - grantRole( ${getRole('FUNDER_ROLE')}, [FUNDER ADDRESS] )`)
  console.log('')
  console.log('-----------------------------------')
  console.log('Instructions for adding a Tester')
  console.log('')
  console.log('In MockUSDC contract, mint $50,000 USDC')
  console.log(` - ${network.scanner}/address/${usdc.address}#writeContract`)
  console.log(` - mint([TESTER ADDRESS], 50000000000 )`)
  console.log('')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
})
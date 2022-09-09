//to run this on testnet:
// $ npx hardhat run scripts/4-deploy-index.js

const hardhat = require('hardhat')

async function deploy(name, ...params) {
  //deploy the contract
  const ContractFactory = await hardhat.ethers.getContractFactory(name);
  const contract = await ContractFactory.deploy(...params);
  await contract.deployed();

  return contract;
}

async function main() {
  //get network and admin
  const network = hardhat.config.networks[hardhat.config.defaultNetwork]
  const admin = new ethers.Wallet(network.accounts[0])
  const metadata = { address: network.contracts.metadata }
  const sale = { address: network.contracts.sale }

  console.log('Deploying JustGemsIndex ...')
  const index = await deploy('JustGemsIndex', admin.address)

  console.log('')
  console.log('-----------------------------------')
  console.log('JustGemsIndex deployed to:', index.address)
  console.log('')
  console.log(
    'npx hardhat verify --show-stack-traces --network',
    hardhat.config.defaultNetwork,
    index.address,
    `"${admin.address}"`
  )
  console.log('')
  console.log('-----------------------------------')
  console.log('Next Steps:')
  console.log('In JustGemsIndex contract, grant CURATOR_ROLE to admin (choose another wallet)')
  console.log(` - ${network.scanner}/address/${index.address}#writeContract`)
  console.log(` - grantRole( ${getRole('CURATOR_ROLE')}, ${admin.address} )`)
  console.log('In JustGemsIndex contract, add metadata and saleable')
  console.log(` - ${network.scanner}/address/${index.address}#writeContract`)
  console.log(` - setMetadata( ${metadata.address} )`)
  console.log(` - setSaleable( ${sale.address} )`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
});
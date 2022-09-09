//to run this on testnet:
// $ npx hardhat run scripts/2-deploy-data.js

const hardhat = require('hardhat')

async function deploy(name, ...params) {
  //deploy the contract
  const ContractFactory = await hardhat.ethers.getContractFactory(name);
  const contract = await ContractFactory.deploy(...params);
  await contract.deployed();

  return contract;
}

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
  //get network and admin
  const network = hardhat.config.networks[hardhat.config.defaultNetwork]
  const admin = new ethers.Wallet(network.accounts[0])
  const nft = { address: network.contracts.nft }

  console.log('Deploying JustGemsData ...')
  const metadata = await deploy('JustGemsData', admin.address)

  console.log('')
  console.log('-----------------------------------')
  console.log('JustGemsData deployed to:', metadata.address)
  console.log('')
  console.log('Roles: CURATOR_ROLE')
  console.log('')
  console.log(
    'npx hardhat verify --show-stack-traces --network',
    hardhat.config.defaultNetwork,
    metadata.address,
    `"${admin.address}"`
  )
  console.log('')
  console.log('-----------------------------------')
  console.log('Next Steps:')
  console.log('In JustGemsData contract, grant CURATOR_ROLE to admin (choose another wallet)')
  console.log(` - ${network.scanner}/address/${metadata.address}#writeContract`)
  console.log(` - grantRole( ${getRole('CURATOR_ROLE')}, ${admin.address} )`)
  console.log('In JustGems contract, set metadata to JustGemsData')
  console.log(` - ${network.scanner}/address/${nft.address}#writeContract`)
  console.log(` - setMetadata( ${metadata.address} )`)
  console.log('')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
});
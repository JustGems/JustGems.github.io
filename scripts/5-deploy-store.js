//to run this on testnet:
// $ npx hardhat run scripts/5-deploy-store.js

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

  console.log('Deploying JustGemsStore ...')
  const store = await deploy('JustGemsStore', nft.address, admin.address)

  console.log('')
  console.log('-----------------------------------')
  console.log('JustGemsStore deployed to:', store.address)
  console.log('')
  console.log('Roles: CONSUMER_ROLE')
  console.log('')
  console.log(
    'npx hardhat verify --show-stack-traces --network',
    hardhat.config.defaultNetwork,
    store.address,
    `"${nft.address}"`,
    `"${admin.address}"`
  )
  console.log('')
  console.log('-----------------------------------')
  console.log('Next Steps:')
  console.log('In JustGemsStore contract, grant CONSUMER_ROLE to admin (choose another wallet)')
  console.log(` - ${network.scanner}/address/${store.address}#writeContract`)
  console.log(` - grantRole( ${getRole('CONSUMER_ROLE')}, ${admin.address} )`)
  console.log('In JustGems contract, grant BURNER_ROLE to JustGemsStore')
  console.log(` - ${network.scanner}/address/${nft.address}#writeContract`)
  console.log(` - grantRole( ${getRole('BURNER_ROLE')}, ${store.address} )`)
  console.log('')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
});
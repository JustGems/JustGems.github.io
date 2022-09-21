//to run this on testnet:
// $ npx hardhat run scripts/6-deploy-splitter.js

const hardhat = require('hardhat')

async function deploy(name, ...params) {
  //deploy the contract
  const ContractFactory = await hardhat.ethers.getContractFactory(name);
  const contract = await ContractFactory.deploy(...params);
  await contract.deployed();

  return contract;
}

//config
const recipients = [
  '0x07d6dDd2C456d3A08DCbC7DAB4B4bd4F075458cA',//aod
  '0xC162F2eF9fF4E7Ce613295Cc216476e400415478',//jj
]
const shares = [50, 50]

async function main() {
  console.log('Deploying PaymentSplitter...')
  const splitter = await deploy('PaymentSplitter', recipients, shares)
  console.log('')
  console.log('-----------------------------------')
  console.log('PaymentSplitter deployed to:', splitter.address)
  console.log(`npx hardhat verify --constructor-args scripts/splitter_args.js --contract @openzeppelin/contracts/finance/PaymentSplitter.sol:PaymentSplitter --network polygon ${splitter.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
});
const { expect, deploy, bindContract, getRole } = require('./utils');

describe('JustGems Tests', function () {
  before(async function() {
    const signers = await ethers.getSigners()

    const nft = await deploy('JustGems', signers[0].address)
    await bindContract('withNFT', 'JustGems', nft, signers)
    
    const metadata = await deploy('JustGemsData', signers[0].address)
    await bindContract('withData', 'JustGemsData', metadata, signers)

    const sale = await deploy('JustGemsSale', nft.address, signers[0].address)
    await bindContract('withSale', 'JustGemsSale', sale, signers)

    const store = await deploy('JustGemsStore', nft.address, signers[0].address)
    await bindContract('withStore', 'JustGemsStore', store, signers)

    const index = await deploy('JustGemsIndex', signers[0].address)
    await bindContract('withIndex', 'JustGemsIndex', index, signers)

    const usdc = await deploy('MockERC20USDC')
    await bindContract('withUSDC', 'MockERC20USDC', usdc, signers)

    const [ admin, holder1, holder2 ] = signers

    //admin roles

    //in JustGems, make admin CURATOR_ROLE
    await admin.withNFT.grantRole(getRole('CURATOR_ROLE'), admin.address)
    //in JustGemsData, make admin CURATOR_ROLE
    await admin.withData.grantRole(getRole('CURATOR_ROLE'), admin.address)
    //in JustGemsSale, make admin CURATOR_ROLE, FUNDER_ROLE
    await admin.withSale.grantRole(getRole('CURATOR_ROLE'), admin.address)
    await admin.withSale.grantRole(getRole('FUNDER_ROLE'), admin.address)
    //in JustGemsStore, make admin CONSUMER_ROLE
    await admin.withStore.grantRole(getRole('CONSUMER_ROLE'), admin.address)
    //in JustGemsIndex, make admin CURATOR_ROLE
    await admin.withIndex.grantRole(getRole('CURATOR_ROLE'), admin.address)

    //integrations

    //in JustGems, add metadata
    //NOTE: JustGemsData acts independant
    await admin.withNFT.setMetadata(metadata.address)
    //in JustGems, make JustGemsSale MINTER_ROLE
    //NOTE: JustGemsSale integrated with JustGems in constructor
    await admin.withNFT.grantRole(getRole('MINTER_ROLE'), sale.address)
    //in JustGems, make JustGemsStore BURNER_ROLE
    //NOTE: JustGemsStore integrated with JustGems in constructor
    await admin.withNFT.grantRole(getRole('BURNER_ROLE'), store.address)
    //in JustGemsIndex, add metadata and sale
    await admin.withIndex.setMetadata(metadata.address)
    await admin.withIndex.setSaleable(sale.address)

    //send USDC to admin
    await admin.withUSDC.mint(admin.address, 2000)

    this.signers = { admin, holder1, holder2 }
    this.zero = '0x0000000000000000000000000000000000000000'
  })

  it('Should setup tokens', async function () {
    const { admin } = this.signers
    //set token 1 price to 100 wei
    await admin.withSale['setPrice(uint256,uint256)'](1, 100)
    expect(await admin.withSale['priceOf(uint256)'](1)).to.equal(100)
    expect(await admin.withSale.minted(1)).to.equal(this.zero)

    //set token 2 price to 200 usdc
    const usdc = admin.withUSDC.address
    await admin.withSale['setPrice(address,uint256,uint256)'](usdc, 2, 200)
    expect(await admin.withSale['priceOf(address,uint256)'](usdc, 2)).to.equal(200)
    expect(await admin.withSale.minted(2)).to.equal(this.zero)
  })

  it('Should not mint', async function () {
    const { admin, holder1 } = this.signers
    const usdc = admin.withUSDC.address

    await expect(//token id not usdc priced in
      admin.withSale['mint(address,uint256,address)'](usdc, 1, holder1.address)
    ).to.be.revertedWith('InvalidCall()')

    await expect(//token id not eth priced
      admin.withSale['mint(uint256,address)'](2, holder1.address, {
        value: 200
      })
    ).to.be.revertedWith('InvalidCall()')
    
    await expect(//token id not priced at all
      admin.withSale['mint(uint256,address)'](3, holder1.address, {
        value: 100
      })
    ).to.be.revertedWith('InvalidCall()')
  })

  it('Should mint', async function () {
    const { admin, holder1, holder2 } = this.signers
  
    await admin.withSale['mint(uint256,address)'](1, holder1.address, {
      value: 100
    })
    expect(await admin.withSale.minted(1)).to.equal(holder1.address)
    expect(await admin.withNFT.balanceOf(holder1.address)).to.equal(1)
    expect(await admin.withNFT.ownerOf(1)).to.equal(holder1.address)

    admin.withUSDC.approve(admin.withSale.address, 200)
    await admin.withSale['mint(address,uint256,address)'](
      admin.withUSDC.address, 2, holder2.address
    )
  
    expect(await admin.withSale.minted(2)).to.equal(holder2.address)
    expect(await admin.withNFT.balanceOf(holder2.address)).to.equal(1)
    expect(await admin.withNFT.ownerOf(2)).to.equal(holder2.address)
  })

  it('Should withdraw', async function () {
    const { admin, holder1, holder2 } = this.signers

    expect(await ethers.provider.getBalance(admin.withSale.address)).to.equal(100)
    const ethBalance = await holder1.getBalance()
    await admin.withSale['withdraw(address)'](holder1.address)
    expect((await holder1.getBalance()).sub(ethBalance).toString()).to.be.equal('100')

    expect(await admin.withUSDC.balanceOf(admin.withSale.address)).to.equal(200)
    await admin.withSale['withdraw(address,address,uint256)'](admin.withUSDC.address, holder2.address, 200)
    expect(await admin.withUSDC.balanceOf(holder2.address)).to.be.equal(200)
  })

  it('Should set metadata', async function () {
    const { admin } = this.signers

    this.uris = [
      'https://justgems.infura-ipfs.io/ipfs/QmV21w5CJZMbur6CjCGtKFYZJFRKe23dpJ7aj7tdrA3wvF',
      'https://justgems.infura-ipfs.io/ipfs/QmNZY8E6LL3uMC1imdqfjViN5jFf5aREaZPHSqxFRbWcx2'
    ]

    await admin.withData.setData(
      1, this.uris[0],
      [ 'Length', 'Weight', 'Karot', 'Branch' ],
      [ '20in', '102g', '14K', 'Makati' ]
    )

    expect(await admin.withData.traitOf(1, 'Length')).to.equal('20in')
    expect(await admin.withData.traitOf(1, 'Weight')).to.equal('102g')
    expect(await admin.withData.traitOf(1, 'Karot')).to.equal('14K')

    expect(await admin.withData.hasTrait(1, 'Length', '20in')).to.equal(true)
    expect(await admin.withData.hasTrait(1, 'Weight', '102g')).to.equal(true)
    expect(await admin.withData.hasTrait(1, 'Karot', '14K')).to.equal(true)

    expect(await admin.withData.hasTrait(1, 'Weight', 'foo')).to.equal(false)
    expect(await admin.withData.hasTrait(1, 'Karot', 'bar')).to.equal(false)
    expect(await admin.withData.hasTrait(1, 'foo', 'bar')).to.equal(false)

    expect(await admin.withData.tokenURI(1)).to.equal(this.uris[0])
    expect(await admin.withNFT.tokenURI(1)).to.equal(this.uris[0])

    await admin.withData.setData(
      2, this.uris[1],
      [ 'Length', 'Weight', 'Karot', 'Branch' ],
      [ '20in', '30g', '18K', 'Makati' ]
    )

    expect(await admin.withData.traitOf(2, 'Length')).to.equal('20in')
    expect(await admin.withData.traitOf(2, 'Weight')).to.equal('30g')
    expect(await admin.withData.traitOf(2, 'Karot')).to.equal('18K')

    expect(await admin.withData.hasTrait(2, 'Length', '20in')).to.equal(true)
    expect(await admin.withData.hasTrait(2, 'Weight', '30g')).to.equal(true)
    expect(await admin.withData.hasTrait(2, 'Karot', '18K')).to.equal(true)

    expect(await admin.withData.hasTrait(2, 'Weight', 'foo')).to.equal(false)
    expect(await admin.withData.hasTrait(2, 'Karot', 'bar')).to.equal(false)
    expect(await admin.withData.hasTrait(2, 'foo', 'bar')).to.equal(false)

    expect(await admin.withData.tokenURI(2)).to.equal(this.uris[1])
    expect(await admin.withNFT.tokenURI(2)).to.equal(this.uris[1])
  })

  it('Should get tokens', async function () {
    const { admin } = this.signers

    const usdc = admin.withUSDC.address

    const search = admin.withIndex['search(address,uint256,uint256,string[],string[])']

    //search for Karot = token 1
    await (async _ => {
      const results = await admin.withIndex['search(uint256,uint256,string[],string[])'](
        1, 100, ['Karot'], ['14K']
      )
      expect(results.length).to.equal(1)
      expect(results[0].uri).to.equal(this.uris[0])
      expect(results[0].price).to.equal(100)
      expect(results[0].minted).to.equal(true)
    })()
    //search for Karot = token 2
    await (async _ => {
      const results = await search(
        usdc, 1, 100, ['Karot'], ['18K']
      )
      expect(results.length).to.equal(1)
      expect(results[0].uri).to.equal(this.uris[1])
      expect(results[0].price).to.equal(200)
      expect(results[0].minted).to.equal(true)
    })()
    //search for length = token 1, 2
    await (async _ => {
      const results = await search(
        usdc, 1, 2, ['Length'], ['20in']
      )
      expect(results.length).to.equal(2)
      expect(results[0].uri).to.equal(this.uris[0])
      expect(results[1].uri).to.equal(this.uris[1])
    })()
    //search for length = no results
    await (async _ => {
      const results = await search(
        usdc, 3, 100, ['Length'], ['20in']
      )
      expect(results.length).to.equal(0)
    })()
    //search for length, branch = token 1, 2
    await (async _ => {
      const results = await search(
        usdc, 1, 100, ['Length', 'Branch'], ['20in', 'Makati']
      )
      expect(results.length).to.equal(2)
      expect(results[0].uri).to.equal(this.uris[0])
      expect(results[1].uri).to.equal(this.uris[1])
    })()
    //search for karot, branch = token 1
    await (async _ => {
      const results = await search(
        usdc, 1, 100, ['Karot', 'Branch'], ['14K', 'Makati']
      )
      expect(results.length).to.equal(1)
      expect(results[0].uri).to.equal(this.uris[0])
    })()
    //search for karot, branch = token 2
    await (async _ => {
      const results = await search(
        usdc, 1, 100, ['Karot', 'Branch'], ['18K', 'Makati']
      )
      expect(results.length).to.equal(1)
      expect(results[0].uri).to.equal(this.uris[1])
    })()
    //search for karot, branch = no results
    await (async _ => {
      const results = await search(
        usdc, 1, 100, ['Karot', 'Branch'], ['24K', 'Makati']
      )
      expect(results.length).to.equal(0)
    })()
  })
})
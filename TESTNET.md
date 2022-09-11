# Roles and Permissions Setup

-----------------------------------
## Instructions for adding a Role Admin

In JustGems contract, grant DEFAULT_ADMIN_ROLE
 - https://mumbai.polygonscan.com/address/0xb416c77F0728EEe9089DdfCc6CCB4b9Cb2575294#writeContract
 - `grantRole( 0x0000000000000000000000000000000000000000000000000000000000000000, [ROLE ADMIN ADDRESS] )`
In JustGemsData contract, grant DEFAULT_ADMIN_ROLE
 - https://mumbai.polygonscan.com/address/0xfa08Ad07929b9F21DF3050135a0c6590885471e5#writeContract
 - `grantRole( 0x0000000000000000000000000000000000000000000000000000000000000000, [ROLE ADMIN ADDRESS] )`
In JustGemsIndex contract, grant DEFAULT_ADMIN_ROLE
 - https://mumbai.polygonscan.com/address/0x997AD53E22a1b1fC3E519dd6709D9701447B0E2A#writeContract
 - `grantRole( 0x0000000000000000000000000000000000000000000000000000000000000000, [ROLE ADMIN ADDRESS] )`
In JustGemsSale contract, grant DEFAULT_ADMIN_ROLE
 - https://mumbai.polygonscan.com/address/0x6dE9c79560b0E449E1b3D4C2445Bd416A869731E#writeContract
 - `grantRole( 0x0000000000000000000000000000000000000000000000000000000000000000, [ROLE ADMIN ADDRESS] )`
In JustGemsStore contract, grant DEFAULT_ADMIN_ROLE
 - https://mumbai.polygonscan.com/address/0xF3Ff0a21bB57B445f41B2242A9D1fCB66c491D2f#writeContract
 - `grantRole( 0x0000000000000000000000000000000000000000000000000000000000000000, [ROLE ADMIN ADDRESS] )`

-----------------------------------
## Instructions for adding a Contract Admin

In JustGems contract, grant CURATOR_ROLE
 - https://mumbai.polygonscan.com/address/0xb416c77F0728EEe9089DdfCc6CCB4b9Cb2575294#writeContract
 - `grantRole( 0x850d585eb7f024ccee5e68e55f2c26cc72e1e6ee456acf62135757a5eb9d4a10, [CONTRACT ADMIN ADDRESS] )`
In JustGemsIndex contract, grant CURATOR_ROLE
 - https://mumbai.polygonscan.com/address/0x997AD53E22a1b1fC3E519dd6709D9701447B0E2A#writeContract
 - `grantRole( 0x850d585eb7f024ccee5e68e55f2c26cc72e1e6ee456acf62135757a5eb9d4a10, [CONTRACT ADMIN ADDRESS] )`

-----------------------------------
## Instructions for adding a Store Manager

In JustGemsData contract, grant CURATOR_ROLE
 - https://mumbai.polygonscan.com/address/0xfa08Ad07929b9F21DF3050135a0c6590885471e5#writeContract
 - `grantRole( 0x850d585eb7f024ccee5e68e55f2c26cc72e1e6ee456acf62135757a5eb9d4a10, [MANAGER ADDRESS] )`
In JustGemsSale contract, grant CURATOR_ROLE
 - https://mumbai.polygonscan.com/address/0x6dE9c79560b0E449E1b3D4C2445Bd416A869731E#writeContract
 - `grantRole( 0x850d585eb7f024ccee5e68e55f2c26cc72e1e6ee456acf62135757a5eb9d4a10, [MANAGER ADDRESS] )`

-----------------------------------
## Instructions for adding a Store Consumer

In JustGemsStore contract, grant STORE_ROLE
 - https://mumbai.polygonscan.com/address/0xF3Ff0a21bB57B445f41B2242A9D1fCB66c491D2f#writeContract
 - `grantRole( 0x9cf888df9829983a4501c3e5076732bbf523e06c6b31f6ce065f61c2aec20567, [STORE ADDRESS] )`

-----------------------------------
## Instructions for adding a Funder

In JustGemsSale contract, grant FUNDER_ROLE
 - https://mumbai.polygonscan.com/address/0x6dE9c79560b0E449E1b3D4C2445Bd416A869731E#writeContract
 - `grantRole( 0x0914bb97ca83e85ef385857d9d418f187ff630589e0c9f44db92976d8e4519cb, [FUNDER ADDRESS] )`

-----------------------------------
## Instructions for adding a Tester

In MockUSDC contract, mint $50,000 USDC
 - https://mumbai.polygonscan.com/address/0x8F54a342Fb4327C8D85Ea86A9322713eA80E040c#writeContract
 - `mint([TESTER ADDRESS], 50000000000 )`
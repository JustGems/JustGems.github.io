# Roles and Permissions Setup

-----------------------------------
## Instructions for adding a Role Admin

In JustGems contract, grant DEFAULT_ADMIN_ROLE

 - https://polygonscan.com/address/0xdE2269159b74E49b3C14E16BE59F49C404Bb642F#writeContract
 - `grantRole( 0x0000000000000000000000000000000000000000000000000000000000000000, [ROLE ADMIN ADDRESS] )`

In JustGemsData contract, grant DEFAULT_ADMIN_ROLE

 - https://polygonscan.com/address/0xc7F0c5fE8E013C1E0d9137814EE9C8fE11A831Dc#writeContract
 - `grantRole( 0x0000000000000000000000000000000000000000000000000000000000000000, [ROLE ADMIN ADDRESS] )`

In JustGemsIndex contract, grant DEFAULT_ADMIN_ROLE

 - https://polygonscan.com/address/0xA39eaD14E85E706ac63B2DB1f7a46e0036530cA6#writeContract
 - `grantRole( 0x0000000000000000000000000000000000000000000000000000000000000000, [ROLE ADMIN ADDRESS] )`

In JustGemsSale contract, grant DEFAULT_ADMIN_ROLE

 - https://polygonscan.com/address/0x3578888c7bC7D10deFC550400dadB0E1B406A522#writeContract
 - `grantRole( 0x0000000000000000000000000000000000000000000000000000000000000000, [ROLE ADMIN ADDRESS] )`

In JustGemsStore contract, grant DEFAULT_ADMIN_ROLE

 - https://polygonscan.com/address/0x8d67b4CEA2756FCb9B7b64513762065B89281707#writeContract
 - `grantRole( 0x0000000000000000000000000000000000000000000000000000000000000000, [ROLE ADMIN ADDRESS] )`

-----------------------------------
## Instructions for adding a Contract Admin

In JustGems contract, grant CURATOR_ROLE

 - https://polygonscan.com/address/0xdE2269159b74E49b3C14E16BE59F49C404Bb642F#writeContract
 - `grantRole( 0x850d585eb7f024ccee5e68e55f2c26cc72e1e6ee456acf62135757a5eb9d4a10, [CONTRACT ADMIN ADDRESS] )`

In JustGemsIndex contract, grant CURATOR_ROLE

 - https://polygonscan.com/address/0xA39eaD14E85E706ac63B2DB1f7a46e0036530cA6#writeContract
 - `grantRole( 0x850d585eb7f024ccee5e68e55f2c26cc72e1e6ee456acf62135757a5eb9d4a10, [CONTRACT ADMIN ADDRESS] )`

-----------------------------------
## Instructions for adding a Store Manager

In JustGemsData contract, grant CURATOR_ROLE

 - https://polygonscan.com/address/0xc7F0c5fE8E013C1E0d9137814EE9C8fE11A831Dc#writeContract
 - `grantRole( 0x850d585eb7f024ccee5e68e55f2c26cc72e1e6ee456acf62135757a5eb9d4a10, [MANAGER ADDRESS] )`

In JustGemsSale contract, grant CURATOR_ROLE

 - https://polygonscan.com/address/0x3578888c7bC7D10deFC550400dadB0E1B406A522#writeContract
 - `grantRole( 0x850d585eb7f024ccee5e68e55f2c26cc72e1e6ee456acf62135757a5eb9d4a10, [MANAGER ADDRESS] )`

-----------------------------------
## Instructions for adding a Store Consumer

In JustGemsStore contract, grant STORE_ROLE

 - https://polygonscan.com/address/0x8d67b4CEA2756FCb9B7b64513762065B89281707#writeContract
 - `grantRole( 0x9cf888df9829983a4501c3e5076732bbf523e06c6b31f6ce065f61c2aec20567, [STORE ADDRESS] )`

-----------------------------------
## Instructions for adding a Funder

In JustGemsSale contract, grant FUNDER_ROLE

 - https://polygonscan.com/address/0x3578888c7bC7D10deFC550400dadB0E1B406A522#writeContract
 - `grantRole( 0x0914bb97ca83e85ef385857d9d418f187ff630589e0c9f44db92976d8e4519cb, [FUNDER ADDRESS] )`
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "./IERC721Burnable.sol";

contract JustGemsStore is AccessControl {
  // ============ Errors ============

  error InvalidCall();

  // ============ Constants ============

  IERC721Burnable immutable public COLLECTION;

  bytes32 private constant _STORE_ROLE = keccak256("STORE_ROLE");

  // ============ Storage ============

  //mapping of token id to owner burned
  mapping(uint256 => address) private _redeemed;

  // ============ Deploy ============

  constructor(IERC721Burnable collection, address admin) {
    _setupRole(DEFAULT_ADMIN_ROLE, admin);
    COLLECTION = collection;
  }

  // ============ Read Methods ============

  /**
   * @dev Returns who burned if any
   */
  function redeemed(uint256 tokenId) external view returns(address) {
    return _redeemed[tokenId];
  }

  // ============ Admin Methods ============

  /**
   * @dev Allows CONSUMER_ROLE to burn `tokenId`
   */
  function redeem(
    uint256 tokenId, 
    bytes memory proof
  ) external onlyRole(_STORE_ROLE) {
    address owner = COLLECTION.ownerOf(tokenId);
    //revert if the signer is not the owner of that token
    if (COLLECTION.ownerOf(tokenId) != ECDSA.recover(
      ECDSA.toEthSignedMessageHash(
        keccak256(abi.encodePacked(
          "redeem", 
          tokenId
        ))
      ),
      proof
    )) revert InvalidCall();
    //burn it. muhahahaha.
    COLLECTION.burn(tokenId);
    //remember who redeemed it
    _redeemed[tokenId] = owner;
  }
}
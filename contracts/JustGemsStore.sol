// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Context.sol";

import "./IERC721Burnable.sol";

contract JustGemsStore is Context, AccessControl {
  // ============ Constants ============

  IERC721Burnable immutable public COLLECTION;

  bytes32 private constant _CONSUMER_ROLE = keccak256("CONSUMER_ROLE");

  // ============ Storage ============

  //mapping of token id to owner burned
  mapping(uint256 => address) private _consumed;

  // ============ Deploy ============

  constructor(IERC721Burnable collection, address admin) {
    _setupRole(DEFAULT_ADMIN_ROLE, admin);
    COLLECTION = collection;
  }

  // ============ Read Methods ============

  /**
   * @dev Returns who burned if any
   */
  function consumed(uint256 tokenId) external view returns(address) {
    return _consumed[tokenId];
  }

  // ============ Admin Methods ============

  /**
   * @dev Allows CONSUMER_ROLE to burn `tokenId`
   */
  function consume(uint256 tokenId) external onlyRole(_CONSUMER_ROLE) {
    COLLECTION.burn(tokenId);
    _consumed[tokenId] = _msgSender();
  }

}
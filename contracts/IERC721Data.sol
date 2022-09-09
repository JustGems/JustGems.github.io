// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// ============ Interfaces ============

interface IERC721Data {
  /**
   * @dev Returns true if the `tokenId` has the given `trait` `value`
   */
  function hasTrait(
    uint256 tokenId,
    string memory trait,
    string memory value
  ) external view returns(bool);

  /**
   * @dev Returns the URI location of the given `tokenId`
   */
  function tokenURI(
    uint256 tokenId
  ) external view returns(string memory);

  /**
   * @dev Returns the `trait` value of the given `tokenId`
   */
  function traitOf(
    uint256 tokenId,
    string memory trait
  ) external view returns(string memory);
}
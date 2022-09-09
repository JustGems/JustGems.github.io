// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

// ============ Interfaces ============

interface IERC721Burnable is IERC721 {
  /**
   * @dev Burns `tokenId`
   */
  function burn(uint256 tokenId) external;
}
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

// ============ Interfaces ============

interface IERC721Mintable is IERC721 {
  /**
   * @dev Mints `tokenId` to `recipient`
   */
  function mint(uint256 tokenId, address recipient) external;
}
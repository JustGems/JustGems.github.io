// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// ============ Interfaces ============

interface IERC721Saleable {
  /**
   * @dev Returns who minted if any
   */
  function minted(uint256 tokenId) external view returns(address);

  /**
   * @dev returns the price of `tokenId`
   */
  function priceOf(uint256 tokenId) external view returns(uint256);

  /**
   * @dev returns the price of `tokenId`
   */
  function priceOf(IERC20 token, uint256 tokenId) external view returns(uint256);
}
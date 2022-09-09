// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./IERC721Mintable.sol";
import "./IERC721Saleable.sol";

// ============ Contracts ============

contract JustGemsSale is ReentrancyGuard, AccessControl, IERC721Saleable {
  // ============ Errors ============

  error InvalidCall();

  // ============ Constants ============

  IERC721Mintable immutable public COLLECTION;

  //roles
  bytes32 private constant _FUNDER_ROLE = keccak256("FUNDER_ROLE");
  bytes32 private constant _CURATOR_ROLE = keccak256("CURATOR_ROLE");

  // ============ Storage ============

  //mapping of token id to owner minted
  mapping(uint256 => address) private _minted;
  //mapping of token id to eth price
  mapping(uint256 => uint256) private _price;
  //mapping of token id to erc20 price
  mapping(uint256 => mapping(IERC20 => uint256)) private _erc20Price;
  //last token id set
  uint256 private _lastTokenId;

  // ============ Deploy ============

  constructor(IERC721Mintable collection, address admin) {
    _setupRole(DEFAULT_ADMIN_ROLE, admin);
    COLLECTION = collection;
  }

  // ============ Read Methods ============

  /**
   * @dev Returns the last token id set
   */
  function lastTokenId() external view returns(uint256) {
    return _lastTokenId;
  }

  /**
   * @dev Returns who minted if any
   */
  function minted(uint256 tokenId) external view returns(address) {
    return _minted[tokenId];
  }

  /**
   * @dev returns the price of `tokenId`
   */
  function priceOf(uint256 tokenId) external view returns(uint256) {
    return _price[tokenId];
  }

  /**
   * @dev returns the price of `tokenId`
   */
  function priceOf(
    IERC20 token, 
    uint256 tokenId
  ) external view returns(uint256) {
    return _erc20Price[tokenId][token];
  }

  // ============ Write Methods ============

  /**
   * @dev Mints `tokenId`
   */
  function mint(uint256 tokenId, address recipient) external payable {
    //revert if no price
    if (_price[tokenId] == 0 
      //or if what was sent is less than the price
      || msg.value < _price[tokenId]
    ) revert InvalidCall();
    //we are okay to mint
    COLLECTION.mint(tokenId, recipient);
    //remember who minted
    _minted[tokenId] = recipient;
  }

  /**
   * @dev Mints `tokenId`
   */
  function mint(
    IERC20 token, 
    uint256 tokenId, 
    address recipient
  ) external {
    //revert if no price
    if (_erc20Price[tokenId][token] == 0) revert InvalidCall();
    //should have allowance to send tokens here
    token.transferFrom(
      _msgSender(), 
      address(this), 
      _erc20Price[tokenId][token]
    );
    //we are okay to mint
    COLLECTION.mint(tokenId, recipient);
    //remember who minted
    _minted[tokenId] = recipient;
  }

  // ============ Admin Methods ============

  /**
   * @dev Sets the eth `price` for `tokenId`
   */
  function setPrice(
    uint256 tokenId,
    uint256 price
  ) public onlyRole(_CURATOR_ROLE) {
    _price[tokenId] = price;
    if (tokenId > _lastTokenId) {
      _lastTokenId = tokenId;
    }
  }

  /**
   * @dev Sets the `uri` for `tokenId`
   */
  function setPrice(
    IERC20 token,
    uint256 tokenId,
    uint256 price
  ) public onlyRole(_CURATOR_ROLE) {
    _erc20Price[tokenId][token] = price;
    if (tokenId > _lastTokenId) {
      _lastTokenId = tokenId;
    }
  }

  /**
   * @dev Sends the entire contract balance to a `recipient`. 
   */
  function withdraw(
    address recipient
  ) external nonReentrant onlyRole(_FUNDER_ROLE) {
    Address.sendValue(payable(recipient), address(this).balance);
  }

  /**
   * @dev Sends the `amount` token out to a `recipient`.
   */
  function withdraw(
    IERC20 erc20, 
    address recipient, 
    uint256 amount
  ) external nonReentrant onlyRole(_FUNDER_ROLE) {
    SafeERC20.safeTransfer(erc20, recipient, amount);
  }
}
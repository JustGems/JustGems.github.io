// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./IERC721Data.sol";

contract JustGems is Ownable, AccessControl, ERC721 {
  // ============ Constants ============

  //roles
  bytes32 private constant _MINTER_ROLE = keccak256("MINTER_ROLE");
  bytes32 private constant _BURNER_ROLE = keccak256("BURNER_ROLE");
  bytes32 private constant _CURATOR_ROLE = keccak256("CURATOR_ROLE");

  // ============ Storage ============

  //the contract housing the metadata
  IERC721Data private _metadata;

  //total amount minted 
  uint256 private _totalMinted;
  //total amount burned
  uint256 private _totalBurned;
  //last token id minted
  uint256 private _lastTokenId;

  // ============ Deploy ============

  constructor(address admin) ERC721("Just Gems", "GEMS") {
    _setupRole(DEFAULT_ADMIN_ROLE, admin);
  }

  // ============ Read Methods ============

  /**
   * @dev Returns the last token id minted
   */
  function lastTokenId() external view returns(uint256) {
    return _lastTokenId;
  }

  /**
   * @dev See {IERC165-supportsInterface}.
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view override(AccessControl, ERC721) returns(bool) {
    return super.supportsInterface(interfaceId);
  }

  /**
   * @dev Returns the token uri
   */
  function tokenURI(
    uint256 tokenId
  ) public view override returns(string memory) {
    return _metadata.tokenURI(tokenId);
  }

  /**
   * @dev Returns the total amount of tokens burned
   */
  function totalBurned() external view returns(uint256) {
    return _totalBurned;
  }

  /**
   * @dev Returns the total amount of tokens minted
   */
  function totalMinted() external view returns(uint256) {
    return _totalMinted;
  }

  /**
   * @dev Returns the total supply
   */
  function totalSupply() external view returns(uint256) {
    return _totalMinted - _totalBurned;
  }

  // ============ Admin Methods ============

  /**
   * @dev Allows BURNER_ROLE to burn `tokenId`
   */
  function burn(uint256 tokenId) external onlyRole(_BURNER_ROLE) {
    _burn(tokenId);
  }

  /**
   * @dev Allows MINTER_ROLE to mint `tokenId`
   */
  function mint(
    uint256 tokenId, 
    address recipient
  ) external onlyRole(_MINTER_ROLE) {
    _safeMint(recipient, tokenId, "");
    if (tokenId > _lastTokenId) {
      _lastTokenId = tokenId;
    }
  }

  /**
   * @dev Allows CURATOR_ROLE to set the `metadata` contract
   */
  function setMetadata(
    IERC721Data metadata
  ) public onlyRole(_CURATOR_ROLE) {
    _metadata = metadata;
  }

  // ============ Internal Methods ============

  /**
   * @dev Hook that is called before any token transfer. 
   * This includes minting and burning.
   */
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256
  ) internal override {
    if (from == address(0)) {
      _totalMinted++;
    } else if (to == address(0)) {
      _totalBurned++;
    } 
  }
}
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IERC721Data.sol";

// ============ Contracts ============

contract JustGemsData is AccessControl, IERC721Data {
  // ============ Errors ============

  error InvalidCall();

  // ============ Constants ============

  //roles
  bytes32 private constant _CURATOR_ROLE = keccak256("CURATOR_ROLE");

  // ============ Storage ============

  //mapping of token id to uri
  mapping(uint256 => string) private _uri;
  //mapping of token id to trait name to trait value
  mapping(uint256 => mapping(string => string)) private _traits;
  //last token id set
  uint256 private _lastTokenId;

  // ============ Deploy ============

  constructor(address admin) {
    _setupRole(DEFAULT_ADMIN_ROLE, admin);
  }

  // ============ Read Methods ============

  /**
   * @dev Returns true if the `tokenId` has the given `trait` `value`
   */
  function hasTrait(
    uint256 tokenId,
    string memory trait,
    string memory value
  ) external view returns(bool) {
    return keccak256(abi.encodePacked(_traits[tokenId][trait])) 
      == keccak256(abi.encodePacked(value));
  }

  /**
   * @dev Returns the last token id set
   */
  function lastTokenId() external view returns(uint256) {
    return _lastTokenId;
  }

  /**
   * @dev Returns the URI location of the given `tokenId`
   */
  function tokenURI(
    uint256 tokenId
  ) external view returns(string memory) {
    if (bytes(_uri[tokenId]).length == 0) revert InvalidCall();
    return _uri[tokenId];
  }

  /**
   * @dev Returns the `trait` value of the given `tokenId`
   */
  function traitOf(
    uint256 tokenId,
    string memory trait
  ) external view returns(string memory) {
    return _traits[tokenId][trait];
  }

  // ============ Admin Methods ============

  /**
   * @dev Sets the traits and `uri` for `tokenId`
   */
  function setData(
    uint256 tokenId,
    string memory uri,
    string[] memory traits,
    string[] memory values
  ) external onlyRole(_CURATOR_ROLE) {
    setURI(tokenId, uri);
    setTraits(tokenId, traits, values);
  }

  /**
   * @dev Sets the traits for `tokenId`
   */
  function setTraits(
    uint256 tokenId,
    string[] memory traits,
    string[] memory values
  ) public onlyRole(_CURATOR_ROLE) {
    if (traits.length != values.length) revert InvalidCall();
    for (uint256 i; i < traits.length; i++) {
      _traits[tokenId][traits[i]] = values[i];
    }
  }

  /**
   * @dev Sets the `uri` for `tokenId`
   */
  function setURI(
    uint256 tokenId,
    string memory uri
  ) public onlyRole(_CURATOR_ROLE) {
    _uri[tokenId] = uri;
    if (tokenId > _lastTokenId) {
      _lastTokenId = tokenId;
    }
  }
}
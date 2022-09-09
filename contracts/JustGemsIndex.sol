// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

import "./IERC721Data.sol";
import "./IERC721Saleable.sol";

// ============ Contracts ============

contract JustGemsIndex is AccessControl{
  // ============ Errors ============

  error InvalidCall();

  // ============ Structs ============

  struct Token {
    string uri;
    uint256 price;
    bool minted;
  }

  // ============ Constants ============

  //roles
  bytes32 private constant _CURATOR_ROLE = keccak256("CURATOR_ROLE");

  // ============ Storage ============

  IERC721Data private _metadata;
  IERC721Saleable private _saleable;

  // ============ Deploy ============

  constructor(address admin) {
    _setupRole(DEFAULT_ADMIN_ROLE, admin);
  }

  // ============ Read Methods ============

  /**
   * @dev Return tokens given criteria
   */
  function search(
    uint256 fromTokenId,
    uint256 toTokenId,
    string memory trait,
    string memory value
  ) external view returns(Token[] memory) {
    return search(
      fromTokenId, 
      toTokenId, 
      _toArray(trait), 
      _toArray(value)
    );
  }

  /**
   * @dev Return tokens given criteria
   */
  function search(
    uint256 fromTokenId,
    uint256 toTokenId,
    string[] memory traits,
    string[] memory values
  ) public view returns(Token[] memory) {
    uint256[] memory tokenIds = _searchResults(
      fromTokenId,
      toTokenId,
      traits,
      values
    );

    //now make an array
    Token[] memory results = new Token[](tokenIds.length);
    for (uint256 i; i < tokenIds.length; i++) {
      results[i] = Token(
        _metadata.tokenURI(tokenIds[i]),
        _saleable.priceOf(tokenIds[i]),
        _saleable.minted(tokenIds[i]) != address(0)
      );
    }

    return results;
  }

  /**
   * @dev Return tokens given criteria
   */
  function search(
    IERC20 token, 
    uint256 fromTokenId,
    uint256 toTokenId,
    string memory trait,
    string memory value
  ) external view returns(Token[] memory) {
    return search(
      token, 
      fromTokenId, 
      toTokenId, 
      _toArray(trait), 
      _toArray(value)
    );
  }

  /**
   * @dev Return tokens given criteria
   */
  function search(
    IERC20 token, 
    uint256 fromTokenId,
    uint256 toTokenId,
    string[] memory traits,
    string[] memory values
  ) public view returns(Token[] memory) {
    uint256[] memory tokenIds = _searchResults(
      fromTokenId,
      toTokenId,
      traits,
      values
    );

    //now make an array
    Token[] memory results = new Token[](tokenIds.length);
    for (uint256 i; i < tokenIds.length; i++) {
      results[i] = Token(
        _metadata.tokenURI(tokenIds[i]),
        _saleable.priceOf(token, tokenIds[i]),
        _saleable.minted(tokenIds[i]) != address(0)
      );
    }

    return results;
  }

  // ============ Admin Methods ============

  /**
   * @dev Sets the metadata
   */
  function setMetadata(
    IERC721Data metadata
  ) external onlyRole(_CURATOR_ROLE) {
    _metadata = metadata;
  }

  /**
   * @dev Sets the metadata
   */
  function setSaleable(
    IERC721Saleable saleable
  ) external onlyRole(_CURATOR_ROLE) {
    _saleable = saleable;
  }

  // ============ Internal Methods ============

  /**
   * @dev Returns a set of token ids that match the given criteria
   */
  function _searchResults(
    uint256 fromTokenId,
    uint256 toTokenId,
    string[] memory traits,
    string[] memory values
  ) internal view returns(uint256[] memory) {
    //now make an array
    uint256[] memory results = new uint256[](_searchSize(
      fromTokenId, 
      toTokenId,
      traits,
      values
    ));
    //loop through tokens
    uint256 index;
    for (uint256 tokenId = fromTokenId; tokenId <= toTokenId; tokenId++) {
      uint256 matches;
      for (uint256 i; i < traits.length; i++) {
        if (_metadata.hasTrait(tokenId, traits[i], values[i])) {
          matches++;
        }
      }

      if (matches == traits.length) {
        results[index++] = tokenId;
      }
    }

    return results;
  }

  /**
   * @dev Returns the size of the search
   */
  function _searchSize(
    uint256 fromTokenId,
    uint256 toTokenId,
    string[] memory traits,
    string[] memory values
  ) internal view returns(uint256 size) {
    if (traits.length != values.length) revert InvalidCall();
    //loop through tokens
    for (uint256 tokenId = fromTokenId; tokenId <= toTokenId; tokenId++) {
      uint256 matches;
      for (uint256 i; i < traits.length; i++) {
        if (_metadata.hasTrait(tokenId, traits[i], values[i])) {
          matches++;
        }
      }

      if (matches == traits.length) {
        size++;
      }
    }
  }

  /**
   * @dev Converts a string to an array
   */
  function _toArray(string memory element) private pure returns (string[] memory) {
    string[] memory array = new string[](1);
    array[0] = element;
    return array;
  }
}
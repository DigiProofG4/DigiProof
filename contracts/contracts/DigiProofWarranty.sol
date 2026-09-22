// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// One token per warranty. The retailer's backend owns a custodial wallet
/// and mints/transfers on the customer's behalf; see contracts/README.md.
contract DigiProofWarranty is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    mapping(address => bool) public authorizedMinters;

    event MinterUpdated(address indexed minter, bool allowed);

    constructor() ERC721("DigiProof Warranty", "DPW") Ownable(msg.sender) {
        authorizedMinters[msg.sender] = true;
    }

    modifier onlyMinter() {
        require(authorizedMinters[msg.sender], "Not an authorized minter");
        _;
    }

    function mintWarranty(address to, string calldata uri) external onlyMinter returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function setMinter(address minter, bool allowed) external onlyOwner {
        authorizedMinters[minter] = allowed;
        emit MinterUpdated(minter, allowed);
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }
}

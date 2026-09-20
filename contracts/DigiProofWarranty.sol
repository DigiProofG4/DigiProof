// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Skeleton only — not compiled or deployed. Fill in once the blockchain
// phase of the project starts; see README.md in this folder for the plan.
//
// Intended base: OpenZeppelin's ERC721URIStorage + Ownable.
//   npm install @openzeppelin/contracts
//
// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";

interface IDigiProofWarranty {
    /// Mint a new warranty token to a retailer's custodial address, or a
    /// customer's own wallet if they connect one. `tokenURI` points at the
    /// warranty metadata pinned to IPFS.
    function mintWarranty(address to, string calldata tokenURI) external returns (uint256 tokenId);

    /// Standard ERC-721 transfer, used when the current owner hands the
    /// warranty on to a new owner.
    function safeTransferFrom(address from, address to, uint256 tokenId) external;

    /// Standard ERC-721 read, used by the /warranties/verify endpoint to
    /// confirm a token's metadata independently of the database.
    function tokenURI(uint256 tokenId) external view returns (string memory);

    function ownerOf(uint256 tokenId) external view returns (address);
}

/*
contract DigiProofWarranty is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Only retailer custodial addresses (or the backend's own relayer
    // address) should be allowed to mint - add an allowlist mapping here.
    mapping(address => bool) public authorizedMinters;

    constructor() ERC721("DigiProof Warranty", "DPW") Ownable(msg.sender) {}

    function mintWarranty(address to, string calldata uri) external returns (uint256) {
        require(authorizedMinters[msg.sender], "Not an authorized minter");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }

    function setMinter(address minter, bool allowed) external onlyOwner {
        authorizedMinters[minter] = allowed;
    }
}
*/

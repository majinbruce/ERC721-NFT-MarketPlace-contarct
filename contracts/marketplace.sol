// SPDX-License-Identifier: UNLISENCED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "hardhat/console.sol";

contract Marketplace is ReentrancyGuard {
    address payable public immutable feeAccount; // the account that receives fees
    uint256 public immutable platformFeePercent; // the fee percentage on sales
    uint256 public itemCount; // the amount of items listed

    using SafeERC20 for IERC20;
    IERC20 private token;
    IERC721 private nft;

    struct Item {
        uint256 itemId;
        uint256 price;
        uint256 tokenId;
        uint256 royalty;
        address payable seller;
        bool listed;
    }

    // itemId -> Item => tracts the items
    mapping(uint256 => Item) public items;

    constructor(IERC20 _tokenAddress, IERC721 _nftAddress) {
        feeAccount = payable(msg.sender);
        platformFeePercent = 25;
        token = _tokenAddress;
        nft = _nftAddress;
    }

    event NFTListed(
        uint256 itemId,
        uint256 tokenId,
        uint256 price,
        address indexed seller
    );
    event NFTSold(
        uint256 tokenId,
        uint256 price,
        address indexed seller,
        address indexed buyer
    );

    // Make item to offer on the marketplace
    function listNFT(
        uint256 _tokenId,
        uint256 _price,
        uint256 _royalty
    ) external nonReentrant {
        // increment itemCount

        itemCount++;
        validateListing(_tokenId, _price, _royalty);

        // transfer nft to the marketplace contract untill sold
        nft.transferFrom(msg.sender, address(this), _tokenId);
        // add new item to items mapping
        items[itemCount] = Item(
            itemCount,
            _price,
            _tokenId,
            _royalty,
            payable(msg.sender),
            true
        );

        // emit event
        emit NFTListed(itemCount, _tokenId, _price, msg.sender);
    }

    function buyNFT(uint256 _tokenId) external payable nonReentrant {
        Item storage item = items[_tokenId];
        uint256 royalty = getRoyalty(_tokenId);
        uint256 fee = getFee(_tokenId);
        validateSale(_tokenId);

        // pay seller and feeAccount
        token.transferFrom(msg.sender, item.seller, item.price + royalty);
        token.transferFrom(msg.sender, feeAccount, fee);

        // update item to not listed for sale
        item.listed = false;
        // transfer nft to buyer
        nft.transferFrom(address(this), msg.sender, item.tokenId);
        // emit Bought event
        emit NFTSold(item.tokenId, item.price, item.seller, msg.sender);
    }

    function getFee(uint256 _itemId) public view returns (uint256) {
        return ((items[_itemId].price * platformFeePercent) / 1000);
    }

    function getRoyalty(uint256 _itemId) public view returns (uint256) {
        return ((items[_itemId].price * items[_itemId].royalty) / 100);
    }

    function validateSale(uint256 _tokenId) private view {
        require(items[_tokenId].listed, "the nft is not listed for sale");
        require(
            items[_tokenId].seller != msg.sender,
            "yeh wala nai chalra bhai"
        );
        require(
            token.allowance(msg.sender, address(this)) >= items[_tokenId].price,
            "Unsufficient token allowance."
        );
    }

    function validateListing(
        uint256 _tokenId,
        uint256 _price,
        uint256 _royalty
    ) private view {
        require(_price > 0, "Price must be greater than zero");

        require(!items[_tokenId].listed, " NFT is not listed for sale.");

        require(
            _royalty >= 0 && _royalty <= 20,
            " Royalty should be between 0 and 20%."
        );
        require(
            nft.ownerOf(_tokenId) == msg.sender,
            "You are not authorized to list this NFT."
        );
    }
}

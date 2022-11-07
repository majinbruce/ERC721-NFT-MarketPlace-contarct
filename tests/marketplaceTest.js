const { expect } = require("chai");

const { ethers } = require("hardhat");

describe("NFTmarketPlace", function () {
  let owner;
  let addr1;
  let addr2;
  let adrs;
  let nft;
  let marketplace;
  let token;
  let TOKEN;
  let NFT;
  let MARKETPLACE;
  let totalSupply = ethers.utils.parseUnits("1", 17);
  let URI = "dummy URI";

  beforeEach(async function () {
    TOKEN = await ethers.getContractFactory("MyToken");
    NFT = await ethers.getContractFactory("MyNFT");
    MARKETPLACE = await ethers.getContractFactory("Marketplace");

    [owner, addr1, addr2, ...adrs] = await ethers.getSigners();

    nft = await NFT.deploy("MyNFT", "MNFT");
    token = await TOKEN.deploy(totalSupply);

    marketplace = await MARKETPLACE.deploy(token.address, nft.address);

    await token.transfer(addr1.address, ethers.utils.parseUnits("1000000", 10));
    await token.transfer(addr2.address, ethers.utils.parseUnits("1000000", 10));

    // Give marketplace contract erc20 token allowance and
    // ERC721 NFT token approvals from all accounts.

    await token.approve(
      marketplace.address,
      ethers.utils.parseUnits("1000000", 10)
    );
    await nft.setApprovalForAll(marketplace.address, true);

    await token
      .connect(addr1)
      .approve(marketplace.address, ethers.utils.parseUnits("1000000", 10));
    await nft.connect(addr1).setApprovalForAll(marketplace.address, true);

    await token
      .connect(addr2)
      .approve(marketplace.address, ethers.utils.parseUnits("1000000", 10));
    await nft.connect(addr2).setApprovalForAll(marketplace.address, true);
  });

  describe("deployment", function () {
    it("should set correct name and symbol of nft", async function () {
      const NFTName = "MyNFT";
      const NFTsymbol = "MNFT";
      expect(await nft.name()).to.equal(NFTName);
      expect(await nft.symbol()).to.equal(NFTsymbol);
    });

    it("Should track feeAccount and feePercent of the marketplace", async function () {
      expect(await marketplace.feeAccount()).to.equal(owner.address);
      expect(await marketplace.platformFeePercent()).to.equal(25);
    });
  });

  describe("Minting NFTs", function () {
    it("Should track each minted NFT", async function () {
      // addr1 mints an nft
      await nft.connect(addr1).mintNFT(URI);

      expect(await nft.balanceOf(addr1.address)).to.equal(1);
      expect(await nft.tokenURI(1)).to.equal(URI);
      // addr2 mints an nft
      await nft.connect(addr2).mintNFT(URI);

      expect(await nft.balanceOf(addr2.address)).to.equal(1);
      expect(await nft.tokenURI(2)).to.equal(URI);
    });
  });
  it("Other users can buy the listed NFTs", async () => {
    const ownerbalance = await token.balanceOf(owner.address);

    console.log(ownerbalance, "owner balance");
    //Mint the NFT
    await nft.connect(addr1).mintNFT(URI);

    // List the NFT token.
    await marketplace
      .connect(addr1)
      .listNFT(1, ethers.utils.parseUnits("100", 10), 20);
    expect(await nft.ownerOf(1)).to.equal(marketplace.address);

    // Now, buy the listed NFT with another account.
    await marketplace.connect(addr2).buyNFT(1);

    // Check if ownership of NFT transferred correctly.
    expect(await nft.ownerOf(1)).to.equal(addr2.address);
  });
});

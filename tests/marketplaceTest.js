const { expect } = require("chai");

const { BigNumber } = require("ethers");
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

  beforeEach(async function () {
    TOKEN = await ethers.getContractFactory("MyToken");
    NFT = await ethers.getContractFactory("MyNFT");
    MARKETPLACE = await ethers.getContractFactory("Marketplace");

    [owner, addr1, addr2, ...adrs] = await ethers.getSigners();

    nft = await NFT.deploy("MyNFT", "MNFT");
    marketplace = await MARKETPLACE.deploy(1);
    token = await TOKEN.deploy(totalSupply);
  });

  describe("deployment", function () {
    it("should set correct name and symbol of nft", async function () {
      expect(await nft.name()).to.equal("MyNFT");
      expect(await nft.symbol()).to.equal("MNFT");
    });
  });
});

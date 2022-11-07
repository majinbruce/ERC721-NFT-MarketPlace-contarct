const { ethers } = require("hardhat");

async function main() {
  const totalSupply = ethers.utils.parseUnits("1", 17);
  const TOKEN = await ethers.getContractFactory("MyToken");
  const token = await TOKEN.deploy(totalSupply);
  await token.deployed();

  console.log("\n token deployed at", token.address);

  const NFT = await ethers.getContractFactory("MyNFT");
  const nft = await NFT.deploy("MyNFT", "MNFT");
  await nft.deployed();

  console.log("\n nft deployed at", nft.address);

  const MARKETPLACE = await ethers.getContractFactory("Marketplace");
  const marketplace = await MARKETPLACE.deploy(token.address, nft.address);
  await marketplace.deployed();

  console.log("\n marketplace deployed at", marketplace.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

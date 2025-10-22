import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "localhost"
});

const InvoiceContract = await ethers.deployContract('InvoiceManager');
await InvoiceContract.waitForDeployment();

console.log(`InvoiceManager deployed at: ${InvoiceContract.target}`);
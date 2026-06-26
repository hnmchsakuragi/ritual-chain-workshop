import { network } from "hardhat";

const { viem } = await network.create();

async function main() {
  const [deployer] = await viem.getWalletClients();
  console.log(`Deploying from: ${deployer.account.address}`);

  const contract = await viem.deployContract("AIJudge");
  console.log(`\n✅ AIJudge deployed at: ${contract.address}`);

  const receipt = await viem.getPublicClient().getTransactionReceipt({
    hash: contract.deploymentTx,
  });
  console.log(`Tx hash: ${receipt.transactionHash}`);
  console.log(`Block: ${receipt.blockNumber}`);
  console.log(`Gas used: ${receipt.gasUsed}`);
}

main().catch(console.error);

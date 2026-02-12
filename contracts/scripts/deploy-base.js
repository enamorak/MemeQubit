const hre = require("hardhat");

// Default QUBO weights for Pump.fun scoring: [poolTime, devAge, buyDensity, holderGrowth, sentiment]
const DEFAULT_SNIPER_WEIGHTS = [20, 25, 20, 20, 15];

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const trustedBackend = process.env.TRUSTED_BACKEND_ADDRESS || deployer.address;

  const weightsEnv = process.env.SNIPER_INITIAL_WEIGHTS;
  const initialWeights = weightsEnv
    ? weightsEnv.split(",").map((s) => s.trim())
    : DEFAULT_SNIPER_WEIGHTS;

  if (initialWeights.length !== 5) {
    throw new Error("SNIPER_INITIAL_WEIGHTS must have exactly 5 comma-separated values");
  }

  console.log("Deploying MemeQubit contracts to", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("Trusted backend:", trustedBackend);
  console.log("Sniper weights:", initialWeights.map(Number));

  const Vault = await hre.ethers.getContractFactory("MemeQubit_Vault");
  const vault = await Vault.deploy(trustedBackend);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("MemeQubit_Vault deployed to:", vaultAddress);

  const BatchExit = await hre.ethers.getContractFactory("MemeQubit_BatchExit");
  const batchExit = await BatchExit.deploy(trustedBackend);
  await batchExit.waitForDeployment();
  const batchExitAddress = await batchExit.getAddress();
  console.log("MemeQubit_BatchExit deployed to:", batchExitAddress);

  const Sniper = await hre.ethers.getContractFactory("MemeQubit_Sniper");
  const sniper = await Sniper.deploy(trustedBackend, initialWeights);
  await sniper.waitForDeployment();
  const sniperAddress = await sniper.getAddress();
  console.log("MemeQubit_Sniper deployed to:", sniperAddress);

  console.log("\n--- Summary (Base) ---");
  console.log("MemeQubit_Vault:    ", vaultAddress);
  console.log("MemeQubit_BatchExit:", batchExitAddress);
  console.log("MemeQubit_Sniper:   ", sniperAddress);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

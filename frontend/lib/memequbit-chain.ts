/**
 * MemeQubit chain params for MetaMask / wallet connection.
 * Use with wallet_addEthereumChain. Default: Base testnet; override via env.
 */
const MEMEQUBIT_RPC = process.env.NEXT_PUBLIC_MEMEQUBIT_RPC || "https://atlantic.ocean.pharos.network";
const MEMEQUBIT_CHAIN_ID = process.env.NEXT_PUBLIC_MEMEQUBIT_CHAIN_ID || "0x1f95"; // 8085 in hex; use Base testnet ID when deploying

export const memequbitChain = {
  chainId: MEMEQUBIT_CHAIN_ID,
  chainName: "MemeQubit Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: [MEMEQUBIT_RPC],
  blockExplorerUrls: ["https://sepolia.basescan.org"].filter(Boolean),
};

export async function addMemeQubitToWallet(): Promise<void> {
  if (typeof window === "undefined" || !(window as unknown as { ethereum?: { request: (p: unknown) => Promise<unknown> } }).ethereum) {
    throw new Error("No wallet found. Install MetaMask or another Web3 wallet.");
  }
  const eth = (window as unknown as { ethereum: { request: (p: unknown) => Promise<unknown> } }).ethereum;
  await eth.request({
    method: "wallet_addEthereumChain",
    params: [{ ...memequbitChain }],
  });
}

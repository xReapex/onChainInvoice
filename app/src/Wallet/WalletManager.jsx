export const connectWallet = async (targetChainId = '0x7A69') => {

  if (!window.ethereum) {
    throw new Error('No provider found.');
  }

  try {
    // Ask user to connect wallet
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    // Check current network
    let currentChainId = await window.ethereum.request({
      method: 'eth_chainId',
    });

    // If wrong network, try to switch
    if (currentChainId !== targetChainId) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainId }],
        });
      } catch (switchError) {
        // Add network if not available
        if (switchError.code === 4902) {
          await addNetwork(targetChainId);
        } else {
          throw switchError;
        }
      }
    }

    currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

    return {
      account: accounts[0],
      chainId: currentChainId,
    };
  } catch (err) {
    if (err.code === 4001) {
      throw new Error('Connection rejected by user.');
    }
    throw new Error('Error when connecting' + err.message);
  }
};

// Add network to wallet
async function addNetwork(chainId) {
  if (chainId === '0x7A69') {
    // Hardhat local
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: '0x7A69',
          chainName: 'Hardhat Localhost 31337',
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: ['http://127.0.0.1:8545/'],
          blockExplorerUrls: null,
        },
      ],
    });
  } else if (chainId === '0xaa36a7') {
    // Sepolia
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: '0xaa36a7',
          chainName: 'Sepolia Testnet',
          nativeCurrency: {
            name: 'SepoliaETH',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_ID'],
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
        },
      ],
    });
  }
}

export function getAddress() {
  if (!window.ethereum) {
    throw new Error('No provider found.');
  }
    return window.ethereum.selectedAddress;
}
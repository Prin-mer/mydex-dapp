import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultWallets,
  RainbowKitProvider
} from '@rainbow-me/rainbowkit';
import {
  WagmiConfig,
  createClient,
  configureChains,
  chain
} from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';

const { chains, provider } = configureChains(
  [chain.bsc],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: 'MyDEX',
  chains
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider
});

export function Web3Provider({ children }) {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
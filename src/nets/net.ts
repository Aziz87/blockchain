import TronNile from '../nets/tron-nileex.net';
import Tron from '../nets/tron.net';
import Arbitrum from "./arbitrum.net";
import Avalanche from "./avalanche.net";
import BinanceSmartChainTestnet from "./binance-smart-chain-test.net";
import BinanceSmartChain from "./binance-smart-chain.net";
import Ethereum from "./ethereum.net";
import Gnosis from "./gnosis.net";
import Goerli from "./goerli.net";
import { NET } from "./net.i";
import Optimism from "./optimism.net";
import Poligon from "./poligon.net";

export const nets: NET[] = [
    Tron, TronNile, Ethereum, BinanceSmartChain, Poligon, Optimism, Arbitrum, Gnosis, Avalanche, Goerli, BinanceSmartChainTestnet,
]

export const net = {
    Tron, TronNile, Ethereum, BinanceSmartChain, Poligon, Optimism, Arbitrum, Gnosis, Avalanche, Goerli, BinanceSmartChainTestnet,
}

export default nets;

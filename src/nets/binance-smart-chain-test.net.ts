import pancakeRouterV2 from "../abi/pancake-router-v2";
import { Symbol, NET, NetworkName, SwapRouterVersion } from "./net.i";
import pancakeRouterV3 from "../abi/pancake-router-v3";

const BinanceSmartChainTestnet: NET = {
    id: 97,
    name: NetworkName.BinanceSmartChainTestnet,
    symbol: Symbol.BNB,
    decimals:18,
    explorer: {
        tx: 'https://testnet.bscscan.com/tx/',
        address: 'https://testnet.bscscan.com/address/',
        block: 'https://testnet.bscscan.com/block/'
    },
    rpc: { name: 'BinanceRPC', url: 'https://data-seed-prebsc-2-s3.binance.org:8545' },
    multicall: "0x3bab6ed264a077ef54bf9654e43f2f5b6b6a46d7",
    tornadoContracts: [
        {
            instances: [
                { amount: 0.1, address: '' },
                { amount: 1, address: '' },
                { amount: 10, address: '' },
                { amount: 100, address: '' }
            ], symbol: Symbol.BNB, decimals: 18
        }
    ],
    miningBlockSeconds: 3,
    swapRouters:[
        {version:SwapRouterVersion.UNISWAP_V2, address:"0x9ac64cc6e4415144c455bd8e4837fea55603e5c3", abi:pancakeRouterV2},
        {version:SwapRouterVersion.UNISWAP_V3, address:"0x9a489505a00ce272eaa5e07dba6491314cae3796", abi:pancakeRouterV3, quoters:[
            {v:2,address:"0x13f4ea83d0bd40e75c8222255bc855a974568dd4",methodName:"pancakeV3SwapCallback",supportedFees:[ 10000n, 2500n,500n, 100n]}
        ]},
    ],
    wrapedNativToken: { symbol: Symbol.WBNB, decimals: 18, address: "0xae13d989dac2f0debff460ac112a837c89baa7cd" },
    tokens: [{ symbol: Symbol.USDT, decimals: 18, address: "0x337610d27c682e347c9cd60bd4b3b107c9d34ddd" }],
    requestsPerSecond:5

}

export default BinanceSmartChainTestnet;
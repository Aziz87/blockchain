import pancakeRouterV2 from "../abi/pancake-router-v2";
import { Symbol, NET, NetworkName, SwapRouterVersion } from "./net.i";
import pancakeRouterV3 from "../abi/pancake-router-v3";

const Optimism: NET = {
    id: 10,
    name: NetworkName.Optimism,
    symbol: Symbol.ETH,
    decimals:18,
    explorer: {
        tx: 'https://optimistic.etherscan.io/tx/',
        address: 'https://optimistic.etherscan.io/address/',
        block: 'https://optimistic.etherscan.io/block/'
    },
    rpc:{ name: 'Optimism', url: 'https://mainnet.optimism.io/' },
    multicall: "0x35a6cdb2c9ad4a45112df4a04147eb07dfa01ab7",
    tornadoContracts: [{
        instances: [
            { amount: 0.1, address: '0x84443CFd09A48AF6eF360C6976C5392aC5023a1F' },
            { amount: 1, address: '0xd47438C816c9E7f2E2888E060936a499Af9582b3' },
            { amount: 10, address: '0x330bdFADE01eE9bF63C209Ee33102DD334618e0a' },
            { amount: 100, address: '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD' }
        ],
        symbol: Symbol.ETH,
        decimals: 18
    }],
    miningBlockSeconds: 2,
    wrapedNativToken: null,
    tokens: [
        { address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58', decimals: 6, symbol: Symbol.USDT },
        { address: '0x7f5c764cbc14f9669b88837ca1490cca17c31607', decimals: 6, symbol: Symbol.USDC },
        { address: '0x9c9e5fd8bbc25984b178fdce6117defa39d2db39', decimals: 6, symbol: Symbol.BUSD },
        { address: '0x68f180fcce6836688e9084f035309e29bf0a2095', decimals: 6, symbol: Symbol.WBTC },
        { address: '0x4200000000000000000000000000000000000006', decimals: 6, symbol: Symbol.WETH },
    ],
    requestsPerSecond:5,
    swapRouters:[
        {version:SwapRouterVersion.UNISWAP_V2,  address: "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45", abi:pancakeRouterV2},
        {version:SwapRouterVersion.UNISWAP_V3,  address: "0xe592427a0aece92de3edee1f18e0157c05861564", abi:pancakeRouterV3},
    ]
}

export default Optimism;
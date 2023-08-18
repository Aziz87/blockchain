import metamaskSwapRouter from "src/abi/metamask-swap-router";
import { Symbol, NET, NetworkName, SwapRouterVersion } from "./net.i";
import pancakeRouterV2 from "src/abi/pancake-router-v2";
import pancakeRouterV3 from "src/abi/pancake-router-v3";


const BinanceSmartChain: NET = {
    id: 56,
    name: NetworkName.BinanceSmartChain,
    symbol: Symbol.BNB,
    decimals:18,
    explorer: {
        tx: 'https://bscscan.com/tx/',
        address: 'https://bscscan.com/address/',
        block: 'https://bscscan.com/block/'
    },
    rpc: { name: 'BSC Ankr', url: 'https://rpc.ankr.com/bsc' },
    multicall: "0x87e925f37dfce7679c318033dceb0d500514fced",
    tornadoContracts: [{
        instances: [
            { amount: 0.1, address: '0x84443CFd09A48AF6eF360C6976C5392aC5023a1F' },
            { amount: 1, address: '0xd47438C816c9E7f2E2888E060936a499Af9582b3' },
            { amount: 10, address: '0x330bdFADE01eE9bF63C209Ee33102DD334618e0a' },
            { amount: 100, address: '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD' },
        ], symbol: Symbol.BNB, decimals: 18
    }],
    miningBlockSeconds: 3,
    wrapedNativToken: { symbol: Symbol.WBNB, decimals: 18, address: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c" },
    tokens: [
        { symbol: Symbol.USDT, address: "0x55d398326f99059ff775485246999027b3197955", decimals: 18 },
        { symbol: Symbol.SHIB, address: '0x2859e4544c4bb03966803b044a93563bd2d0dd4d', decimals: 18 }, 
        { symbol: Symbol.SOL,  address: '0xfea6ab80cd850c3e63374bc737479aeec0e8b9a1', decimals: 18 }, 
        { symbol: Symbol.WETH, address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8', decimals: 18 }, 
        { symbol: Symbol.BUSD, address: '0xe9e7cea3dedca5984780bafc599bd69add087d56', decimals: 18 }, 
        { symbol: Symbol.USDC, address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', decimals: 18 }, 
        { symbol: Symbol.TUSD, address: '0x14016e85a25aeb13065688cafb43044c2ef86784', decimals: 18 }, 
        { symbol: Symbol.WBNB, address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', decimals: 18 },
        { symbol: Symbol.WTRX, address: '0x85eac5ac2f758618dfa09bdbe0cf174e7d574d5b', decimals: 18 }, 
        { symbol: Symbol.WBTC, address: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c', decimals: 18 },
    ],
    swapRouters:[
        {version:SwapRouterVersion.METAMASK_SWAP, address: "0x1a1ec25dc08e98e5e93f1104b5e5cdd298707d31", abi:metamaskSwapRouter},
        {version:SwapRouterVersion.UNISWAP_V2, address: "0x10ed43c718714eb63d5aa57b78b54704e256024e", abi:pancakeRouterV2},
        {version:SwapRouterVersion.UNISWAP_V3, address: "0x13f4ea83d0bd40e75c8222255bc855a974568dd4", abi:pancakeRouterV3, quoters:[
            {v:1, address:"0x678aa4bf4e210cf2166753e054d5b7c31cc7fa86",methodName:"pancakeV3SwapCallback",supportedFees:[ 10000n, 2500n,500n, 100n]},
            {v:2, address:"0xb048bbc1ee6b733fffcfb9e9cef7375518e25997",methodName:"pancakeV3SwapCallback",supportedFees:[ 10000n, 2500n,500n, 100n]}
        ]},
    ],
    requestsPerSecond: 5
}

export default BinanceSmartChain;
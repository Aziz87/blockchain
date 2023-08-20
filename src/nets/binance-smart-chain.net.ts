import metamaskSwapRouter from "../abi/metamask-swap-router";
import { Symbol, NET, NetworkName, SwapRouterVersion, Token } from "./net.i";
import pancakeRouterV2 from "../abi/uniswap-router-v2";
import pancakeRouterV3 from "../abi/pancake-router-v3";


const id = 56;
const BinanceSmartChain: NET = {
    id,
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
    wrapedNativToken: new Token(id, "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", 18, Symbol.WBNB,"WBNB"),
    tokens:{
       USDT: new Token(id,"0x55d398326f99059ff775485246999027b3197955",18, Symbol.USDT, "USDT"),
        WETH:new Token(id,"0x2170ed0880ac9a755fd29b2688956bd959f933f8",18, Symbol.WETH, "WETH" ),
        BUSD:new Token(id,"0xe9e7cea3dedca5984780bafc599bd69add087d56", 18, Symbol.BUSD, "BUSD" ),
        USDC:new Token(id,"0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", 18, Symbol.USDC, "USDC" ),
        WBTC:new Token(id,"0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c", 18, Symbol.WBTC, "WBTC" ),
    },
  
    swapRouters:[
        {version:SwapRouterVersion.METAMASK_SWAP, factory:"", address: "0x1a1ec25dc08e98e5e93f1104b5e5cdd298707d31", abi:metamaskSwapRouter},
        {version:SwapRouterVersion.UNISWAP_V2, address: "0x10ed43c718714eb63d5aa57b78b54704e256024e", factory:"0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73", abi:pancakeRouterV2},
        {version:SwapRouterVersion.UNISWAP_V3, address: "0x13f4ea83d0bd40e75c8222255bc855a974568dd4", factory:"0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865", abi:pancakeRouterV3, quoters:[
            {v:1, address:"0x678aa4bf4e210cf2166753e054d5b7c31cc7fa86",methodName:"pancakeV3SwapCallback",supportedFees:[ 10000n, 2500n,500n, 100n]},
            {v:2, address:"0xb048bbc1ee6b733fffcfb9e9cef7375518e25997",methodName:"pancakeV3SwapCallback",supportedFees:[ 10000n, 2500n,500n, 100n]}
        ]},
    ],
    requestsPerSecond: 5,
}

export default BinanceSmartChain;
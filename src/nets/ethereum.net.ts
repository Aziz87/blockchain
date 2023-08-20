import metamaskSwapRouter from "../abi/metamask-swap-router";
import { Symbol, NET, NetworkName, SwapRouterVersion, Token } from "./net.i";
import uniswapRouterV2 from "../abi/uniswap-router-v2";
import uniswapRouterV3 from "../abi/uniswap-router-v3";
import universalRouter from "../abi/universal-router";

const id = 1;
const Ethereum: NET = {
    id,
    name: NetworkName.EthereumMainnet,
    symbol: Symbol.ETH,
    decimals:18,
    explorer: {
        tx: 'https://etherscan.io/tx/',
        address: 'https://etherscan.io/address/',
        block: 'https://etherscan.io/block/'
    },
    rpc: { name: 'SecureRPC', url: 'https://api.securerpc.com/v1' },
    multicall: "0x9e223239efac780fff9d54241a71d329e6522451",
    tornadoContracts: [{
        instances: [
            { amount: 0.1, address: '0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc' },
            { amount: 1, address: '0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936' },
            { amount: 10, address: '0x910Cbd523D972eb0a6f4cAe4618aD62622b39DbF' },
            { amount: 100, address: '0xA160cdAB225685dA1d56aa342Ad8841c3b53f291' },
        ], symbol: Symbol.ETH, decimals: 18
    }],
    miningBlockSeconds: 15,
    wrapedNativToken:new Token(id,"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",18, Symbol.WETH, "WETH" ),

    tokens:{
        USDT: new Token(id,"0xdac17f958d2ee523a2206206994597c13d831ec7",6, Symbol.USDT, "USDT"),
         BUSD:new Token(id,"0x4fabb145d64652a948d72533023f6e7a623c7c53", 18, Symbol.BUSD, "BUSD" ),
         USDC:new Token(id,"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", 6, Symbol.USDC, "USDC" ),
         WBTC:new Token(id,"0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", 8, Symbol.WBTC, "WBTC" ),
     },
   

    swapRouters:[
        {
            version:SwapRouterVersion.METAMASK_SWAP, 
            factory:"", 
            initCodeHash:"",
            address: "0x881d40237659c251811cec9c364ef91dc08d300c", 
            abi:metamaskSwapRouter
        },
        {
            version:SwapRouterVersion.UNISWAP_V2, 
            factory:"0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", 
            address: "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", 
            initCodeHash:"0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f",
            abi:uniswapRouterV2
        },
        {
            version:SwapRouterVersion.UNISWAP_V3, 
            factory:"0x1F98431c8aD98523631AE4a59f267346ea31F984",
            address: "0xe592427a0aece92de3edee1f18e0157c05861564", 
            initCodeHash:"",
            abi:uniswapRouterV3, quoters:[
                {v:1,address:"0xb27308f9f90d607463bb33ea1bebb41c27ce5ab6",methodName:"uniswapV3SwapCallback",supportedFees:[   10000n, 3000n,500n, 100n]},
                {v:2,address:"0x61ffe014ba17989e743c5f6cb21bf9697530b21e",methodName:"uniswapV3SwapCallback",supportedFees:[   10000n, 3000n,500n, 100n]}
            ],
        },
        {
            version:SwapRouterVersion.UNIVERSAL_ROUTER, 
            factory:"0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", 
            address: "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", 
            initCodeHash:"",
            abi:universalRouter
        },

    ],
    requestsPerSecond:5,
}
export default Ethereum;
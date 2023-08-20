import { Symbol, NET, NetworkName, SwapRouterVersion, Token } from "./net.i";
import uniswapRouterV2 from "../abi/uniswap-router-v2";
import uniswapRouterV3 from "../abi/uniswap-router-v3";

const id = 137;
const Poligon: NET = {
    id,
    name: NetworkName.PoligonMaticNetwork,
    symbol: Symbol.MATIC,
    decimals:18,
    explorer: {
        tx: 'https://polygonscan.com/tx/',
        address: 'https://polygonscan.com/address/',
        block: 'https://polygonscan.com/block/'
    },
    rpc: { name: 'Polygon RPC', url: 'https://polygon-rpc.com/' },
    multicall: "0x11ce4b23bd875d7f5c6a31084f55fde1e9a87507",
    tornadoContracts: [{
        instances: [
            { amount: 100, address: '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD' },
            { amount: 1000, address: '0xdf231d99Ff8b6c6CBF4E9B9a945CBAcEF9339178' },
            { amount: 10000, address: '0xaf4c0B70B2Ea9FB7487C7CbB37aDa259579fe040' },
            { amount: 100000, address: '0xa5C2254e4253490C54cef0a4347fddb8f75A4998' }
        ], symbol: Symbol.MATIC, decimals: 18
    }],
    miningBlockSeconds: 2.3,
   

    wrapedNativToken: new Token(id,"0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", 18, Symbol.WMATIC, "WMATIC" ),
  
    tokens:{
        USDT: new Token(id,"0xc2132d05d31c914a87c6611c10748aeb04b58e8f",6, Symbol.USDT, "USDT"),
         BUSD:new Token(id,"0xdab529f40e671a1d4bf91361c21bf9f0c9712ab7", 18, Symbol.BUSD, "BUSD" ),
         USDC:new Token(id,"0x2791bca1f2de4661ed88a30c99a7a9449aa84174", 6, Symbol.USDC, "USDC" ),
         WBTC:new Token(id,"0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6", 8, Symbol.WBTC, "WBTC" ),
     },
   

    requestsPerSecond:5,
    swapRouters:[
        {
            version:SwapRouterVersion.METAMASK_SWAP, 
            factory:'', 
            address: "0x1a1ec25dc08e98e5e93f1104b5e5cdd298707d31", 
            initCodeHash:"",
            abi:uniswapRouterV2
        },
        {
            version:SwapRouterVersion.UNISWAP_V3, 
            factory:'', 
            address: "0xe592427a0aece92de3edee1f18e0157c05861564", 
            abi:uniswapRouterV3,
            initCodeHash:"",
            quoters:[
                {v:2, address:"0xe592427a0aece92de3edee1f18e0157c05861564",methodName:"uniswapV3SwapCallback",supportedFees:[10000n, 3000n, 500n, 100n]}
            ]
        },
    ],
}

export default Poligon;
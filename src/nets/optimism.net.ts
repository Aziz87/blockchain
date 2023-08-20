import { Symbol, NET, NetworkName, SwapRouterVersion, Token } from "./net.i";
import uniswapRouterV2 from "../abi/uniswap-router-v2";
import uniswapRouterV3 from "../abi/uniswap-router-v3";

const id = 10;
const Optimism: NET = {
    id,
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
    wrapedNativToken: new Token(id,"0x4200000000000000000000000000000000000006", 18, Symbol.WETH, "WETH" ),
  
    tokens:{
        USDT: new Token(id,"0x94b008aa00579c1307b0ef2c499ad98a8ce58e58",6, Symbol.USDT, "USDT"),
         BUSD:new Token(id,"0x9c9e5fd8bbc25984b178fdce6117defa39d2db39", 18, Symbol.BUSD, "BUSD" ),
         USDC:new Token(id,"0x7f5c764cbc14f9669b88837ca1490cca17c31607", 6, Symbol.USDC, "USDC" ),
         WBTC:new Token(id,"0x68f180fcce6836688e9084f035309e29bf0a2095", 8, Symbol.WBTC, "WBTC" ),
     },
   
     
    requestsPerSecond:5,
    swapRouters:[
        {version:SwapRouterVersion.UNISWAP_V2, factory:"0xf1046053aa5682b4f9a81b5481394da16be5ff5a", address: "0xa062ae8a9c5e11aaa026fc2670b0d65ccc8b2858", abi:uniswapRouterV2},
        {version:SwapRouterVersion.UNISWAP_V3, factory:"0x1f98431c8ad98523631ae4a59f267346ea31f984", address: "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45", abi:uniswapRouterV3},
    ],
}

export default Optimism;
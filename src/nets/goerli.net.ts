import { Symbol, NET, NetworkName, SwapRouterVersion, Token } from "./net.i";
import uniswapRouterV2 from "../abi/uniswap-router-v2";
import uniswapRouterV3 from "../abi/uniswap-router-v3";


const id = 5;
const Goerli: NET = {
    id,
    name: NetworkName.EthereumGoerli,
    symbol: Symbol.ETH,
    decimals:18,
    explorer: {
        tx: 'https://goerli.etherscan.io/tx/',
        address: 'https://goerli.etherscan.io/address/',
        block: 'https://goerli.etherscan.io/block/'
    },
    rpc: { name: 'Infura', url: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161' },
    multicall: "0x77dca2c955b15e9de4dbbcf1246b4b85b651e50e",
    tornadoContracts: [
        {
            instances: [
                { amount: 0.1, address: '0x6Bf694a291DF3FeC1f7e69701E3ab6c592435Ae7' },
                { amount: 1, address: '0x3aac1cC67c2ec5Db4eA850957b967Ba153aD6279' },
                { amount: 10, address: '0x723B78e67497E85279CB204544566F4dC5d2acA0' },
                { amount: 100, address: '0x0E3A09dDA6B20aFbB34aC7cD4A6881493f3E7bf7' }
            ], symbol: Symbol.ETH, decimals: 18
        },
        {
            instances: [
                { amount: 100, address: '0x538Ab61E8A9fc1b2f93b3dd9011d662d89bE6FE6' },
                { amount: 1000, address: '0x94Be88213a387E992Dd87DE56950a9aef34b9448' }
            ], symbol: Symbol.USDT, decimals: 6, tokenAddress: '0xb7FC2023D96AEa94Ba0254AA5Aeb93141e4aad66',
        },
        {
            instances: [
                { amount: 100, address: '0x05E0b5B40B7b66098C2161A5EE11C5740A3A7C45' },
                { amount: 1000, address: '0x23173fE8b96A4Ad8d2E17fB83EA5dcccdCa1Ae52' }
            ], symbol: Symbol.USDC, decimals: 6, tokenAddress: '0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C',
        },
        {
            instances: [
                { amount: 0.1, address: '0x242654336ca2205714071898f67E254EB49ACdCe' },
                { amount: 1, address: '0x776198CCF446DFa168347089d7338879273172cF' },
                { amount: 10, address: '0xeDC5d01286f99A066559F60a585406f3878a033e' }
            ], symbol: Symbol.WBTC, decimals: 8, tokenAddress: '0xC04B0d3107736C32e19F1c62b2aF67BE61d63a05',
        }
    ],
    miningBlockSeconds: 12,
    swapRouters:[
        {version:SwapRouterVersion.UNISWAP_V2, factory:"0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", address:"0x7a250d5630b4cf539739df2c5dacb4c659f2488d", abi:uniswapRouterV2},
        {version:SwapRouterVersion.UNISWAP_V3, factory:"0x1F98431c8aD98523631AE4a59f267346ea31F984", address:"0xe592427a0aece92de3edee1f18e0157c05861564", abi:uniswapRouterV3, quoters:[
            {v:1, address:"0xb27308f9f90d607463bb33ea1bebb41c27ce5ab6", methodName:"uniswapV3SwapCallback", supportedFees:[   10000n, 3000n,500n, 100n]},
            {v:2, address:"0x61ffe014ba17989e743c5f6cb21bf9697530b21e", methodName:"uniswapV3SwapCallback", supportedFees:[   10000n, 3000n,500n, 100n]}

        ] }
    ], 
    wrapedNativToken:new Token(id,"0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6",18, Symbol.WETH, "WETH" ),

    tokens:{
        USDT: new Token(id,"0x07865c6e87b9f70255377e024ace6630c1eaa37f",6, Symbol.USDT, "USDT"),
     },
   

    
    requestsPerSecond:5,
}

export default Goerli;
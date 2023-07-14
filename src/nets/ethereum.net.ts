import { Symbol, NET, NetworkName } from "./net.i";

const Ethereum: NET = {
    id: 1,
    name: NetworkName.EthereumMainnet,
    symbol: Symbol.ETH,
    decimals:18,
    explorer: {
        tx: 'https://etherscan.io/tx/',
        address: 'https://etherscan.io/address/',
        block: 'https://etherscan.io/block/'
    },
    rpc: { name: 'SecureRPC', url: 'https://api.securerpc.com/v1' },
    multicall: "0xeefba1e63905ef1d7acba5a8513c70307c1ce441",
    tornadoContracts: [{
        instances: [
            { amount: 0.1, address: '0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc' },
            { amount: 1, address: '0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936' },
            { amount: 10, address: '0x910Cbd523D972eb0a6f4cAe4618aD62622b39DbF' },
            { amount: 100, address: '0xA160cdAB225685dA1d56aa342Ad8841c3b53f291' },
        ], symbol: Symbol.ETH, decimals: 18
    }],
    miningBlockSeconds: 15,
    uniswapRouter: "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
    wrapedNativToken: { symbol: Symbol.WETH, decimals: 18, address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" },
    tokens: [
        {   symbol: Symbol.USDT, address: "0xdac17f958d2ee523a2206206994597c13d831ec7", decimals: 6 },
        {   symbol: Symbol.USDC, address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6},
        {   symbol: Symbol.BUSD, address: '0x4fabb145d64652a948d72533023f6e7a623c7c53', decimals: 18},
        {   symbol: Symbol.BNB,  address: '0xb8c77482e45f1f44de1745f52c74426c631bdd52', decimals: 18},
        {   symbol: Symbol.WBTC, address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', decimals: 8},
          
    ],
    requestsPerSecond:5
}
export default Ethereum;
import { Symbol, NET, NetworkName } from "./net.i";

const Poligon: NET = {
    id: 137,
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
    wrapedNativToken: null,
    uniswapRouter: null,
    tokens: [
        { address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', decimals: 6, symbol: Symbol.USDT },
        { address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', decimals: 6, symbol: Symbol.USDC },
        { address: '0xdab529f40e671a1d4bf91361c21bf9f0c9712ab7', decimals: 18, symbol: Symbol.BUSD },
        { address: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6', decimals: 8, symbol: Symbol.WBTC },
        { address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619', decimals: 18, symbol: Symbol.WETH}
    ],
    requestsPerSecond:5
}

export default Poligon;
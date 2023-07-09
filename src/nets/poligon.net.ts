import { CurrencySymbol, NET, NetworkName } from "./net.i";

const Poligon: NET = {
    id: 137,
    networkName: NetworkName.PoligonMaticNetwork,
    nativeCurrency: CurrencySymbol.MATIC,
    explorer: {
        tx: 'https://polygonscan.com/tx/',
        address: 'https://polygonscan.com/address/',
        block: 'https://polygonscan.com/block/'
    },
    rpc: [
        { name: 'Polygon RPC', url: 'https://polygon-rpc.com/' },
        { name: '1RPC', url: 'https://1rpc.io/matic/' }
    ],
    multicall: "0x11ce4B23bD875D7F5C6a31084f55fDe1e9A87507",
    tornadoContracts: [{
        instances: [
            { amount: 100, address: '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD' },
            { amount: 1000, address: '0xdf231d99Ff8b6c6CBF4E9B9a945CBAcEF9339178' },
            { amount: 10000, address: '0xaf4c0B70B2Ea9FB7487C7CbB37aDa259579fe040' },
            { amount: 100000, address: '0xa5C2254e4253490C54cef0a4347fddb8f75A4998' }
        ], symbol: CurrencySymbol.MATIC, decimals: 18
    }],
    miningBlockSeconds: 2.3,
    wrapedNativToken: null,
    uniswapRouter: null,
    tokens: [{ address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', decimals: 6, symbol: CurrencySymbol.USDT }],
    requestsPerSecond:5
}

export default Poligon;
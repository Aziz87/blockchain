import { CurrencySymbol, NET, NetworkName } from "./net.i";

const BinanceSmartChainTestnet: NET = {
    id: 97,
    networkName: NetworkName.BinanceSmartChainTestnet,
    nativeCurrency: CurrencySymbol.BNB,
    explorer: {
        tx: 'https://testnet.bscscan.com/tx/',
        address: 'https://testnet.bscscan.com/address/',
        block: 'https://testnet.bscscan.com/block/'
    },
    rpc: { name: 'BinanceRPC', url: 'https://data-seed-prebsc-2-s3.binance.org:8545' },
    multicall: "0x3bab6eD264a077Ef54BF9654E43f2F5B6b6A46D7",
    tornadoContracts: [
        {
            instances: [
                { amount: 0.1, address: '' },
                { amount: 1, address: '' },
                { amount: 10, address: '' },
                { amount: 100, address: '' }
            ], symbol: CurrencySymbol.BNB, decimals: 18
        }
    ],
    miningBlockSeconds: 3,
    uniswapRouter: "0x9ac64cc6e4415144c455bd8e4837fea55603e5c3",
    wrapedNativToken: { symbol: CurrencySymbol.WBNB, decimals: 18, address: "0xae13d989dac2f0debff460ac112a837c89baa7cd" },
    tokens: [{ symbol: CurrencySymbol.USDT, decimals: 18, address: "0x337610d27c682e347c9cd60bd4b3b107c9d34ddd" }],
    requestsPerSecond:5

}

export default BinanceSmartChainTestnet;
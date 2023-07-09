import { CurrencySymbol, NET, NetworkName } from "./net.i";

const BinanceSmartChain: NET = {
    id: 56,
    networkName: NetworkName.BinanceSmartChain,
    nativeCurrency: CurrencySymbol.BNB,
    explorer: {
        tx: 'https://bscscan.com/tx/',
        address: 'https://bscscan.com/address/',
        block: 'https://bscscan.com/block/'
    },
    rpc: { name: '1RPC', url: 'https://1rpc.io/bnb' },
    multicall: "0x41263cba59eb80dc200f3e2544eda4ed6a90e76c",
    tornadoContracts: [{
        instances: [
            { amount: 0.1, address: '0x84443CFd09A48AF6eF360C6976C5392aC5023a1F' },
            { amount: 1, address: '0xd47438C816c9E7f2E2888E060936a499Af9582b3' },
            { amount: 10, address: '0x330bdFADE01eE9bF63C209Ee33102DD334618e0a' },
            { amount: 100, address: '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD' },
        ], symbol: CurrencySymbol.BNB, decimals: 18
    }],
    miningBlockSeconds: 3,
    uniswapRouter: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
    wrapedNativToken: { symbol: CurrencySymbol.WBNB, decimals: 18, address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" },
    tokens: [{ symbol: CurrencySymbol.USDT, decimals: 18, address: "0x55d398326f99059fF775485246999027B3197955" }],
    requestsPerSecond:5
}

export default BinanceSmartChain;
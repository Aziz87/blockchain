import { CurrencySymbol, NET, NetworkName } from "./net.i";

const Arbitrum: NET = {
    id: 42161,
    networkName: NetworkName.ArbitrumOne,
    nativeCurrency: CurrencySymbol.ETH,
    explorer: {
        tx: 'https://arbiscan.io/tx/',
        address: 'https://arbiscan.io/address/',
        block: 'https://arbiscan.io/block/'
    },
    rpc: { name: 'Arbitrum RPC', url: 'https://arb1.arbitrum.io/rpc/' },
    multicall: "0x842eC2c7D803033Edf55E478F461FC547Bc54EB2",
    tornadoContracts: [{
        instances: [
            { amount: 0.1, address: '0x84443CFd09A48AF6eF360C6976C5392aC5023a1F' },
            { amount: 1, address: '0xd47438C816c9E7f2E2888E060936a499Af9582b3' },
            { amount: 10, address: '0x330bdFADE01eE9bF63C209Ee33102DD334618e0a' },
            { amount: 100, address: '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD' }
        ], symbol: CurrencySymbol.ETH, decimals: 18
    }],
    miningBlockSeconds: 1,
    wrapedNativToken: null,
    uniswapRouter: null,
    tokens: [{ symbol: CurrencySymbol.USDT, decimals: 6, address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9" }],
    requestsPerSecond:5,
}

export default Arbitrum;
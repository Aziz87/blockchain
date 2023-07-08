import { CurrencySymbol, NET, NetworkName } from "./net.i";

const Avalanche: NET = {
    id: 43114,
    networkName: NetworkName.AvalancheMainnet,
    nativeCurrency: CurrencySymbol.AVAX,
    explorer: {
        tx: 'https://snowtrace.io/tx/',
        address: 'https://snowtrace.io/address/',
        block: 'https://snowtrace.io/block/'
    },
    rpc: [
        { name: 'Avalanche Public PRC', url: 'https://avalanche-evm.publicnode.com/' },
    ],
    multicall: "0xe86e3989c74293Acc962156cd3F525c07b6a1B6e",
    tornadoContracts: [{
        instances: [
            { amount: 10, address: '0x330bdFADE01eE9bF63C209Ee33102DD334618e0a' },
            { amount: 100, address: '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD' },
            { amount: 500, address: '0xaf8d1839c3c67cf571aa74B5c12398d4901147B3' }
        ],
        symbol: CurrencySymbol.AVAX,
        decimals: 18
    }],
    miningBlockSeconds: 1.9,
    wrapedNativToken: null,
    uniswapRouter: null,
    tokens: [{ symbol: CurrencySymbol.USDT, decimals: 6, address: "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7" }]

}

export default Avalanche;
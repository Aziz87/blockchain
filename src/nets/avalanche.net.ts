import { Symbol, NET, NetworkName } from "./net.i";

const Avalanche: NET = {
    id: 43114,
    name: NetworkName.AvalancheMainnet,
    decimals:18,
    symbol: Symbol.AVAX,
    explorer: {
        tx: 'https://snowtrace.io/tx/',
        address: 'https://snowtrace.io/address/',
        block: 'https://snowtrace.io/block/'
    },
    rpc: { name: 'Avalanche Public PRC', url: 'https://avalanche-evm.publicnode.com/' },
    multicall: "0xe86e3989c74293acc962156cd3f525c07b6a1b6e",
    tornadoContracts: [{
        instances: [
            { amount: 10, address: '0x330bdFADE01eE9bF63C209Ee33102DD334618e0a' },
            { amount: 100, address: '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD' },
            { amount: 500, address: '0xaf8d1839c3c67cf571aa74B5c12398d4901147B3' }
        ],
        symbol: Symbol.AVAX,
        decimals: 18
    }],
    miningBlockSeconds: 1.9,
    wrapedNativToken: null,
    uniswapRouterV2: null,
    uniswapRouterV3: null,
    tokens: [
        { symbol: Symbol.USDT, decimals: 6, address: "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7" },
        { symbol: Symbol.USDC, decimals: 6, address: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e" },
        { symbol: Symbol.BUSD, decimals: 18, address: "0x19860ccb0a68fd4213ab9d8266f7bbf05a8dde98" },
        { symbol: Symbol.WETH, decimals: 18, address: "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab" },
        { symbol: Symbol.WBTC, decimals: 8, address: "0x50b7545627a5162f82a992c33b87adc75187b218" }
    
    ],
    requestsPerSecond:5

}

export default Avalanche;
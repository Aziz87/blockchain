import { CurrencySymbol, NET, NetworkName } from "./net.i";

const Optimism: NET = {
    id: 10,
    networkName: NetworkName.Optimism,
    nativeCurrency: CurrencySymbol.ETH,
    explorer: {
        tx: 'https://optimistic.etherscan.io/tx/',
        address: 'https://optimistic.etherscan.io/address/',
        block: 'https://optimistic.etherscan.io/block/'
    },
    rpc:{ name: 'Optimism', url: 'https://mainnet.optimism.io/' },
    multicall: "0x35A6Cdb2C9AD4a45112df4a04147EB07dFA01aB7",
    tornadoContracts: [{
        instances: [
            { amount: 0.1, address: '0x84443CFd09A48AF6eF360C6976C5392aC5023a1F' },
            { amount: 1, address: '0xd47438C816c9E7f2E2888E060936a499Af9582b3' },
            { amount: 10, address: '0x330bdFADE01eE9bF63C209Ee33102DD334618e0a' },
            { amount: 100, address: '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD' }
        ],
        symbol: CurrencySymbol.ETH,
        decimals: 18
    }],
    miningBlockSeconds: 2,
    wrapedNativToken: null,
    uniswapRouter: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    tokens: [{ address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58', decimals: 6, symbol: CurrencySymbol.USDT }
    ],
    requestsPerSecond:5
}

export default Optimism;
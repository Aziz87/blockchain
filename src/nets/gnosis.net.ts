import { CurrencySymbol, NET, NetworkName } from "./net.i";

const Gnosis: NET = {
    id: 100,
    networkName: NetworkName.GnosisChain,
    nativeCurrency: CurrencySymbol.xDAI,
    explorer: {
        tx: 'https://blockscout.com/xdai/mainnet/tx/',
        address: 'https://blockscout.com/xdai/mainnet/address/',
        block: 'https://blockscout.com/xdai/mainnet/block/'
    },
    rpc: { name: 'GnosisChain', url: 'https://rpc.gnosischain.com' },
    multicall: "0xb5b692a88bdfc81ca69dcb1d924f59f0413a602a",
    tornadoContracts: [{
        instances: [
            { amount: 100, address: '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD' },
            { amount: 1000, address: '0xdf231d99Ff8b6c6CBF4E9B9a945CBAcEF9339178' },
            { amount: 10000, address: '0xaf4c0B70B2Ea9FB7487C7CbB37aDa259579fe040' },
            { amount: 100000, address: '0xa5C2254e4253490C54cef0a4347fddb8f75A4998' }
        ], symbol: CurrencySymbol.xDAI, decimals: 18
    }],
    miningBlockSeconds: 5,
    wrapedNativToken: null,
    uniswapRouter: null,
    tokens: [{ symbol: CurrencySymbol.USDT, decimals: 6, address: "0x4ECaBa5870353805a9F068101A40E0f32ed605C6" }],
    requestsPerSecond:3
}

export default Gnosis;
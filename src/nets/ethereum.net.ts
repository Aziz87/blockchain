import { CurrencySymbol, NET, NetworkName } from "./net.i";

const Ethereum: NET = {
    id: 1,
    networkName: NetworkName.EthereumMainnet,
    nativeCurrency: CurrencySymbol.ETH,
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
        ], symbol: CurrencySymbol.ETH, decimals: 18
    }],
    miningBlockSeconds: 15,
    uniswapRouter: "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
    wrapedNativToken: { symbol: CurrencySymbol.WETH, decimals: 18, address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" },
    tokens: [{ symbol: CurrencySymbol.USDT, decimals: 6, address: "0xdac17f958d2ee523a2206206994597c13d831ec7" }],
    requestsPerSecond:5
}
export default Ethereum;
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
    rpc: [
        { name: 'BinanceRPC', url: 'https://data-seed-prebsc-2-s3.binance.org:8545' }
    ],
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
        // {
        //     instances: [
        //         { amount: 100, address: '0x538Ab61E8A9fc1b2f93b3dd9011d662d89bE6FE6' },
        //         { amount: 1000, address: '0x94Be88213a387E992Dd87DE56950a9aef34b9448' }
        //     ], symbol: CurrencySymbol.USDT, decimals: 6, tokenAddress: '0xb7FC2023D96AEa94Ba0254AA5Aeb93141e4aad66',
        // },
        // {
        //     instances: [
        //         { amount: 100, address: '0x05E0b5B40B7b66098C2161A5EE11C5740A3A7C45' },
        //         { amount: 1000, address: '0x23173fE8b96A4Ad8d2E17fB83EA5dcccdCa1Ae52' }
        //     ], symbol: CurrencySymbol.USDC, decimals: 6, tokenAddress: '0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C',
        // },
        // {
        //     instances: [
        //         { amount: 0.1, address: '0x242654336ca2205714071898f67E254EB49ACdCe' },
        //         { amount: 1, address: '0x776198CCF446DFa168347089d7338879273172cF' },
        //         { amount: 10, address: '0xeDC5d01286f99A066559F60a585406f3878a033e' }
        //     ], symbol: CurrencySymbol.WBTC, decimals: 8, tokenAddress: '0xC04B0d3107736C32e19F1c62b2aF67BE61d63a05',
        // }
    ],
    miningBlockSeconds: 3,
    uniswapRouter: "0x9ac64cc6e4415144c455bd8e4837fea55603e5c3",
    wrapedNativToken: { symbol: CurrencySymbol.WBNB, decimals: 18, address: "0xae13d989dac2f0debff460ac112a837c89baa7cd" },
    tokens: [{ symbol: CurrencySymbol.USDT, decimals: 18, address: "0x337610d27c682e347c9cd60bd4b3b107c9d34ddd" }]

}

export default BinanceSmartChainTestnet;
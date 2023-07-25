import { Symbol, NET, NetworkName } from "./net.i";
const dotenv = require("dotenv").config()
if (!process.env.TRONGRID_APIKEY) console.error("PLEASE SET TRONGRID_APIKEY to .env file for use tron methods!");

const Tron: NET = {
    id: 1000,
    name: NetworkName.Tron,
    symbol: Symbol.TRX,
    decimals:6,
    explorer: {
        tx: 'https://tronscan.org/#/transaction/',
        address: 'https://tronscan.org/#/address/',
        block: 'https://tronscan.org/#/block/'
    },
    rpc: { name: 'trongrid', url: 'https://api.trongrid.io', apiKey: process.env.TRONGRID_APIKEY },
    multicall: "typacdasdae4zjcacwhscmqy6kcssp2jdt",
    tornadoContracts: [

    ],
    miningBlockSeconds: 3,
    wrapedNativToken: { address: 'tnuc9qb1rrps5cbwlmnmxxbjyfoydxjwfr', decimals: 6, symbol: Symbol.WTRX},
    uniswapRouterV2: "tkzxdsv2fzkqreqkkvgp5dcwexbekmg2ax",
    uniswapRouterV3: "tfvisxfaijzfeyesjcevkhfex7hgdtxzf9",
    tokens: [
        { address: 'tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t', symbol: Symbol.USDT, decimals: 6 },
        { address: 'tekxitehnzsmse2xqrbj4w32run966rdz8', symbol: Symbol.USDC, decimals: 6 },
        { address: 'tmz2swatiatzvvch2ebpsbvtywupt9edjh', symbol: Symbol.BUSD, decimals: 18 },
        { address: 'tpymhehy5n8tcefygqw2rpxsghsfzghpdn', symbol: Symbol.USDD, decimals: 6 },
        { address: 'tn3w4h6rk2ce4vx9ynfqhwkennhjoxb3m9', symbol: Symbol.WBTC, decimals: 8 }
    ],
    requestsPerSecond:14
}

export default Tron;
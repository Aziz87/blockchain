import { Symbol, NET, NetworkName, SwapRouterVersion } from "./net.i";
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
    multicall: "0xf5da6999e5b9c4b189d1cc6d605ea2d77df48c13",
    tornadoContracts: [

    ],
    miningBlockSeconds: 3,
    wrapedNativToken: { address: '0x891cdb91d149f23b1a45d9c5ca78a88d0cb44c18', decimals: 6, symbol: Symbol.WTRX},
    tokens: [
        { address: '0xa614f803b6fd780986a42c78ec9c7f77e6ded13c', symbol: Symbol.USDT, decimals: 6 },
        { address: '0x3487b63d30b5b2c87fb7ffa8bcfade38eaac1abe', symbol: Symbol.USDC, decimals: 6 },
        { address: '0x83c91bfde3e6d130e286a3722f171ae49fb25047', symbol: Symbol.BUSD, decimals: 18 },
        { address: '0x94f24e992ca04b49c6f2a2753076ef8938ed4daa', symbol: Symbol.USDD, decimals: 6 },
        { address: '0x84716914c0fdf7110a44030d04d0c4923504d9cc', symbol: Symbol.WBTC, decimals: 8 }
    ],
    requestsPerSecond:14,
    swapRouters:[
        {version:SwapRouterVersion.SUNSWAP_V2, address:"0x6e0617948fe030a7e4970f8389d4ad295f249b7e"},
        {version:SwapRouterVersion.SUNSWAP_V3, address:"0x3c9e0ac33f138216c50638d71c344a299d0d1030"},
    ]

}

export default Tron;
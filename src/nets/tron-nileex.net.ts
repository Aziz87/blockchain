import { Symbol, NET, NetworkName, Token } from "./net.i";
const dotenv = require("dotenv").config()
if (!process.env.TRONGRID_APIKEY) console.error("PLEASE SET TRONGRID_APIKEY to .env file for use tron-nile methods!");

const id = 1001;
const TronNile: NET = {
    id,
    name: NetworkName.TronNile,
    symbol: Symbol.TRX,
    decimals:6,
    explorer: {
        tx: 'https://nile.tronscan.org/#/transaction/',
        address: 'https://nile.tronscan.org/#/address/',
        block: 'https://nile.tronscan.org/#/block/'
    },
    rpc: { name: 'nileex', url: 'https://nile.trongrid.io/', apiKey: process.env.TRONGRID_APIKEY },
    multicall: "0xbeb95b10bab7915d258062be04b36c0f410f67d0",
    tornadoContracts: [

    ],
    miningBlockSeconds: 3,
    wrapedNativToken: new Token(id, "0xfb3b3134f13ccd2c81f4012e53024e8135d58fee", 6, Symbol.WTRX, "WTRX"),//{ address: '0xfb3b3134f13ccd2c81f4012e53024e8135d58fee', decimals: 6, symbol: Symbol.WTRX },
    tokens: {
        USDT: new Token(id, "0xea51342dabbb928ae1e576bd39eff8aaf070a8c6", 6, Symbol.USDT, "USDT")
    },
    swapRouters:[],
    requestsPerSecond:5,
}

export default TronNile;
import { CurrencySymbol, NET, NetworkName } from "./net.i";
const dotenv = require("dotenv").config()
if (!process.env.TRONGRID_APIKEY) console.error("PLEASE SET TRONGRID_APIKEY to .env file for use tron-nile methods!");


const TronNile: NET = {
    id: 1001,
    networkName: NetworkName.TronNile,
    nativeCurrency: CurrencySymbol.TRX,
    explorer: {
        tx: 'https://nile.tronscan.org/#/transaction/',
        address: 'https://nile.tronscan.org/#/address/',
        block: 'https://nile.tronscan.org/#/block/'
    },
    rpc: { name: 'nileex', url: 'https://nile.trongrid.io/', apiKey: process.env.TRONGRID_APIKEY },
    multicall: "TRPKCrLsHrSXfAo8zAUa8fBRMm8pz43MRs",
    tornadoContracts: [

    ],
    miningBlockSeconds: 3,
    wrapedNativToken: { address: 'TYsbWxNnyTgsZaTFaue9hqpxkU3Fkco94a', decimals: 6, symbol: CurrencySymbol.WTRX },
    uniswapRouter: "",
    tokens: [
        { address: 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj', decimals: 6, symbol: CurrencySymbol.USDT }
    ],
    requestsPerSecond:5
}

export default TronNile;
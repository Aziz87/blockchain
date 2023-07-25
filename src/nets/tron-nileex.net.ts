import { Symbol, NET, NetworkName } from "./net.i";
const dotenv = require("dotenv").config()
if (!process.env.TRONGRID_APIKEY) console.error("PLEASE SET TRONGRID_APIKEY to .env file for use tron-nile methods!");


const TronNile: NET = {
    id: 1001,
    name: NetworkName.TronNile,
    symbol: Symbol.TRX,
    decimals:6,
    explorer: {
        tx: 'https://nile.tronscan.org/#/transaction/',
        address: 'https://nile.tronscan.org/#/address/',
        block: 'https://nile.tronscan.org/#/block/'
    },
    rpc: { name: 'nileex', url: 'https://nile.trongrid.io/', apiKey: process.env.TRONGRID_APIKEY },
    multicall: "trpkcrlshrsxfao8zaua8fbrmm8pz43mrs",
    tornadoContracts: [

    ],
    miningBlockSeconds: 3,
    wrapedNativToken: { address: 'tysbwxnnytgszatfaue9hqpxku3fkco94a', decimals: 6, symbol: Symbol.WTRX },
    uniswapRouterV2: null,
    uniswapRouterV3: null,
    tokens: [
        { address: 'txlaq63xg1nazckpwkhvzw7csemlmeqcdj', decimals: 6, symbol: Symbol.USDT }
    ],
    requestsPerSecond:5
}

export default TronNile;
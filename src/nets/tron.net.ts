import { CurrencySymbol, NET, NetworkName } from "./net.i";
const dotenv = require("dotenv").config()
if (!process.env.TRONGRID_APIKEY) console.error("PLEASE SET TRONGRID_APIKEY to .env file for use tron methods!");

const Tron: NET = {
    id: 1000,
    networkName: NetworkName.Tron,
    nativeCurrency: CurrencySymbol.TRX,
    explorer: {
        tx: 'https://tronscan.org/#/transaction/',
        address: 'https://tronscan.org/#/address/',
        block: 'https://tronscan.org/#/block/'
    },
    rpc: { name: 'trongrid', url: 'https://api.trongrid.io', apiKey: process.env.TRONGRID_APIKEY },
    multicall: "TYPACdASdAe4ZjcACwHscmqy6KCssP2jDt",
    tornadoContracts: [

    ],
    miningBlockSeconds: 3,
    wrapedNativToken: { address: 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR', decimals: 6, symbol: CurrencySymbol.WTRX },
    uniswapRouter: "",
    tokens: [
        { address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', decimals: 6, symbol: CurrencySymbol.USDT },
        { address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',symbol: CurrencySymbol.USDC,decimals: 6 },
        { address: 'TMz2SWatiAtZVVcH2ebpsbVtYwUPT9EdjH', symbol: CurrencySymbol.BUSD,decimals: 18 },
        { address: 'TFczxzPhnThNSqr5by8tvxsdCFRRz6cPNq', symbol: CurrencySymbol.NFT,decimals: 6 },
        { address: 'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn', symbol: CurrencySymbol.USDD,decimals: 6 },
    ],
    requestsPerSecond:5
}

export default Tron;
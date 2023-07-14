import { Symbol, NET, NetworkName } from "./net.i";
import { lower } from "src/utils/string";

const BinanceSmartChain: NET = {
    id: 56,
    name: NetworkName.BinanceSmartChain,
    symbol: Symbol.BNB,
    decimals:18,
    explorer: {
        tx: 'https://bscscan.com/tx/',
        address: 'https://bscscan.com/address/',
        block: 'https://bscscan.com/block/'
    },
    rpc: { name: 'BSC Ankr', url: 'https://rpc.ankr.com/bsc' },
    multicall: "0x41263cba59eb80dc200f3e2544eda4ed6a90e76c",
    tornadoContracts: [{
        instances: [
            { amount: 0.1, address: '0x84443CFd09A48AF6eF360C6976C5392aC5023a1F' },
            { amount: 1, address: '0xd47438C816c9E7f2E2888E060936a499Af9582b3' },
            { amount: 10, address: '0x330bdFADE01eE9bF63C209Ee33102DD334618e0a' },
            { amount: 100, address: '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD' },
        ], symbol: Symbol.BNB, decimals: 18
    }],
    miningBlockSeconds: 3,
    uniswapRouter: lower("0x10ED43C718714eb63d5aA57B78B54704E256024E"),
    wrapedNativToken: { symbol: Symbol.WBNB, decimals: 18, address: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c" },
    tokens: [
        { symbol: Symbol.USDT, address: "0x55d398326f99059ff775485246999027b3197955", decimals: 18 },
        { symbol: Symbol.SHIB, address: '0x2859e4544c4bb03966803b044a93563bd2d0dd4d', decimals: 18 }, 
        { symbol: Symbol.SOL,  address: '0xfea6ab80cd850c3e63374bc737479aeec0e8b9a1', decimals: 18 }, 
        { symbol: Symbol.WETH, address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8', decimals: 18 }, 
        { symbol: Symbol.BUSD, address: '0xe9e7cea3dedca5984780bafc599bd69add087d56', decimals: 18 }, 
        { symbol: Symbol.USDC, address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', decimals: 18 }, 
        { symbol: Symbol.TUSD, address: '0x14016e85a25aeb13065688cafb43044c2ef86784', decimals: 18 }, 
        { symbol: Symbol.WBNB, address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', decimals: 18 },
        { symbol: Symbol.WTRX, address: '0x85eac5ac2f758618dfa09bdbe0cf174e7d574d5b', decimals: 18 }, 
        { symbol: Symbol.WBTC, address: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c', decimals: 18 },
    ],
    requestsPerSecond: 5
}

export default BinanceSmartChain;
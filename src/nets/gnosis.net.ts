import { Symbol, NET, NetworkName, Token } from "./net.i";

const id = 100;
const Gnosis: NET = {
    id,
    name: NetworkName.GnosisChain,
    decimals:18,
    symbol: Symbol.xDAI,
    explorer: {
        tx: 'https://blockscout.com/xdai/mainnet/tx/',
        address: 'https://blockscout.com/xdai/mainnet/address/',
        block: 'https://blockscout.com/xdai/mainnet/block/'
    },
    rpc: { name: 'Gnosis Ankr', url: 'https://rpc.ankr.com/gnosis' },
    multicall: "0xb5b692a88bdfc81ca69dcb1d924f59f0413a602a",
    tornadoContracts: [{
        instances: [
            { amount: 100, address: '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD' },
            { amount: 1000, address: '0xdf231d99Ff8b6c6CBF4E9B9a945CBAcEF9339178' },
            { amount: 10000, address: '0xaf4c0B70B2Ea9FB7487C7CbB37aDa259579fe040' },
            { amount: 100000, address: '0xa5C2254e4253490C54cef0a4347fddb8f75A4998' }
        ], symbol: Symbol.xDAI, decimals: 18
    }],
    miningBlockSeconds: 5,
    wrapedNativToken: null,
    swapRouters:[],
    requestsPerSecond:3,
    tokens:{
        USDT: new Token(id,"0x4ecaba5870353805a9f068101a40e0f32ed605c6",6, Symbol.USDT, "USDT"),
    }

 }


export default Gnosis;
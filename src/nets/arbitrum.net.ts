import { Symbol, NET, NetworkName, Token } from "./net.i";



const id =42161;
const Arbitrum: NET = {
    id,
    name: NetworkName.ArbitrumOne,
    symbol:Symbol.WETH, 
    decimals:18,
    explorer: {
        tx: 'https://arbiscan.io/tx/',
        address: 'https://arbiscan.io/address/',
        block: 'https://arbiscan.io/block/'
    },
    rpc: { name: 'Arbitrum RPC', url: 'https://arb1.arbitrum.io/rpc/' },
    multicall: "0x842ec2c7d803033edf55e478f461fc547bc54eb2",
    tornadoContracts: [{
        instances: [
            { amount: 0.1, address: '0x84443CFd09A48AF6eF360C6976C5392aC5023a1F' },
            { amount: 1, address: '0xd47438C816c9E7f2E2888E060936a499Af9582b3' },
            { amount: 10, address: '0x330bdFADE01eE9bF63C209Ee33102DD334618e0a' },
            { amount: 100, address: '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD' }
        ], symbol: Symbol.ETH, decimals: 18
    }],
    miningBlockSeconds: 1,
    wrapedNativToken: new Token(id,"0x82af49447d8a07e3bd95bd0d56f35241523fbab1",18,Symbol.WETH, "Ethereum"),
    tokens:{
        USDT:new Token(id,"0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",6,Symbol.USDT, "USDT"),
        USDC:new Token(id,"0xaf88d065e77c8cc2239327c5edb3a432268e5831",6,Symbol.USDC, "USDC"),
        WBTC:new Token(id,"0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",8,Symbol.WBTC, "WBTC"),
    },
    requestsPerSecond:5,
    swapRouters:[],
}

export default Arbitrum;
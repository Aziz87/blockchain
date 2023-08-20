import { BigNumberish, ethers } from "ethers";
import {Token as UniswapToken} from "@uniswap/sdk-core"

export interface TornatoContract {
    instances: { amount: number, address: string }[];
    symbol: Symbol;//'ETH',
    decimals: number;//18
    tokenAddress?: string;
}

export enum NetworkName {
    EthereumMainnet = 'Ethereum Mainnet',
    EthereumGoerli = 'Ethereum Goerli',
    BinanceSmartChain = 'Binance Smart Chain',
    BinanceSmartChainTestnet = 'BSC Testnet',
    Optimism = 'Optimism Network',
    PoligonMaticNetwork = 'Polygon (Matic) Network',
    ArbitrumOne = 'Arbitrum One',
    GnosisChain = 'Gnosis Chain',
    AvalancheMainnet = 'Avalanche Mainnet',
    Tron = 'Tron',
    TronNile = 'Tron Nile',
}


export enum Symbol {
    ETH = 'ETH',
    WETH = 'WETH',
    BNB = 'BNB',
    WBNB = 'WBNB',
    MATIC = 'MATIC',
    xDAI = 'xDAI',
    AVAX = 'AVAX',
    USDT = "USDT",
    USDC = "USDC",
    BUSD = "BUSD",
    WBTC = "WBTC",
    NFT = "NFT",
    USDD = "USDD",
    TRX = "TRX",
    WTRX = "WTRX",
    SHIB = "SHIB",
    SOL = "SOL",
    TUSD = "TUSD",
    WMATIC = "WMATIC"
}

export interface IExplorer {
    tx: string;
    address: string;
    block: string;
}

export interface IRPC {
    name: string;
    url?: string;
    apiKey?: string;
}

export class Token extends UniswapToken {
    constructor(chainId:number, address:string, decimals:number, symbol:string, name:string){
       super(chainId, address, decimals, symbol, name)
    }
}


export enum SwapRouterVersion {
    UNISWAP_V2 = "UNISWAP_V2",
    UNISWAP_V3 = "UNISWAP_V3",
    SUNSWAP_V2 = "SUNSWAP_V2",
    SUNSWAP_V3 = "SUNSWAP_V3",
    METAMASK_SWAP = "METAMASK_SWAP",
    UNKNOWN_ROUTER = "UNKNOWN_ROUTER",
    UNIVERSAL_ROUTER = "UNIVERSAL_ROUTER"
}

export interface Quoter{
    v:number;
    address:Lowercase<string>;
    methodName:string;
    supportedFees:BigNumberish[]
}

export interface SwapRouter {
    version:SwapRouterVersion;
    address:Lowercase<string>,
    initCodeHash:string,
    factory:string,
    quoters?:Quoter[],
    abi:any
}

export interface NET {
    
    id: number;//1
    name: NetworkName// 'Ethereum Mainnet',
    symbol: Symbol;//'eth',
    decimals:number;
    explorer: IExplorer;
    rpc: IRPC;//       { name: 'SecureRPC', url: 'https://api.securerpc.com/v1}
    multicall: Lowercase<string>;//'0xeefba1e63905ef1d7acba5a8513c70307c1ce441',
    tornadoContracts: TornatoContract[];
    miningBlockSeconds: number;//15
    // uniswapRouterV2: Lowercase<string>;
    // uniswapRouterV3: Lowercase<string>;
    swapRouters:SwapRouter[];
    wrapedNativToken: Token;
    tokens: {
        USDT?:Token,
        BUSD?:Token,
        USDC?:Token,
        WBTC?:Token,
        WETH?:Token,
    }

    requestsPerSecond:number;
}



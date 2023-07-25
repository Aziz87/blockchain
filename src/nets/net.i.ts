
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
    TUSD = "TUSD"
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

export interface Token {
    symbol: Symbol;
    decimals: number;
    address: Lowercase<string>
    name?:string;
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
    uniswapRouterV2: Lowercase<string>;
    uniswapRouterV3: Lowercase<string>;
    wrapedNativToken: Token;
    tokens: Token[];
    requestsPerSecond:number;
}



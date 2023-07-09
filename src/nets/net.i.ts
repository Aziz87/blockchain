
export interface TornatoContract {
    instances: { amount: number, address: string }[];
    symbol: CurrencySymbol;//'ETH',
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

export enum CurrencySymbol {
    ETH = 'ETH',
    WETH = 'WETH',
    BNB = 'BNB',
    WBNB = 'WBNB',
    MATIC = 'MATIC',
    xDAI = 'xDAI',
    AVAX = 'AVAX',
    USDT = "USDT",
    USDC = "USDC",
    WBTC = "WBTC",
    TRX = "TRX",
    WTRX = "WTRX",
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

export interface NetworkToken {
    symbol: CurrencySymbol;
    decimals: number;
    address: string
}

export interface NET {
    id: number;//1
    networkName: NetworkName// 'Ethereum Mainnet',
    nativeCurrency: CurrencySymbol;//'eth',
    explorer: IExplorer;
    rpc: IRPC;//       { name: 'SecureRPC', url: 'https://api.securerpc.com/v1}
    multicall: string;//'0xeefba1e63905ef1d7acba5a8513c70307c1ce441',
    tornadoContracts: TornatoContract[],
    miningBlockSeconds: number;//15
    uniswapRouter: string;
    wrapedNativToken: NetworkToken;
    tokens: NetworkToken[];
    requestsPerSecond:number;
}

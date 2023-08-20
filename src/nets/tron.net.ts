import sunSwapRouterV2 from "../abi/sun-swap-router-v2";
import { Symbol, NET, NetworkName, SwapRouterVersion, Token } from "./net.i";
import sunSwapRouterV3 from "../abi/sun-swap-router-v3";
const dotenv = require("dotenv").config()
if (!process.env.TRONGRID_APIKEY) console.error("PLEASE SET TRONGRID_APIKEY to .env file for use tron methods!");

const id = 1000;
const Tron: NET = {
    id,
    name: NetworkName.Tron,
    symbol: Symbol.TRX,
    decimals:6,
    explorer: {
        tx: 'https://tronscan.org/#/transaction/',
        address: 'https://tronscan.org/#/address/',
        block: 'https://tronscan.org/#/block/'
    },
    rpc: { name: 'trongrid', url: 'https://api.trongrid.io', apiKey: process.env.TRONGRID_APIKEY },
    multicall: "0x0dad23a37b53556ed32c1b9c30f875339c9d443d",
    tornadoContracts: [

    ],
    miningBlockSeconds: 3,
   

    wrapedNativToken: new Token(id,"0x891cdb91d149f23b1a45d9c5ca78a88d0cb44c18", 6, Symbol.WTRX, "WTRX" ),
  
    tokens:{
        USDT: new Token(id,"0xa614f803b6fd780986a42c78ec9c7f77e6ded13c",6, Symbol.USDT, "USDT"),
         BUSD:new Token(id,"0x83c91bfde3e6d130e286a3722f171ae49fb25047", 18, Symbol.BUSD, "BUSD" ),
         USDC:new Token(id,"0x3487b63d30b5b2c87fb7ffa8bcfade38eaac1abe", 6, Symbol.USDC, "USDC" ),
         WBTC:new Token(id,"0x84716914c0fdf7110a44030d04d0c4923504d9cc", 8, Symbol.WBTC, "WBTC" ),
     },
   


    requestsPerSecond:14,
    swapRouters:[
        {version:SwapRouterVersion.SUNSWAP_V2,factory:'', address:"0x6e0617948fe030a7e4970f8389d4ad295f249b7e", abi:sunSwapRouterV2},
        {version:SwapRouterVersion.SUNSWAP_V3,factory:'', address:"0x3c9e0ac33f138216c50638d71c344a299d0d1030", abi:sunSwapRouterV3},
    ],

}

export default Tron;
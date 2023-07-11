import "reflect-metadata";
import axios from 'axios';
import Bottleneck from 'bottleneck';
import { BigNumberish, Contract, Interface, JsonRpcProvider, TransactionReceipt, TransactionResponse, Wallet, formatEther, formatUnits, parseUnits } from 'ethers';
import erc20 from './abi/erc20';
import pancakeRouterV2 from './abi/pancake-router-v2';
import { multiCall } from './multicall/multicall';
import MULTICALL from './multicall/multicall-abi';
import { MultiCallItem } from './multicall/multicall.i';
import nets, { net } from './nets/net';
import { CurrencySymbol, NET, NetworkToken, NetworkName } from './nets/net.i';
import { TronMethods, fromHex } from './tron/tron-methods';
import { Cron, Expression } from '@reflet/cron';
import * as crypto from "./utils/crypto"
import NetParser from "./utils/net-parser"
import {formatTX, TX} from "./utils/format-tx"

const WAValidator = require('multicoin-address-validator');


export const lib = {
    nets, multiCall
}


const valid = function(net:NET|number, address:string):boolean{
    const symbol = (net as NET)?.nativeCurrency || Object.values(nets).find(x=>x.id===net)?.nativeCurrency;
    return symbol===CurrencySymbol.TRX ?  WAValidator.validate(address, 'trx') :  WAValidator.validate(address, 'eth');
}

export {
    NET, NetworkToken, NetworkName, CurrencySymbol, TX, NetParser,
    crypto, valid, net, formatTX,
}

export interface SendTokenDto {
    netId: number,
    fromPrivateKey: string,
    to: string,
    amount: number,
    token: string,
    tokenDecimals: number
}

export interface SendDto {
    netId: number,
    privateKey: string,
    to: string,
    amount: number
}

export class Blockchain {
    constructor() {
        this.updateBinancePrices();
    }

    public get nets(){
        return net;
    }

    public  getNet(id:number){
        return Object.values(net).find(x=>x.id===id);
    }
    
    private tronMethodos=[];

    private static binancePrices: { symbol: string, price: string }[] = [];

    private limiters = nets.map(x => ({
        netId: x.id,
        limiter: new Bottleneck({
            maxConcurrent: x.requestsPerSecond,
            minTime: 1000
        })
    }));

    /**
     * 
     * @param netId - network id
     * @param skipBlocks - scan block only when {skipBlocks} left after mining 
     */
    private static watchCache:NetParser[]=[];
    public watch(netId:number, skipBlocks:number=10):NetParser{
        const net = this.getNet(netId);
        if(!net) throw new Error("Network not found");
        if(Blockchain.watchCache[netId]) return Blockchain.watchCache[netId];
        const parser = new NetParser(this.getLimitter(netId), netId, net.miningBlockSeconds, skipBlocks);
        Blockchain.watchCache[netId] = parser;
        return parser;
    }

    public shortAddress(address: string, num: number = 6) {
        return address.substr(0, num) + "..." + address.substr(-num, num);
    }

    public getLimitter(netId: number) {
        const limitter = this.limiters.find(x => x.netId + '' === netId + '')?.limiter;
        return limitter;
    }

    public getConfig(netId: number): NET {
        return nets.find(x => x.id + '' === netId + '');
    }

    public async getTokensDecimals(tokens: string[], netId: number): Promise<number[]> {
        const config = this.getConfig(netId);
        const face = new Interface(erc20);
        const items: MultiCallItem[] = tokens.map(target => ({ target, method: "decimals", arguments: [], face }))
        const result = await multiCall(config, items);
        return result.decimals;
    }

    public async getAmountOut(tokenIn: string, tokenOut: string, amountIn: number, netId: number): Promise<number> {
        const decimals = await this.getTokensDecimals([tokenIn, tokenOut], netId);
        const config = this.getConfig(netId);
        const contract = new Contract(config.uniswapRouter, pancakeRouterV2)
        const amountOut = await contract.getAmountsOut(parseUnits(amountIn + '', decimals[0]), [tokenIn, tokenOut]);
        return Number(formatUnits(amountOut, decimals[1]));
    }

    public async getTokensPriceUSD(tokens: string[], netId: number) {
        const decimals = await this.getTokensDecimals(tokens, netId);
        const config = this.getConfig(netId);
        const USDT = config.tokens.find(x => x.symbol === CurrencySymbol.USDT)
        const face = new Interface(pancakeRouterV2)
        const items: MultiCallItem[] = tokens.map((address, i) => ({ target: config.uniswapRouter, method: "getAmountsOut", arguments: [parseUnits("1", decimals[i]), [address, USDT.address]], face }))
        const result = await multiCall(config, items);
        return result;
    }

    @Cron(Expression.EVERY_10_SECONDS)
    private updateBinancePrices() {
        try {
            axios.get("https://api.binance.com/api/v3/ticker/price").then(response => {
                try {
                    Blockchain.binancePrices = response.data;
                } catch (err) {
                    console.log("Biannace CUrrency error", err)
                }
            })
        } catch (err) {
            console.log("Biannace CUrrency error", err)
        }
    }

    public static getPrice(symbol: string): number {
        const price = Blockchain.binancePrices.find(x => x.symbol === symbol.toUpperCase())?.price
        return Number(price || 0)
    }

    public getPrice(symbol: string): number {
        return Blockchain.getPrice(symbol)
    }

    public async getBalanceEth(netId: number, address: string): Promise<number> {
        const config = this.getConfig(netId);
        if (config.nativeCurrency == CurrencySymbol.TRX) { // TVM
            const tronMethods = new TronMethods(config);

            return this.getLimitter(netId).schedule(() => tronMethods.getBalance(address));
        } else {//EVM
            const provider = new JsonRpcProvider(config.rpc.url);
            const balance = await this.getLimitter(netId).schedule(() => provider.getBalance(address));
            return Number(formatEther(balance))
        }
    }

    public async getBalanceUSDT(netId: number, address: string): Promise<number> {
        const config = this.getConfig(netId);
        const USDT = config.tokens.find(x => x.symbol === CurrencySymbol.USDT);
        if (config.nativeCurrency == CurrencySymbol.TRX) { // TVM
            const tronMethods = new TronMethods(config);
            const abi = [{ "constant": true, "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_upgradedAddress", "type": "address" }], "name": "deprecate", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "deprecated", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_evilUser", "type": "address" }], "name": "addBlackList", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_from", "type": "address" }, { "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "upgradedAddress", "outputs": [{ "name": "", "type": "address" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "maximumFee", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "_totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [], "name": "unpause", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "_maker", "type": "address" }], "name": "getBlackListStatus", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "paused", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_subtractedValue", "type": "uint256" }], "name": "decreaseApproval", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "who", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [{ "name": "_value", "type": "uint256" }], "name": "calcFee", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [], "name": "pause", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "owner", "outputs": [{ "name": "", "type": "address" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "who", "type": "address" }], "name": "oldBalanceOf", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "newBasisPoints", "type": "uint256" }, { "name": "newMaxFee", "type": "uint256" }], "name": "setParams", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "amount", "type": "uint256" }], "name": "issue", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_addedValue", "type": "uint256" }], "name": "increaseApproval", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "amount", "type": "uint256" }], "name": "redeem", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }, { "name": "_spender", "type": "address" }], "name": "allowance", "outputs": [{ "name": "remaining", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "basisPointsRate", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [{ "name": "", "type": "address" }], "name": "isBlackListed", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_clearedUser", "type": "address" }], "name": "removeBlackList", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "MAX_UINT", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "_blackListedUser", "type": "address" }], "name": "destroyBlackFunds", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "name": "_initialSupply", "type": "uint256" }, { "name": "_name", "type": "string" }, { "name": "_symbol", "type": "string" }, { "name": "_decimals", "type": "uint8" }], "payable": false, "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "_blackListedUser", "type": "address" }, { "indexed": false, "name": "_balance", "type": "uint256" }], "name": "DestroyedBlackFunds", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "amount", "type": "uint256" }], "name": "Issue", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "amount", "type": "uint256" }], "name": "Redeem", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "newAddress", "type": "address" }], "name": "Deprecate", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "_user", "type": "address" }], "name": "AddedBlackList", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "_user", "type": "address" }], "name": "RemovedBlackList", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "feeBasisPoints", "type": "uint256" }, { "indexed": false, "name": "maxFee", "type": "uint256" }], "name": "Params", "type": "event" }, { "anonymous": false, "inputs": [], "name": "Pause", "type": "event" }, { "anonymous": false, "inputs": [], "name": "Unpause", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "previousOwner", "type": "address" }, { "indexed": true, "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "owner", "type": "address" }, { "indexed": true, "name": "spender", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }]
            return this.getLimitter(netId).schedule(() => tronMethods.getTokenBalance(address, USDT.address, USDT.decimals, abi));
        } else {//EVM
            return 0;
        }
    }

    public getAddressFromPrivateKey(netId: number, privateKey: string) {
        const config = this.getConfig(netId);
        if (config.nativeCurrency == CurrencySymbol.TRX) { // TVM
            return TronMethods.getAddressFromPrivateKey(privateKey)
        } else {
            return new Wallet(privateKey).address;
        }
    }

    public async getBalanceEthBigNumber(netId: number, address: string): Promise<BigNumberish> {
        const config = this.getConfig(netId);
        const provider = new JsonRpcProvider(config.rpc.url);
        return await provider.getBalance(address);
    }

    public async sendAllBalance(netId: number, privateKey: string, to: string): Promise<TransactionResponse> {
        try {
            const config = this.getConfig(netId);
            const provider = new JsonRpcProvider(config.rpc.url);
            const wallet = new Wallet(privateKey, provider);

            // Get wallet balance
            const balance = await provider.getBalance(wallet.address);
            //console.log("balance", balance)

            // Get estimated gas value
            const estimatedGas = await provider.estimateGas({ to: to, value: balance });
            //console.log("gas", estimatedGas)

            // Get gas price
            const maxFeePerGas = (await provider.getFeeData()).maxFeePerGas;
            //console.log("maxFeePerGas", maxFeePerGas);

            // Get estimated transaction fee
            const estimatedTxFee = maxFeePerGas * estimatedGas;
            //console.log("fee", estimatedTxFee);

            // Get final transaction value
            const value = balance - estimatedTxFee;
            //console.log('send tx, value ', value)

            
            const tx = await this.getLimitter(netId).schedule({priority:4},()=> wallet.sendTransaction({ value, to }));
            // const receipt = await this.getLimitter(netId).schedule({priority:4},()=> tx.wait());
            return tx;
        } catch (err) {
            //console.log("ERROR SEND ALL BALANCE", err);
            return null;
        }
    }

    public async getBalances(netId: number, addresses: string[], tokens: NetworkToken[] = []): Promise<number[][]> {
        try {
            const config = this.getConfig(netId);
            if (config.nativeCurrency == CurrencySymbol.TRX) {
                if (!tokens.find(x => x.symbol === CurrencySymbol.TRX)) {
                    tokens.unshift({ symbol: CurrencySymbol.TRX, decimals: 6, address: fromHex('0x0000000000000000000000000000000000000000') })
                }
                if(!this.tronMethodos[netId])this.tronMethodos[netId]=new TronMethods(config);
                const tronMethods = this.tronMethodos[netId];
                const arr:number[] = await this.getLimitter(netId).schedule(()=>tronMethods.getBalances(addresses, tokens.map(x => x.address)));
                const res: number[][] = tokens.map(x=>[]);
                
                while(arr.length){
                    const userPart = arr.splice(0,tokens.length);
                    userPart.forEach((x,i)=>res[i].push((Number(x / Number('1e' + tokens[i].decimals)))))
                }
                
                return res;
            }

            const faceMulticall = new Interface(MULTICALL)
            const faceERC = new Interface(erc20)
            const items: MultiCallItem[] = addresses.map(address => ({ target: config.multicall, method: "getEthBalance", arguments: [address], face: faceMulticall }))
            for (let token of tokens) {
                for (let address of addresses)
                    items.push({ target: token.address, method: "balanceOf", arguments: [address], face: faceERC })
            }
            const response = await multiCall(config, items);
            if(!response.getEthBalance) return null;
            const ethBalances = response.getEthBalance[config.multicall].map(x => Number(formatEther(x)));
            const result: number[][] = [ethBalances];

            for (let token of tokens) {
                result.push(response.balanceOf[token.address].map(x => Number(formatUnits(x, token.decimals))));
            }

            return result;
        } catch (err) {
            // console.error(err, "balance checker")
            return null;
        }
    }

    public async sendToken(dto: SendTokenDto): Promise<string | null> {
        try {
            const config = nets.find(net => net.id + '' === '' + dto.netId);
            if (!config) return null;
            if (config.nativeCurrency == CurrencySymbol.TRX) { // TVM

                if(!this.tronMethodos[config.id])this.tronMethodos[config.id]=new TronMethods(config);
                const tronMethods = this.tronMethodos[config.id];
                const tx:any = await this.getLimitter(config.id).schedule({priority:4},() => tronMethods.sendToken(dto.fromPrivateKey, dto.to, dto.amount, dto.token, dto.tokenDecimals));
                return tx?.hash || null;
            } else {//EVM
                return null;
            }
        } catch (err) {
            console.log("SEND TOKEN", err.message)
            return null;
        }
    }

    public async send(dto: SendDto): Promise<string | null> {
        try {
            const config = nets.find(net => net.id + '' === '' + dto.netId);
            if (!config) return null;
            if (config.nativeCurrency == CurrencySymbol.TRX) { // TVM
                if(!this.tronMethodos[config.id])this.tronMethodos[config.id]=new TronMethods(config);
                const tronMethods = this.tronMethodos[config.id];
               
                const tx:any = await this.getLimitter(config.id).schedule({priority:4},() => tronMethods.sendTRX(dto.privateKey, dto.to, dto.amount));
                return tx?.hash || null;
            } else {//EVM
                const provider = new JsonRpcProvider(config.rpc.url);
                const wallet = new Wallet(dto.privateKey, provider);
                const tx = await this.getLimitter(config.id).schedule(() => wallet.sendTransaction({ value: formatEther(dto.amount + ''), to: dto.to }));
                return tx.hash;
            }
        } catch (err) {
            console.log("SEND ERR", err?.message || err)
            console.log(dto)
            return null
        }
    }
}


import "reflect-metadata";
import axios from 'axios';
import Bottleneck from 'bottleneck';
import { BigNumberish, Contract,ethers,Wallet,providers, BigNumber } from 'ethers';
import erc20 from './abi/erc20';
import pancakeRouterV2 from './abi/pancake-router-v2';
import { multiCall } from './multicall/multicall';
import MULTICALL from './multicall/multicall-abi';
import { MultiCallItem } from './multicall/multicall.i';
import nets, { net } from './nets/net';
import { Symbol, NET, Token, NetworkName } from './nets/net.i';
import { TronMethods, fromHex } from './tron/tron-methods';
import { Cron, Expression } from '@reflet/cron';
import * as crypto from "./utils/crypto"
import NetParser from "./utils/net-parser"
import {formatTron,formatEth, TX} from "./utils/format-tx"
import  {TransactionResponse} from "@ethersproject/abstract-provider"
import { BlockTransaction } from "./tron/interfaces";
import { TronTransaction } from "./tron/tron-methods-d";
import { constants } from "ethers";

const WAValidator = require('multicoin-address-validator');
const { Interface, formatEther, formatUnits, parseUnits} =ethers.utils;
const {JsonRpcProvider} =ethers.providers;


const lib = {
    nets, multiCall
}
 


const valid = function(net:NET|number, address:string):boolean{
    const symbol = (net as NET)?.symbol || Object.values(nets).find(x=>x.id===net)?.symbol;
    return symbol===Symbol.TRX ?  WAValidator.validate(address, 'trx') :  WAValidator.validate(address, 'eth');
}

export {
    NET, Token , NetworkName, Symbol, TX, NetParser,
    crypto, valid, net, lib
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

    public static tokensCache:Token[] = [];

    constructor() {
        this.updateBinancePrices();
    }

    public get nets(){
        return net;
    }

    public  getNet(id:number){
        return Object.values(net).find(x=>x.id===id);
    }
    
    private tronMethodos:TronMethods[]=[];

    private static binancePrices: { symbol: string, price: string }[] = [];

    private limiters = nets.map(x => ({
        netId: x.id,
        limiter: new Bottleneck({
            maxConcurrent: x.requestsPerSecond,
           minTime:1000/x.requestsPerSecond
        })
    }));

    /**
     * 
     * @param netId - network id
     * @param skipBlocks - scan block only when {skipBlocks} left after mining 
     */
    private static watchCache:NetParser[]=[];
    public watch(netId:number, skipBlocks:number=0):NetParser{
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

    /**
     * Multicall get tokens name, symbol and decimals
     * @param net 
     * @param tokens 
     * @returns 
     */
    public async getTokensInfo(net:NET|number, tokens: Lowercase<string>[], caching:boolean): Promise<Token[]> {
        if(Number.isInteger(net)) net = this.getNet(net as number) as NET;
        else net = net as NET;

        

        const detectedInCacke:Token[] = [];
        for(let t of tokens) {
            if(Blockchain.tokensCache[t]) detectedInCacke.push(Blockchain.tokensCache[t]);
        }
        if(detectedInCacke.length===tokens.length) return detectedInCacke;

        const face = new Interface(erc20);
        const decimals: MultiCallItem[] = tokens.map(target => ({ target, method: "decimals", arguments: [], face }))
        const symbol: MultiCallItem[] = tokens.map(target => ({ target, method: "symbol", arguments: [], face }))
        const name: MultiCallItem[] = tokens.map(target => ({ target, method: "name", arguments: [], face }))
        const result = await this.getLimitter(net.id).schedule(()=> multiCall(net as NET, [...decimals,...symbol, ...name]));
        console.log({result})
        const tkns = [];
        for(let t = 0; t<tokens.length;t++){
            const address = tokens[t];
            const token = {
                address,
                decimals: address===constants.AddressZero ? net.decimals : result.decimals[address][0],
                symbol: address===constants.AddressZero ? net.symbol : result.symbol[address][0],
                name: address===constants.AddressZero ? net.name : result.name[address][0]
            };
           
            if(caching) Blockchain.tokensCache[address]=token;
            tkns.push(token)
        }
        return tkns;
    }

    public async getTokensPriceUSD(tokens: Lowercase<string>[], netId: number) {
        const tkns = await this.getTokensInfo(netId, tokens,true);
        const config = this.getConfig(netId);
        const USDT = config.tokens.find(x => x.symbol === Symbol.USDT)
        const face = new Interface(pancakeRouterV2)
        const items: MultiCallItem[] = tokens.map((address, i) => ({ target: config.uniswapRouter, method: "getAmountsOut", arguments: [parseUnits("1", tkns[i].decimals), [address, USDT.address]], face }))
        const result = await this.getLimitter(netId).schedule(()=> multiCall(config, items));
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

    public async getTransaction(net:NET|number, hash:string){
        if(Number.isInteger(net)) net = this.getNet(net as number) as NET;
        else net = net as NET;
        const limitter = this.getLimitter(net.id);

        if(net.symbol===Symbol.TRX){
            return await limitter.schedule(()=>this.getTronMethods(net).getTransactionById(hash));
        }else{
            const provider = this.getProvider<ethers.providers.JsonRpcProvider>(net.id);
            return await limitter.schedule(()=> provider.getTransaction(hash))
        }
    }

    public async getTransactionReceipt(net:NET|number, hash:string){
        if(Number.isInteger(net)) net = this.getNet(net as number) as NET;
        else net = net as NET;
       
        const limitter = this.getLimitter(net.id);

        if(net.symbol===Symbol.TRX){
            return await limitter.schedule(()=>this.getTronMethods(net).getTransactionInfoById(hash));
        }else{
            const provider = this.getProvider<ethers.providers.JsonRpcProvider>(net.id);
            return await limitter.schedule(()=>provider.getTransactionReceipt(hash))
        }
    }


    public async getContractAbi(net:NET|number, contractAddress:string){
        if(Number.isInteger(net)) net = this.getNet(net as number) as NET;
        else net = net as NET;
        if(net.symbol===Symbol.TRX){
            const limitter = this.getLimitter(net.id);
            return await limitter.schedule(()=>this.getTronMethods(net).getContractAbi(contractAddress));
        }else{
            return null;
        }
    }
    


    public async getBalanceEth(net:NET| number, address: string): Promise<number> {
        if(Number.isInteger(net)) net = this.getNet(net as number) as NET;
        else net = net as NET;

        const limitter = this.getLimitter(net.id);
        if (net.symbol == Symbol.TRX) { // TVM
            const tronMethods = this.getTronMethods(net);
            return limitter.schedule(() => tronMethods.getBalance(address));
        } else {//EVM
            const provider = new JsonRpcProvider(net.rpc.url);
            const balance = await limitter.schedule(() => provider.getBalance(address));
            return Number(formatEther(balance))
        }
    }

    public async getBalanceUSDT(netId: number, address: string): Promise<number> {
        const net = this.getConfig(netId);
        const USDT = net.tokens.find(x => x.symbol === Symbol.USDT);
        if (net.symbol == Symbol.TRX) { // TVM
            const tronMethods = this.getTronMethods(net)
            const abi = [{ "constant": true, "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_upgradedAddress", "type": "address" }], "name": "deprecate", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "deprecated", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_evilUser", "type": "address" }], "name": "addBlackList", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_from", "type": "address" }, { "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "upgradedAddress", "outputs": [{ "name": "", "type": "address" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "maximumFee", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "_totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [], "name": "unpause", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "_maker", "type": "address" }], "name": "getBlackListStatus", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "paused", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_subtractedValue", "type": "uint256" }], "name": "decreaseApproval", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "who", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [{ "name": "_value", "type": "uint256" }], "name": "calcFee", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [], "name": "pause", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "owner", "outputs": [{ "name": "", "type": "address" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "who", "type": "address" }], "name": "oldBalanceOf", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "newBasisPoints", "type": "uint256" }, { "name": "newMaxFee", "type": "uint256" }], "name": "setParams", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "amount", "type": "uint256" }], "name": "issue", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_addedValue", "type": "uint256" }], "name": "increaseApproval", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "amount", "type": "uint256" }], "name": "redeem", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }, { "name": "_spender", "type": "address" }], "name": "allowance", "outputs": [{ "name": "remaining", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "basisPointsRate", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [{ "name": "", "type": "address" }], "name": "isBlackListed", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_clearedUser", "type": "address" }], "name": "removeBlackList", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "MAX_UINT", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "_blackListedUser", "type": "address" }], "name": "destroyBlackFunds", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "name": "_initialSupply", "type": "uint256" }, { "name": "_name", "type": "string" }, { "name": "_symbol", "type": "string" }, { "name": "_decimals", "type": "uint8" }], "payable": false, "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "_blackListedUser", "type": "address" }, { "indexed": false, "name": "_balance", "type": "uint256" }], "name": "DestroyedBlackFunds", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "amount", "type": "uint256" }], "name": "Issue", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "amount", "type": "uint256" }], "name": "Redeem", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "newAddress", "type": "address" }], "name": "Deprecate", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "_user", "type": "address" }], "name": "AddedBlackList", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "_user", "type": "address" }], "name": "RemovedBlackList", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "feeBasisPoints", "type": "uint256" }, { "indexed": false, "name": "maxFee", "type": "uint256" }], "name": "Params", "type": "event" }, { "anonymous": false, "inputs": [], "name": "Pause", "type": "event" }, { "anonymous": false, "inputs": [], "name": "Unpause", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "previousOwner", "type": "address" }, { "indexed": true, "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "owner", "type": "address" }, { "indexed": true, "name": "spender", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }]
            return this.getLimitter(netId).schedule(() => tronMethods.getTokenBalance(address, USDT.address, USDT.decimals, abi));
        } else {//EVM
            return 0;
        }
    }

    public getAddressFromPrivateKey(netId: number, privateKey: string) {
        const config = this.getConfig(netId);
        if (config.symbol == Symbol.TRX) { // TVM
            return TronMethods.getAddressFromPrivateKey(privateKey)
        } else {
            return new Wallet(privateKey).address;
        }
    }

    public getProvider<T>(net:NET|number, privateKey?:string):T{
        if(Number.isInteger(net)) net = this.getNet(net as number) as NET;
        else net = net as NET;
       if( net.symbol===Symbol.TRX){
            return this.tronMethodos[net.id].getProvider(privateKey) as T
       }else return new JsonRpcProvider(net.rpc.url) as T;
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
            const estimatedTxFee = maxFeePerGas.mul(estimatedGas);
            //console.log("fee", estimatedTxFee);

            // Get final transaction value
            const value = balance.sub(estimatedTxFee);
            //console.log('send tx, value ', value)
            
            const tx = await this.getLimitter(netId).schedule({priority:4},()=> wallet.sendTransaction({ value, to }));
            // const receipt = await this.getLimitter(netId).schedule({priority:4},()=> tx.wait());
            return tx;
        } catch (err) {
            //console.log("ERROR SEND ALL BALANCE", err);
            return null;
        }
    }

    public formatTX(net:NET, transaction:BlockTransaction|TransactionResponse):TX{
        return net.symbol === Symbol.TRX 
        ? formatTron(net, this, transaction as BlockTransaction)
        : formatEth(transaction as TransactionResponse);
    }

    private getTronMethods(net:NET|number):TronMethods{
        if(Number.isInteger(net)) net = this.getNet(net as number) as NET;
        else net = net as NET;
        if(!this.tronMethodos[net.id])this.tronMethodos[net.id]=new TronMethods(net);
        return this.tronMethodos[net.id];
    }

    public async getBalances(netId: number, addresses: string[], tokens: Token[] = []): Promise<number[][]> {
        try {
            const config = this.getConfig(netId);
            if (config.symbol == Symbol.TRX) {
                if (!tokens.find(x => x.symbol === Symbol.TRX)) {
                    tokens.unshift({ symbol: Symbol.TRX, decimals: 6, address: fromHex('0x0000000000000000000000000000000000000000') })
                }
                
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

            const response = await this.getLimitter(netId).schedule(()=>multiCall(config, items));
            if(!response.getEthBalance) return null;
            const ethBalances = response.getEthBalance[config.multicall].map(x => Number(formatEther(x)));
            const result: number[][] = [ethBalances];

            for (let token of tokens) {
                if(token.address===constants.AddressZero)continue;
                result.push(response.balanceOf[token.address].map(x => Number(formatUnits(x, token.decimals))));
            }

            return result;
        } catch (err) {
            console.error(err, "balance checker")
            return null;
        }
    }

    public async sendToken(dto: SendTokenDto): Promise<string | null> {
        try {
            const net = nets.find(net => net.id + '' === '' + dto.netId);
            if (!net) return null;
            if (net.symbol == Symbol.TRX) { // TVM
                const tronMethods = this.getTronMethods(net)
                const tx:any = await this.getLimitter(net.id).schedule({priority:4},() => tronMethods.sendToken(dto.fromPrivateKey, dto.to, dto.amount, dto.token, dto.tokenDecimals));
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
            const net = nets.find(net => net.id + '' === '' + dto.netId);
            if (!net) return null;
            if (net.symbol == Symbol.TRX) { // TVM
                const tronMethods = this.getTronMethods(net)
                const tx:any = await this.getLimitter(net.id).schedule({priority:4},() => tronMethods.sendTRX(dto.privateKey, dto.to, dto.amount));
                return tx?.hash || null;
            } else {//EVM
                const provider = new JsonRpcProvider(net.rpc.url);
                const wallet = new Wallet(dto.privateKey, provider);
                const tx = await this.getLimitter(net.id).schedule(() => wallet.sendTransaction({ value: formatEther(dto.amount + ''), to: dto.to }));
                return tx.hash;
            }
        } catch (err) {
            console.log("SEND ERR", err?.message || err)
            console.log(dto)
            return null
        }
    }


    public getUniswapContract(net:NET|number, privateKey?:string){
        if(Number.isInteger(net)) net = this.getNet(net as number) as NET;
        else net = net as NET;
        if(net.symbol===Symbol.TRX){
            throw new Error("Network not Supported")
        }else{
            const provider = this.getProvider<providers.JsonRpcProvider>(net);
            return privateKey
            ? new Contract(net.uniswapRouter, pancakeRouterV2, new Wallet(privateKey, provider))
            : new Contract(net.uniswapRouter, pancakeRouterV2, provider)
        }
    }


    public async swapETHForExactTokens(net:NET|number, privateKey:string, value:BigNumber, amountOut:BigNumber, path:string[],to:string,deadline?:number):Promise<TransactionResponse | TronTransaction>{
            const contract = this.getUniswapContract(net, privateKey);
            if(!deadline)deadline=new Date().getTime();
            return await contract.swapETHForExactTokens(amountOut, path, to, deadline, {value});
    }


    public async swapExactETHForTokens(net:NET|number, privateKey:string, value:BigNumber, amountOutMin:BigNumber, path:string[],to?:string,deadline?:number):Promise<TransactionResponse | TronTransaction>{
            const contract = this.getUniswapContract(net, privateKey);
            if(!deadline)deadline=new Date().getTime();
            return await contract.swapETHForExactTokens(amountOutMin, path, to, deadline, {value});
    }



    public async swapExactTokensForTokens(net:NET|number, privateKey:string, amountIn:BigNumber, amountOutMin:BigNumber, path:string[],to?:string,deadline?:number):Promise<TransactionResponse | TronTransaction>{
            const contract = this.getUniswapContract(net, privateKey);
            if (!deadline) deadline=new Date().getTime();
            return await contract.swapETHForExactTokens(amountIn, amountOutMin, path, to, deadline);
    }



    public async swapTokensForExactTokens(net:NET|number, privateKey:string, amountOut:BigNumber, amountInMax:BigNumber, path:string[],to?:string,deadline?:number):Promise<TransactionResponse | TronTransaction>{
            const contract = this.getUniswapContract(net, privateKey);
            if (!deadline) deadline=new Date().getTime();
            return await contract.swapETHForExactTokens(amountOut, amountInMax, path, to, deadline);
    }


    public async swapTokensForExactETH(net:NET|number, privateKey:string, amountOut:BigNumber, amountInMax:BigNumber, path:string[],to?:string,deadline?:number):Promise<TransactionResponse | TronTransaction>{
            const contract = this.getUniswapContract(net, privateKey);
            if (!deadline) deadline=new Date().getTime();
            return await contract.swapETHForExactTokens(amountOut, amountInMax, path, to, deadline);
    }



    public async swapExactTokensForETH(net:NET|number, privateKey:string, amountIn:BigNumber, amountOutMin:BigNumber, path:string[],to?:string,deadline?:number):Promise<TransactionResponse | TronTransaction>{
            const contract = this.getUniswapContract(net, privateKey);
            if (!deadline) deadline=new Date().getTime();
            return await contract.swapETHForExactTokens(amountIn, amountOutMin, path, to, deadline);
    }

    public async approveToken<T>(net:NET|number, privateKey:string, tokenAddress:string, spender:string, amount:number):Promise<T>{
        if(Number.isInteger(net)) net = this.getNet(net as number) as NET;
        else net = net as NET;
        if(net.symbol===Symbol.TRX){
            return null;
        }else{
            const provider = this.getProvider<providers.JsonRpcProvider>(net);
            const wallet = new Wallet(privateKey, provider)
            const contract = new Contract(tokenAddress, erc20, wallet);
            return await contract.approve(spender, amount);
        }
    }

    public async getAmountsIn(net:NET|number, amountOut:BigNumberish, path:string[]):Promise<BigNumberish[]>{
        return await this.getUniswapContract(net).getAmountsIn(amountOut, path);
    }

    public async getAmountsOut(net:NET|number, amountIn:BigNumberish, path:string[]):Promise<BigNumberish[]>{
        return await this.getUniswapContract(net).getAmountsOut(amountIn, path);
    }

    public async getAmountIn(net:NET|number, amountOut:BigNumberish, reserveIn:BigNumberish, reserveOut:BigNumberish):Promise<BigNumberish>{
        return await this.getUniswapContract(net).getAmountIn(amountOut, reserveIn, reserveOut);
    }

    public async getAmountOut(net:NET|number, amountIn:BigNumberish, reserveIn:BigNumberish, reserveOut:BigNumberish):Promise<BigNumberish>{
        return await this.getUniswapContract(net).etAmountOut(amountIn, reserveIn, reserveOut);
    }


}


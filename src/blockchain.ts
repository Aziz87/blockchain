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
import { Symbol, NET, Token, NetworkName, SwapRouterVersion } from './nets/net.i';
import { TronMethods, fromHex } from './tron/tron-methods';
import { Cron, Expression } from '@reflet/cron';
import * as crypto from "./utils/crypto"
import NetParser from "./utils/block-parser"
import {formatTron,formatEth, TX, formatLog} from "./utils/format-tx"
import  {TransactionResponse} from "@ethersproject/abstract-provider"
import { BlockInfo, BlockTransaction } from "./tron/interfaces";
import { TronTransaction } from "./tron/tron-methods-d";
import { constants } from "ethers";
import TronWeb from "tronweb";
import {BlockWithTransactions,Log,Block} from "@ethersproject/abstract-provider"
import { quoteExactInputSingle, quoteExactOutputSingle } from "./utils/quoter";
import { NonceManager } from "@ethersproject/experimental";

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
    NET, Token , NetworkName, Symbol, TX, NetParser, ethers, TronWeb,
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

export const events = {
     NEW_TRANSACTIONS: "NEW_TRANSACTIONS",
     NEW_LOGS: "NEW_LOGS",
}



export const low=function(str:string):Lowercase<string>{
    return str.toLowerCase() as Lowercase<string>
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
    public watch(netId:number, logs:boolean):NetParser{
        const net = this.getNet(netId);
        if(!net) throw new Error("Network not found");
        if(Blockchain.watchCache[netId]) return Blockchain.watchCache[netId];
        const parser = new NetParser(this, net, logs);
        Blockchain.watchCache[netId] = parser;
        return parser;
    }



    private nonceManagers:NonceManager[][]=[];

    public getNonceManager(netId:number, signer: Wallet):NonceManager {
        if(!this.nonceManagers[netId])this.nonceManagers[netId]=[];
        if(!this.nonceManagers[netId][signer.address.toLowerCase()])this.nonceManagers[netId][signer.address.toLowerCase()]=new NonceManager(signer);
        return this.nonceManagers[netId][signer.address.toLowerCase()];
    }



    public shortAddress(address: string, num: number = 6) {
        return address.substr(0, num) + "..." + address.substr(-num, num);
    }

    public getLimitter(net:NET | number) {
        if(Number.isInteger(net)) net = this.getNet(net as number) as NET;
        else net = net as NET;

        const limitter = this.limiters.find(x => x.netId + '' === (net as NET).id + '')?.limiter;
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
    public async getTokensInfo(net:NET|number, tokens: string[], caching:boolean): Promise<Token[]> {
        if(Number.isInteger(net)) net = this.getNet(net as number) as NET;
        else net = net as NET;

        const detectedInCacke:Token[] = [];
        for(let t of tokens) {
            if(Blockchain.tokensCache[t]) detectedInCacke.push(Blockchain.tokensCache[t]);
        }

        if(detectedInCacke.length===tokens.length) return detectedInCacke;

        if(net.symbol===Symbol.TRX){
            const results = await this.getLimitter(net.id).schedule(()=> this.getTronMethods(net).getTokensInfo(tokens));    
            if(caching) for(let token of results) Blockchain.tokensCache[token.address]=token;
            return results;
        }

        const face = new Interface(erc20);
        const decimals: MultiCallItem[] = tokens.map(target => ({ target, method: "decimals", arguments: [], face }))
        const symbol: MultiCallItem[] = tokens.map(target => ({ target, method: "symbol", arguments: [], face }))
        const name: MultiCallItem[] = tokens.map(target => ({ target, method: "name", arguments: [], face }))

        const result = await this.getLimitter(net.id).schedule(()=> multiCall(net as NET, [...decimals,...symbol, ...name]));
        const tkns = [];
        for(let t = 0; t<tokens.length;t++){
            const address = tokens[t];
            let decimals = 0;
            let symbol = "";
            let name = "";
            try{decimals=(address===constants.AddressZero) ? net.decimals : result.decimals[address][0]}catch(err){}//{console.log(err)}
            try{symbol=(symbol===constants.AddressZero) ? net.symbol : result.symbol[address][0]}catch(err){}//{console.log(err)}
            try{name=(address===constants.AddressZero) ? net.name : result.name[address][0]}catch(err){}//{console.log(err)}
            const token = {
                address,
                decimals,
                symbol,
                name
            };
           
            if(caching) Blockchain.tokensCache[address]=token;
            tkns.push(token)
        }
        return tkns;
    }


    /**
     * @deprecated use getPricesUSDT
     * @param tokens 
     * @param netId 
     * @returns 
     */
    public async getTokensPriceUSD(tokens: Lowercase<string>[], netId: number) {
        const tkns = await this.getTokensInfo(netId, tokens,true);
        const config = this.getConfig(netId);
        const USDT = config.tokens.find(x => x.symbol === Symbol.USDT)
        const face = new Interface(pancakeRouterV2)
        const target = config.swapRouters.find(x=>x.version===SwapRouterVersion.UNISWAP_V2)?.address;
        if(!target) throw new Error(`Router UNISWAP_V2 not found for network ${config.name}`);
        const items: MultiCallItem[] = tokens.map((address, i) => ({ target, method: "getAmountsOut", arguments: [parseUnits("1", tkns[i].decimals), [address, USDT.address]], face }))
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

    public static getPriceFromBinance(symbol: string): number {
        const price = Blockchain.binancePrices.find(x => x.symbol === symbol.toUpperCase())?.price
        return Number(price || 0)
    }

    public getPriceFromBinance(symbol: string): number {
        return Blockchain.getPriceFromBinance(symbol)
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


  
    

    public formatTX(net:NET, transaction:BlockTransaction|TransactionResponse|Log):TX{
        if((transaction as Log)?.topics) return formatLog(transaction as Log); 
        return net.symbol === Symbol.TRX 
        ? formatTron(transaction as BlockTransaction)
        : formatEth(transaction as TransactionResponse);
    }

    public getTronMethods(net:NET|number):TronMethods{
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
                
                const tronMethods = this.getTronMethods(netId)
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

    // public async sendToken(dto: SendTokenDto): Promise<string | null> {
    //     try {
    //         const net = nets.find(net => net.id + '' === '' + dto.netId);
    //         if (!net) return null;
    //         if (net.symbol == Symbol.TRX) { // TVM
    //             const tronMethods = this.getTronMethods(net)
    //             const tx:any = await this.getLimitter(net.id).schedule({priority:4},() => tronMethods.sendToken(dto.fromPrivateKey, dto.to, dto.amount, dto.token, dto.tokenDecimals));
    //             return tx?.hash || null;
    //         } else {//EVM
    //             return null;
    //         }
    //     } catch (err) {
    //         console.log("SEND TOKEN", err.message)
    //         return null;
    //     }
    // }


    // public async send(dto: SendDto): Promise<string | null> {
    //     try {
    //         const net = nets.find(net => net.id + '' === '' + dto.netId);
    //         if (!net) return null;
    //         if (net.symbol == Symbol.TRX) { // TVM
    //             const tronMethods = this.getTronMethods(net)
    //             const tx:any = await this.getLimitter(net.id).schedule({priority:4},() => tronMethods.sendTRX(dto.privateKey, dto.to, dto.amount));
    //             return tx?.hash || null;
    //         } else {//EVM
    //             const provider = new JsonRpcProvider(net.rpc.url);
    //             const wallet = new Wallet(dto.privateKey, provider);
    //             const nonce = await this.getNonceAndUp(net,wallet.address);
    //             const tx = await this.getLimitter(net.id).schedule(() => wallet.sendTransaction({ value: formatEther(dto.amount + ''), to: dto.to, nonce }));
    //             return tx.hash;
    //         }
    //     } catch (err) {
    //         console.log("SEND ERR", err?.message || err)
    //         console.log(dto)
    //         return null
    //     }
    // }


    public async calcFee(net: NET, token: Token, privateKey: string, amount: number, to: string): Promise<ethers.BigNumber> {
        const provider = this.getProvider<ethers.providers.JsonRpcProvider>(net, privateKey);
        const gasPrice = await this.getLimitter(net).schedule(() => provider.getGasPrice());
        const wallet = new ethers.Wallet(privateKey, provider);

        try {
            if (net.symbol === token.symbol) {
                const gasLimit = ethers.BigNumber.from(21000);
                return gasLimit.mul(gasPrice);
            } else {
                const value = ethers.BigNumber.from(ethers.utils.parseUnits(amount.toFixed(18), token.decimals))
                const gasLimit = await this.getLimitter(net).schedule(() => this.getERC20Contract(token).connect(wallet).estimateGas.transfer(to, value))
                return gasLimit.mul(gasPrice);
            }
        } catch (err) {
            console.log(err);
        }
        return null;
    }


    public getERC20Contract(token: Token): ethers.Contract {
        return new ethers.Contract(token.address, erc20)
    }


    public async send(net: NET, token: Token, privateKey: string, amount: number, to: string, nativeBalanceBN?: ethers.BigNumber, fee?: ethers.BigNumber): Promise<ethers.providers.TransactionResponse> {

        const provider = this.getProvider<ethers.providers.JsonRpcProvider>(net, privateKey);
        const wallet = this.getNonceManager(net.id,new ethers.Wallet(privateKey, provider));
        

        if (token.address===ethers.constants.AddressZero) {
            let value = ethers.BigNumber.from(ethers.utils.parseUnits(amount.toFixed(18), token.decimals))
            if (nativeBalanceBN) {
                if (!fee) fee = await this.calcFee(net, token, privateKey, amount, to);
                if ((value.add(fee)).gt(nativeBalanceBN)) value = nativeBalanceBN.sub(fee);
            }
            try {
                return await this.getLimitter(net).schedule(() => wallet.sendTransaction({ to, value }))
            } catch (err) {
                console.log(err.message);
            }
        } else {
            const value = ethers.BigNumber.from(ethers.utils.parseUnits(amount.toFixed(18), token.decimals))
            try {
                return await this.getLimitter(net).schedule(() => this.getERC20Contract(token).connect(wallet).transfer(to, value))
            } catch (err) {
                console.log(err.message);
            }
        }
        return null;
    }

    public async getBlock(net:NET, blockNumber: number, toBlockNumber?: number):Promise<BlockWithTransactions | BlockInfo[]> {
        if (net.symbol === Symbol.TRX) return await this.getLimitter(net.id).schedule(() => this.tronMethodos[net.id].getBlockRange(blockNumber, toBlockNumber))
        else return await this.getLimitter(net.id).schedule(()=>this.getProvider<ethers.providers.JsonRpcProvider>(net).getBlockWithTransactions(blockNumber));
    }
    

    public async getBlockNumber(net:NET):Promise<number> {
        if (net.symbol === Symbol.TRX) return await this.getLimitter(net.id).schedule(() => this.tronMethodos[net.id].getBlockNumber())
        else return await this.getLimitter(net.id).schedule(()=>this.getProvider<ethers.providers.JsonRpcProvider>(net).getBlockNumber());
    }

    public async getLogs(net:NET, fromBlock: number, toBlock?: number, address?:string, topics?:string[]):Promise<Log[]> {
        return await this.getLimitter(net.id).schedule(()=>this.getProvider<ethers.providers.JsonRpcProvider>(net).getLogs({
            fromBlock, toBlock, address, topics
        }));
    }

    public getSwapRouterContract(net:NET|number, privateKey?:string, version:SwapRouterVersion=SwapRouterVersion.UNISWAP_V2){
        if(Number.isInteger(net)) net = this.getNet(net as number) as NET;
        else net = net as NET;
        if(net.symbol===Symbol.TRX){
            throw new Error("Network not Supported")
        }else{
            const provider = this.getProvider<providers.JsonRpcProvider>(net);
            const router = net.swapRouters.find(x=>x.version===version);
            if(!router) throw new Error(`Router ${version} not found for network ${net.name}`);

            return privateKey
            ? new Contract(router.address, pancakeRouterV2,  this.getNonceManager(net.id,new Wallet(privateKey, provider)))
            : new Contract(router.address, pancakeRouterV2, provider)
        }
    }


    public async swapETHForExactTokens(net:NET|number, privateKey:string, value:BigNumber, amountOut:BigNumber, path:string[],to:string,deadline?:number, router:SwapRouterVersion=SwapRouterVersion.UNISWAP_V2):Promise<TransactionResponse >{
            const contract = this.getSwapRouterContract(net, privateKey, router);
            if(!deadline)deadline=new Date().getTime();
            return this.getLimitter(net).schedule(contract.swapETHForExactTokens(amountOut, path, to, deadline, {value}));
    }


    public async swapExactETHForTokens(net:NET|number, privateKey:string, value:BigNumber, amountOutMin:BigNumber, path:string[],to?:string,deadline?:number, router:SwapRouterVersion=SwapRouterVersion.UNISWAP_V2):Promise<TransactionResponse | TronTransaction>{
            const contract = this.getSwapRouterContract(net, privateKey,router);
            if(!deadline)deadline=new Date().getTime();
            return this.getLimitter(net).schedule(contract.swapExactETHForTokens(amountOutMin, path, to, deadline, {value}));
    }



    public async swapExactTokensForTokens(net:NET|number, privateKey:string, amountIn:BigNumber, amountOutMin:BigNumber, path:string[],to?:string,deadline?:number, router:SwapRouterVersion=SwapRouterVersion.UNISWAP_V2):Promise<TransactionResponse | TronTransaction>{
            const contract = this.getSwapRouterContract(net, privateKey,router);
            if (!deadline) deadline=new Date().getTime();
            return this.getLimitter(net).schedule(contract.swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline));
    }



    public async swapExactTokensForTokensSupportingFeeOnTransferTokens(net:NET|number, privateKey:string, amountIn:BigNumber, amountOutMin:BigNumber, path:string[],to?:string,deadline?:number, router:SwapRouterVersion=SwapRouterVersion.UNISWAP_V2):Promise<TransactionResponse | TronTransaction>{
            const contract = this.getSwapRouterContract(net, privateKey,router);
            if (!deadline) deadline=new Date().getTime();
            return this.getLimitter(net).schedule(()=>contract.swapExactTokensForTokensSupportingFeeOnTransferTokens(amountIn, amountOutMin, path, to, deadline));
    }



    public async swapTokensForExactTokens(net:NET|number, privateKey:string, amountOut:BigNumber, amountInMax:BigNumber, path:string[],to?:string,deadline?:number, router:SwapRouterVersion=SwapRouterVersion.UNISWAP_V2):Promise<TransactionResponse | TronTransaction>{
            const contract = this.getSwapRouterContract(net, privateKey,router);
            if (!deadline) deadline=new Date().getTime();
            return this.getLimitter(net).schedule(()=>contract.swapTokensForExactTokens(amountOut, amountInMax, path, to, deadline));
    }


    public async swapTokensForExactETH(net:NET|number, privateKey:string, amountOut:BigNumber, amountInMax:BigNumber, path:string[],to?:string,deadline?:number, router:SwapRouterVersion=SwapRouterVersion.UNISWAP_V2):Promise<TransactionResponse | TronTransaction>{
            const contract = this.getSwapRouterContract(net, privateKey,router);
            if (!deadline) deadline=new Date().getTime();
            return this.getLimitter(net).schedule(contract.swapTokensForExactETH(amountOut, amountInMax, path, to, deadline));
    }



    public async swapExactTokensForETH(net:NET|number, privateKey:string, amountIn:BigNumber, amountOutMin:BigNumber, path:string[],to?:string,deadline?:number, router:SwapRouterVersion=SwapRouterVersion.UNISWAP_V2):Promise<TransactionResponse | TronTransaction>{
            const contract = this.getSwapRouterContract(net, privateKey,router);
            if (!deadline) deadline=new Date().getTime();
            return this.getLimitter(net).schedule(contract.swapExactTokensForETH(amountIn, amountOutMin, path, to, deadline));
    }

    public async getAllowance(net:NET|number, tokenAddress:string, ownerAddress: string, spenderAddress: string ): Promise<BigNumberish> {
        if(Number.isInteger(net)) net = this.getNet(net as number) as NET;
        else net = net as NET;

        const limitter = this.getLimitter(net.id);
        if (net.symbol == Symbol.TRX) { // TVM
            const tronMethods = this.getTronMethods(net);
            return limitter.schedule(() => tronMethods.allowance(tokenAddress, ownerAddress, spenderAddress));
        } else {//EVM
            const provider = this.getProvider<providers.JsonRpcProvider>(net);
            const contract = new Contract(tokenAddress, erc20, provider);
            return await limitter.schedule(()=>contract.allowance(ownerAddress, spenderAddress));
        }
        
    }

    public async approveToken<T>(net:NET|number, privateKey:string, tokenAddress:string, spender:string, amount:BigNumber=constants.MaxUint256):Promise<T>{
        if(Number.isInteger(net)) net = this.getNet(net as number) as NET;
        else net = net as NET;

        const limitter = this.getLimitter(net.id);
        if(net.symbol===Symbol.TRX){
            const tronMethods = this.getTronMethods(net);
            return limitter.schedule(() => tronMethods.approve(privateKey,tokenAddress,spender,amount));
        }else{
            const provider = this.getProvider<providers.JsonRpcProvider>(net);
            const wallet =  this.getNonceManager(net.id,new Wallet(privateKey, provider));
            const contract = new Contract(tokenAddress, erc20, wallet);
            return  await limitter.schedule(()=>contract.approve(spender, amount));
        }
    }




    public async getUniswapV3quoteExactInputSingle(net:NET|number, tokenIn:Lowercase<string>, tokenOut:Lowercase<string>, amountIn:BigNumberish, fee:BigNumberish="3000",sqrtPriceLimitX96:BigNumberish="0" ){
        if(Number.isInteger(net)) net = this.getNet(net as number) as NET;
        else net = net as NET;
        return await quoteExactInputSingle(this, net, tokenIn, tokenOut, amountIn, fee, sqrtPriceLimitX96)
    }


    public async getUniswapV3quoteExactOutputSingle(net:NET|number, tokenIn:Lowercase<string>, tokenOut:Lowercase<string>, amountIn:BigNumberish, fee:BigNumberish="3000",sqrtPriceLimitX96:BigNumberish="0" ){
        if(Number.isInteger(net)) net = this.getNet(net as number) as NET;
        else net = net as NET;
        return await quoteExactOutputSingle(this, net, tokenIn, tokenOut, amountIn, fee, sqrtPriceLimitX96)
    }


    public async getAmountsAndPath(net:NET|number,  tokenIn:string, tokenOut:string, amount:BigNumberish, method:"getAmountsIn"|"getAmountsOut"):Promise<{path:string[], amounts:BigNumberish[]}>{
        if(Number.isInteger(net)) net = this.getNet(net as number) as NET;
        else net = net as NET;
        
        const pathVariants = [
            [tokenIn, tokenOut],
            [tokenIn, net.wrapedNativToken.address, tokenOut],
            [tokenIn,  net.wrapedNativToken.address, net.tokens.find(x=>x.symbol==="BUSD").address, tokenOut],
            [tokenIn,  net.wrapedNativToken.address, net.tokens.find(x=>x.symbol==="USDT").address, tokenOut],
            [tokenIn,  net.wrapedNativToken.address, net.tokens.find(x=>x.symbol==="WBTC").address, tokenOut],
            [tokenIn,  net.wrapedNativToken.address, net.tokens.find(x=>x.symbol==="WETH").address, tokenOut],
            [tokenIn, net.tokens.find(x=>x.symbol==="USDT").address, net.wrapedNativToken.address, tokenOut]
        ]

        const target = net.swapRouters.find(x=>x.version===SwapRouterVersion.UNISWAP_V2).address;
        const face = new Interface(pancakeRouterV2)

        const items: MultiCallItem[] = pathVariants.map((path, i) => ({ target, method, arguments: [amount,path], face }))
        const result = await this.getLimitter(net.id).schedule(()=> multiCall(net as NET, items));

        const _data = result[method][target];
        // console.log(_data.map(x=>x?.map(a=>a/1e18)))
        const data:{x:BigNumber[],i:number}[]= !_data? [] :_data.map((x:BigNumberish[],i:number)=>(!x?null:{x:x.map(y=>BigNumber.from(y)),i}));

        const variant = method==="getAmountsIn"
            ?data.filter(x=>x).sort((a,b)=>a.x[0].lt(b.x[0]) ? -1 : 1)[0]
            :data.filter(x=>x).sort((a,b)=>a.x[a.x.length-1].gt(b.x[b.x.length-1]) ? -1 : 1)[0]

        const path = variant ? pathVariants[variant.i] : pathVariants[0];
        const amounts = variant ? variant.x : [method==="getAmountsIn"?0:amount, method==="getAmountsOut"?0:amount];

        return {path, amounts}
    }




    public async getPricesUSDT(_net:NET|number,  tokens:Token[]):Promise<number[]>{
        const net = Number.isInteger(_net) ? this.getNet(_net as number) as NET : _net as NET;
        
        

        const USDT = net.tokens.find(x=>x.symbol==="USDT");

        if(!USDT) throw new Error(`PLEASE ADD USDT TOKEN FOR ${net.name} network. net.tokens.push({symbol:"USDT", decimals:..., address:..., name:"USDT Token"})`);



        let BUSD = net.tokens.find(x=>x.symbol==="BUSD") || USDT
        // const pathVariants = tokens.map((token,i)=>({
        //     path:[
        //         [token.address, USDT.address],
        //         [token.address, net.wrapedNativToken.address, USDT.address],
        //     ],
        //     key:i
        // }))

        const target = net.swapRouters.find(x=>x.version===SwapRouterVersion.UNISWAP_V2).address;
        const face = new Interface(pancakeRouterV2)

        const method = "getAmountsOut";
        const multipler =1;

        const items: any[] = tokens.map((token, i) => {
            if(token.address===ethers.constants.AddressZero)token.address=net.wrapedNativToken.address;
            return[
            { index: i, target, token, method, arguments: [ethers.utils.parseUnits(multipler+"",USDT.decimals),[ USDT.address, net.wrapedNativToken.address, token.address]], face },
            { index: i, target, token, method, arguments: [ethers.utils.parseUnits(multipler+"",USDT.decimals),[ USDT.address, token.address]], face },
            { index: i, target, token, method, arguments: [ethers.utils.parseUnits(multipler+"",USDT.decimals),[ USDT.address, BUSD.address, net.wrapedNativToken.address, token.address]], face },
            { index: i, target, token, method, arguments: [ethers.utils.parseUnits(multipler+"",USDT.decimals),[ USDT.address, net.wrapedNativToken.address, BUSD.address, token.address]], face },
            { index: i, target, token, method, arguments: [ethers.utils.parseUnits(multipler+"",USDT.decimals),[ USDT.address, BUSD.address,  token.address]], face },
        ]}).reduce((a,b)=>[...a,...b],[]);


        const result = await this.getLimitter(net.id).schedule(()=> multiCall(net as NET, items));

        const data = result[method][target];
        const results= tokens.map(x=>0)

    
        for(let i =0; i<data.length;i++){
            if(data[i]){
                const item = items[i]
                if(item?.token){
                    const amounts = data[i]
                    const result =multipler/ Number(ethers.utils.formatUnits(amounts[amounts.length-1], item.token.decimals))
                    if(item.token.address===USDT.address) results[item.index]=1;
                    else {
                        if(results[item.index])continue;//results[item.index]=Math.min(result,results[item.index])
                        else results[item.index]= result;
                    }
                    // console.log( item.token.symbol, result,data[i], item.arguments[1] )
                }
            }//else console.log("NO PATH",items[i].arguments[1])
        }

        return results;
    
    }


    /**
     * 
     * @deprecated use getAmountsAndPath
     * @param net 
     * @param amountOut 
     * @param tokenIn 
     * @param tokenOut 
     * @param routerVersion 
     * @returns 
     */
    public async getAmountsIn(net:NET|number, amountOut:BigNumberish, tokenIn:string, tokenOut:string, routerVersion:SwapRouterVersion=SwapRouterVersion.UNISWAP_V2):Promise<BigNumberish[]>{
        
        if(Number.isInteger(net)) net = this.getNet(net as number) as NET;
        else net = net as NET;
        const quoters = net.swapRouters.find(x=>x.version===routerVersion)?.quoters;
        if(quoters && quoters.length){
            const quoter = quoters.sort((a,b)=>a.v>b.v?-1:1)[0];
            return [(await this.getUniswapV3quoteExactOutputSingle(net,low(tokenIn), low(tokenOut), amountOut, quoter.supportedFees[0]))?.amountIn, amountOut]
        }


        const cool = await this.getAmountsAndPath(net,tokenIn,tokenOut,amountOut,"getAmountsIn");
        return cool.amounts

        //  return await this.getSwapRouterContract(net,undefined,routerVersion).getAmountsIn(amountOut, [tokenIn, tokenOut]);
    }


    /**
     * @deprecated use getAmountsAndPath
     * @param net 
     * @param amountIn 
     * @param tokenIn 
     * @param tokenOut 
     * @param router 
     * @returns 
     */
    public async getAmountsOut(net:NET|number, amountIn:BigNumberish, tokenIn:string, tokenOut:string, router:SwapRouterVersion|undefined=SwapRouterVersion.UNISWAP_V2):Promise<BigNumberish[]>{
        if(Number.isInteger(net)) net = this.getNet(net as number) as NET;
        else net = net as NET;
        const quoters = net.swapRouters.find(x=>x.version===router)?.quoters;
        if(quoters && quoters.length){
            const quoter = quoters.sort((a,b)=>a.v>b.v?-1:1)[0];
            return [amountIn,   (await this.getUniswapV3quoteExactInputSingle(net,low(tokenIn), low(tokenOut),amountIn, quoter.supportedFees[0]))?.amountOut]
        }


        const cool = await this.getAmountsAndPath(net,tokenIn,tokenOut,amountIn,"getAmountsOut");
        return cool.amounts
        // return await this.getSwapRouterContract(net,undefined,router).getAmountsOut(amountIn, [tokenIn, tokenOut]);
    }

    public async getAmountIn(net:NET|number, amountOut:BigNumberish, reserveIn:BigNumberish, reserveOut:BigNumberish, router:SwapRouterVersion=SwapRouterVersion.UNISWAP_V2):Promise<BigNumberish>{
        return await this.getSwapRouterContract(net,undefined,router).getAmountIn(amountOut, reserveIn, reserveOut);
    }

    public async getAmountOut(net:NET|number, amountIn:BigNumberish, reserveIn:BigNumberish, reserveOut:BigNumberish, router:SwapRouterVersion=SwapRouterVersion.UNISWAP_V2):Promise<BigNumberish>{
        return await this.getSwapRouterContract(net,undefined,router).etAmountOut(amountIn, reserveIn, reserveOut);
    }



}


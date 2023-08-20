import axios from "axios";
import * as TronWeb from "tronweb";
import {BigNumber, Contract, utils} from "ethers"
import { NET } from "../nets/net.i";
import { BlockInfo } from "./interfaces";
import { TronTransactionInfo, TronHistoryElement, TronTransaction } from "./tron-methods-d"
import erc20 from "../abi/erc20";
import TronNile from "../nets/tron-nileex.net";
import { MultiCallItem } from "../multicall/multicall.i";
import MulticallAbi from "../multicall/multicall-abi";
import { Token } from "../blockchain";


export function toHex(str) {
    return TronWeb.address.toHex(str);
}
export function fromHex(str) {
    return TronWeb.address.fromHex(str);
}

export class TronMethods {
    private tronWeb:TronWeb;
    private net: NET;
    constructor(net: NET) {
        this.net = net;
        this.tronWeb = new TronWeb({
            fullHost: net.rpc.url,
            solidityNode: net.rpc.url,
            headers: { "TRON-PRO-API-KEY": net.rpc.apiKey },
        });
    }


    public getProvider(privateKey) {
        this.tronWeb.privateKey=privateKey;
        return this.tronWeb;
    }

    async sendTRX(
        privateKeyFrom: string,
        to: string,
        amount: number
    ): Promise<{ hash: string; amount: number }> {

        const tronWeb = this.getProvider(privateKeyFrom);

        const gasPrice = await this.getGasPrice();
        const gasLimit = 30000;
        const fee = (gasPrice * gasLimit) / 1e6;
        const from = tronWeb.address.fromPrivateKey(privateKeyFrom);

        // console.log("FEE " + fee + ", amount " + amount + " gasPrice " + gasPrice + ", gasLimit " + gasLimit, "TRX")
        // console.log({ to, amount: tronWeb.toSun(amount), from, privateKeyFrom });
        const tradeobj = await tronWeb.transactionBuilder.sendTrx(
            to,
            tronWeb.toSun(amount),
            from
        );
        const signedtxn = await tronWeb.trx.sign(tradeobj, privateKeyFrom);
        try {
            const receipt = await tronWeb.trx.sendRawTransaction(signedtxn);
            if (receipt.transaction)
                return { hash: receipt.transaction.txID, amount };
            else throw new Error("TRON TRANSACTION FAILED");
        } catch (e) {
            console.error("ERROR TRON trx", e);
            throw new Error(e);
        }
    }

    async sendToken(
        privateKey: string,
        to: string,
        amount: number,
        tokenAddress: string,
        tokenDecimals: number
    ): Promise<{ hash: string; amount: number }> {


        const tronWeb =  new TronWeb({
            fullHost: this.net.rpc.url,
            solidityNode: this.net.rpc.url,
            headers: { "TRON-PRO-API-KEY": this.net.rpc.apiKey },
            privateKey
        });
        
        // console.log("amount " + amount + " gasPrice " + gasPrice + ", gasLimit " + gasLimit, "TRX")
        try {
            const { transfer } = await tronWeb.contract().at(tokenAddress);
            const value = (amount * Number("1e" + tokenDecimals)).toFixed();
            const hash = await transfer(to, value).send();
            return { hash, amount };
        } catch (error) {
            console.error("ERROR TRON token transfer");
            throw new Error(error);
        }
    }

    async getBalance(address: string) {
        return (
            (await this.tronWeb.trx.getAccount(address)).balance / Number("1e" + 6)
        );
    }

    async getTokenBalance(
        address: string,
        token: string,
        decimals: number = 6,
        abi: any
    ): Promise<number> {
        this.tronWeb.setAddress(token);
        let contract = await this.tronWeb.contract().at(token);
        let balance = await contract.balanceOf(address).call();
        return Number(balance) / Number("1e" + decimals);
    }

    async getBlockNumber(): Promise<number> {
        return (
            (await this.tronWeb.trx.getCurrentBlock())?.block_header?.raw_data
                ?.number ?? 0
        );
    }

    async getBlockRange(
        startBlock: number,
        endBlock: number
    ): Promise<BlockInfo[]> {
        let blocks: BlockInfo[] = [];
        try {
            // Интервал от 2 блоков и более !
            blocks =
                startBlock >= endBlock
                    ? []
                    : await this.tronWeb.trx.getBlockRange(startBlock, endBlock);
        } catch (e) {
            console.log("ERROR this.tronWeb.trx.getBlockRange", e);
        }
        return blocks;
    }

    async createAccount(): Promise<any> {
        const a = await this.tronWeb.createAccount();

        return { address: a.address.base58, privateKey: a.privateKey };
    }

    async getGasPrice(): Promise<number> {
        const date = new Date();
        date.setMinutes(date.getMinutes() - 1);
        const params = await this.tronWeb.trx.getChainParameters();
        return params.find((x) => x.key === "getEnergyFee").value;
    }

    async getHistory(
        account: string,
        token: string
    ): Promise<TronHistoryElement[]> {
        try {
            const result: any = axios.get(`${this.net.rpc.url}/v1/accounts/${account}/transactions/trc20?limit=20&contract_address=${token}`)
            return (result?.data.success && result?.data?.data) || [];
        } catch (err) {
            console.log("Tron getHistory", err);
            return []
        }
    }



    async getTransactionById(hash: string): Promise<TronTransaction> {
        try {
            return await this.tronWeb.trx.getTransaction(hash)
        } catch (err) {
            console.log("Tron getTransactionById", err);
            return null;
        }
    }



    async getTransactionInfoById(hash: string): Promise<TronTransactionInfo> {
        try {
            return await this.tronWeb.trx.getTransactionInfo(hash)
        } catch (err) {
            console.log("Tron getTransactionInfoById", err);
            return null;
        }
    }

    public static getAddressFromPrivateKey(privateKey: string): string {
        return TronWeb.address.fromPrivateKey(privateKey);
    }

    public async getBalances(
        accounts: string[],
        tokens: string[],

    ): Promise<number[]> {
        let checker = "TYPACdASdAe4ZjcACwHscmqy6KCssP2jDt"
        if(this.net.id===TronNile.id) checker = "TRPKCrLsHrSXfAo8zAUa8fBRMm8pz43MRs"
        const contract = await this.tronWeb.contract(
            [
                {
                    outputs: [{ type: "uint256" }],
                    constant: true,
                    inputs: [
                        { name: "user", type: "address" },
                        { name: "token", type: "address" },
                    ],
                    name: "tokenBalance",
                    stateMutability: "View",
                    type: "Function",
                },
                {
                    outputs: [{ type: "uint256[]" }],
                    constant: true,
                    inputs: [
                        { name: "users", type: "address[]" },
                        { name: "tokens", type: "address[]" },
                    ],
                    name: "balances",
                    stateMutability: "View",
                    type: "Function",
                },
                { payable: true, stateMutability: "Payable", type: "Fallback" },
            ],
            checker
        );
        this.tronWeb.setAddress(checker);
        const result: number[] = await contract.methods.balances(accounts, tokens).call()
        return result;
    }



    public async getTokensInfo(
         tokens: string[]
    ): Promise<Token[]> {
        const contractAddress = "TQKaNLbzBn4W769A3YJjYT3RMfHKVFLG8s";
        const abi = [{"outputs":[{"type":"uint256[]"}],"inputs":[{"name":"tokens","type":"address[]"},{"name":"contracts","type":"address[]"},{"name":"account","type":"address"}],"name":"getTokenAllowance","stateMutability":"view","type":"function"},{"outputs":[{"type":"uint8[]"}],"inputs":[{"name":"tokens","type":"address[]"}],"name":"getTokenDecimals","stateMutability":"view","type":"function"},{"outputs":[{"type":"string[]"}],"inputs":[{"name":"tokens","type":"address[]"}],"name":"getTokenSymbols","stateMutability":"view","type":"function"},{"outputs":[{"type":"bool"}],"inputs":[{"name":"token","type":"address"}],"name":"isContract","stateMutability":"view","type":"function"},{"stateMutability":"Payable","type":"Receive"}];
        const contract = await this.tronWeb.contract(
            abi,
            contractAddress
        );
        this.tronWeb.setAddress(contractAddress);

        const decimals = await contract.methods.getTokenDecimals(tokens).call();
        const symbols = await contract.methods.getTokenSymbols(tokens).call();

        return tokens.map((address,i)=>new Token(this.net.id, fromHex(address),decimals[i], symbols[i],symbols[i] ));
    }


    private static abiCache: any[] = [];
    public async  getContractAbi(contractAddress) {
        try {
            if (TronMethods.abiCache[contractAddress]) return TronMethods.abiCache[contractAddress];
            const contract = await this.tronWeb.trx.getContract(contractAddress);
            const abi = contract.abi.entrys;
            if (abi) TronMethods.abiCache[contractAddress] = abi;
            return abi;
        } catch (error) {
            throw error;
        }
    }


    public async allowance(tokenAddress:string, ownerAddress: string, spenderAddress: string ): Promise<any> {
        const contract = await this.tronWeb.contract(
            erc20,
            tokenAddress
        );
        this.tronWeb.setAddress(tokenAddress);
        return await contract.methods.allowance(ownerAddress, spenderAddress).call()
    }



    public async approve( privateKey: string, tokenAddress:string, spenderAddress: string, amount:BigNumber ): Promise<any> {
        const tronWeb =  new TronWeb({
            fullHost: this.net.rpc.url,
            solidityNode: this.net.rpc.url,
            headers: { "TRON-PRO-API-KEY": this.net.rpc.apiKey },
            privateKey
        });
            const contract = await tronWeb.contract().at(tokenAddress);
            await contract.approve(spenderAddress , amount).send().then( (hash)=> {
                console.log('user Approved',hash)
            }).catch(err => {
                console.log('user cancle Approved')
            })

    }

    //----- DECODER

}
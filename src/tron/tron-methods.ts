import axios from "axios";
import Bottleneck from "bottleneck";
import * as TronWeb from "tronweb";
import { NET } from "../nets/net.i";
import { BlockInfo } from "./interfaces";

export interface TronTokenInfo {
    symbol: string; //	"USDT"
    address: string; //	"TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
    decimals: number; //	6
    name: string; //	"Tether USD"
}

export interface TronHistoryElement {
    transaction_id: string; //	"267853baf8cc3ae2c40abb1889d350f6cad670f39f3055a6cbca71ff0fb72bdd"
    token_info: TronTokenInfo;
    block_timestamp: number; //	1564974891000
    from: string; //	"TB4oXR1T7BQ6yVeVBuESMrLhgL3V4XSCg7"
    to: string; //	"TJmmqjb1DK9TTZbQXzRQ2AuA94z4gKAPFh"
    type: string; //	"Transfer"
    value: string; //	"1"
}

export function toHex(str) {
    return TronWeb.address.toHex(str);
}
export function fromHex(str) {
    return TronWeb.address.fromHex(str);
}

export class TronMethods {
    private multicallAbi: any = [
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
    ];
    private tronWeb;
    private net: NET;
    constructor(net: NET) {
        this.net = net;
        this.tronWeb = new TronWeb({
            fullHost: net.rpc[0].url,
            solidityNode: net.rpc[0].url,
            headers: { "TRON-PRO-API-KEY": net.rpc[0].apiKey },
        });
    }

    async sendTRX(
        privateKeyFrom: string,
        to: string,
        amount: number
    ): Promise<{ hash: string; amount: number }> {
        const tronWeb: TronWeb = new TronWeb({
            fullHost: this.net.rpc[0].url,
            headers: { "TRON-PRO-API-KEY": this.net.rpc[0].apiKey },
            privateKey: privateKeyFrom,
        });

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
        privateKeyFrom: string,
        to: string,
        amount: number,
        tokenAddress: string,
        tokenDecimals: number
    ): Promise<{ hash: string; amount: number }> {

        const tronWeb: TronWeb = new TronWeb({
            fullHost: this.net.rpc[0].url,
            headers: { "TRON-PRO-API-KEY": this.net.rpc[0].apiKey },
            privateKey: privateKeyFrom,
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

    static async getHistory(
        limitter: Bottleneck,
        accounts: string[],
        txs: string[],
        token: string
    ): Promise<
        { account: string; hash: string; history: TronHistoryElement[] }[]
    > {
        try {
            const result = await Promise.all(
                accounts.map((account) =>
                    limitter.schedule(() =>
                        axios.get(
                            `https://api.trongrid.io/v1/accounts/${account}/transactions/trc20?limit=20&contract_address=${token}`
                        )
                    )
                )
            );
            return result.map((res, i) => ({
                account: accounts[i],
                hash: txs[i],
                history: (res?.data.success && res?.data?.data) || [],
            }));
        } catch (err) {
            console.log("Tron getHistory", err);
            return [];
        }
    }

    public getAddressFromPrivateKey(privateKey: string): string {
        return TronWeb.address.fromPrivateKey(privateKey);
    }

    public async getBalances(
        accounts: string[],
        tokens: string[],
        limiter: Bottleneck
    ): Promise<number[]> {
        const contract = await this.tronWeb.contract(
            this.multicallAbi,
            this.net.multicall
        );
        this.tronWeb.setAddress(this.net.multicall);
        const result: number[] = await limiter.schedule(() => contract.methods.balances(accounts, tokens).call())
        return result;
    }
}

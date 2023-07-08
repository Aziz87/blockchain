import { AbiCoder, BigNumberish, TransactionResponse } from "ethers";
import * as TronWeb from "tronweb";
import { CurrencySymbol, NET } from "../nets/net.i";
import { BlockTransaction } from "../tron/interfaces";

export function fromHex(hexAddress: string): string {
    return TronWeb.address.fromHex(hexAddress);
}

export enum methods {
    transfer = "0xa9059cbb",
    transferFrom = "0x23b872dd",
    addLiquidityETH = "0xf305d719",
    stake = "0x952e68cf",
    approve = "0x095ea7b3"
}

// @ts-ignore
const methodsDecode = Object.assign(...Object.keys(methods).map(key => ({ [methods[key]]: key })))

/**
 * Декодирует заголовки метода контракта
 * */
export function decodeParams(output, types = ["address", "uint256"], ignoreMethodHash = true) {
    if (!output || typeof output === "boolean") {
        ignoreMethodHash = output;
        output = types;
    }
    if (ignoreMethodHash && output.replace(/^0x/, "").length % 64 === 8)
        output = "0x" + output.replace(/^0x/, "").substring(8);

    const abiCoder = new AbiCoder();
    if (output.replace(/^0x/, "").length % 64)
        throw new Error("Ошибка в декодировании данных. Возможно транзакция сфейленная. The encoded string is not valid. Its length must be a multiple of 64.");
    try {
        return abiCoder.decode(types, output).reduce((obj, arg, index) => {
            if (types[index] == "address")
                arg = 41 + arg.substr(2).toLowerCase();
            obj.push(arg);
            return obj;
        }, []);
    } catch (e) {
        //Logger.error("Ошибка в utils.service decodeParams")
        return [null, 0]
    }
}

export class TX {
    public from: string;
    public fromBalanceUSDT?: number;
    public to: string;
    public contractAddress: string;
    public value: BigNumberish;
    public hash: string;
    public error: string;
    public method: string;
}

export function formatEth(transaction: TransactionResponse): TX {
    const tx = new TX();
    tx.hash = transaction.hash;
    tx.from = transaction.from;

    try {
        if (transaction.data) {
            if (transaction.data === "0x") {
                tx.to = transaction.to;
                tx.value = transaction.value;
            } else {
                tx.contractAddress = transaction.to;
                const method = transaction.data.substring(0, 10);
                tx.method = methodsDecode[method] || method;
                if (method === methods.transfer) {
                    const [hexAddress, value] = decodeParams(transaction.data);
                    tx.to = "0x" + hexAddress.substr(2)
                    tx.value = value;
                } else if (method === methods.transferFrom) {
                    const [sender, recipient, value] = decodeParams(transaction.data);
                    tx.from = "0x" + sender.substr(2)
                    tx.to = "0x" + recipient.substr(2)
                    tx.value = value;
                } else if (method === methods.addLiquidityETH) {
                    const [token, amountTokenDesired, amountTokenMin, amountETHMin, to, deadline] = decodeParams(transaction.data);
                    tx.to = "0x" + to.substr(2)
                    tx.contractAddress = "0x" + token.substr(2)
                    tx.value = amountETHMin;
                } else if (method === methods.stake) {
                    const [token, amountTokenDesired, amountTokenMin, amountETHMin, to, deadline] = decodeParams(transaction.data);
                    tx.to = "0x" + to.substr(2)
                    tx.contractAddress = "0x" + token.substr(2)
                    tx.value = amountETHMin;
                }
            }
        }
    } catch (e) {
        tx.error = "Ошибка формата ETH транзакции " + e?.message;
    }
    return tx;

}

export function formatTron(tronTransaction: BlockTransaction): TX {
    const tronTx = new TX();
    tronTx.hash = tronTransaction.txID;
    try {
        if (tronTransaction.raw_data?.contract) {
            const contract = tronTransaction.raw_data.contract[0];
            if (contract.type === "TransferContract") {
                tronTx.from = fromHex(contract.parameter?.value?.owner_address);
                tronTx.to = fromHex(contract.parameter?.value?.to_address);
                tronTx.value = contract.parameter?.value?.amount;
            } else if (contract.type === "TriggerSmartContract") {
                const data = "0x" + contract.parameter?.value?.data;
                tronTx.from = fromHex(contract.parameter?.value?.owner_address);
                tronTx.contractAddress = fromHex(contract.parameter?.value?.contract_address);
                const method = data.substring(0, 10);

                tronTx.method = methodsDecode[method] || method;
                const arr = data.split("");
                arr.splice(0, 10).join(""); //method 

                if (method === methods.transfer) {
                    arr.splice(0, 24); // 000000000000000000000000
                    const to = fromHex("0x" + arr.splice(0, 40).join(""))
                    const amount = Number("0x" + arr.join(""))
                    tronTx.to = to;
                    tronTx.value = amount;
                } else if (method === methods.transferFrom) {
                    arr.splice(0, 24); // 000000000000000000000000
                    const from = fromHex("0x" + arr.splice(0, 40).join(""))
                    arr.splice(0, 24); // 000000000000000000000000
                    const to = fromHex("0x" + arr.splice(0, 40).join(""))
                    const amount = Number("0x" + arr.join(""))
                    tronTx.from = from;
                    tronTx.to = to;
                    tronTx.value = amount;
                } else if (method === methods.approve) {
                    arr.splice(0, 24); // 000000000000000000000000
                    const to = fromHex("0x" + arr.splice(0, 40).join(""))
                    arr.splice(0, 24); // 000000000000000000000000
                    const amount = Number("0x" + arr.join(""))
                    tronTx.to = to;
                    tronTx.value = amount;
                } else tronTx.error = "unknown data " + data
            } else tronTx.error = "unknown contract.type " + contract.type
        } else tronTx.error = "No tronTransaction.raw_data?.contract"
    } catch (e) {
        console.error(e)
    }
    return tronTx;
}

export function format(net: NET, transaction: BlockTransaction | TransactionResponse): TX {
    return net.nativeCurrency === CurrencySymbol.TRX ? formatTron(transaction as BlockTransaction) : formatEth(transaction as TransactionResponse);
}
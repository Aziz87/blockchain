import { BigNumberish,utils } from "ethers";
import * as TronWeb from "tronweb";
import { CurrencySymbol, NET } from "../nets/net.i";
import { BlockTransaction } from "../tron/interfaces";
import  {TransactionResponse} from "@ethersproject/abstract-provider"
const {AbiCoder, Interface} = utils;
import abiPancakePair from "../abi/pancake-pair"
import abiPancakeRouterV2 from "../abi/pancake-router-v2"
import { TronMethods } from "../tron/tron-methods";
import TronDecoder from "../tron/tron-decoder";
import { Blockchain } from "src/blockchain";


const face = {
    pancakePair : new Interface(abiPancakePair),
    pancakeRouterV2 : new Interface(abiPancakeRouterV2)
}

export function fromHex(hexAddress: string): string {
    return TronWeb.address.fromHex(hexAddress);
}

export enum methods {
    transfer = "0xa9059cbb",
    transferFrom = "0x23b872dd",
    addLiquidityETH = "0xf305d719",
    stake = "0x952e68cf",
    approve = "0x095ea7b3",
    swapExactTokensForTokens = "0x38ed1739",
    swapTokensForExactTokens = "0x8803dbee",
    swapExactETHForTokens = "0x7ff36ab5",
    swapExactTokensForETH = "0x18cbafe5",
    swapExactTokensForETHSupportingFeeOnTransferTokens = "0x791ac947",
    swapExactETHForTokensSupportingFeeOnTransferTokens = "0xb6f9de95"
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
    public router: Lowercase<string>;
    public from: Lowercase<string>;
    public to: Lowercase<string>;
    public tokens: Lowercase<string>[];
    public amountIn: BigNumberish;
    public amountOut: BigNumberish;
    public hash: string;
    public error: string;
    public method: string;
}

export function formatEth(transaction: TransactionResponse): TX {
    const tx = new TX();
    tx.hash = transaction.hash;
    tx.from = transaction.from.toLowerCase() as Lowercase<string>;
    tx.amountIn = transaction?.value || 0;


    try {
        if (transaction.data) {
            if (transaction.data === "0x") {
                tx.to = transaction.to.toLowerCase() as Lowercase<string>;
                tx.amountIn = transaction.value;
            } else {
                tx.tokens = [transaction.to.toLowerCase() as Lowercase<string>];
                const method = transaction.data.substring(0, 10);
                tx.method = methodsDecode[method] || method;
                if (method === methods.transfer) {
                    const [hexAddress, value] = decodeParams(transaction.data);
                    tx.to = "0x" + hexAddress.substr(2).toLowerCase() as Lowercase<string>
                    tx.amountIn = value;
                } else if (method === methods.transferFrom) {
                    const [sender, recipient, value] = decodeParams(transaction.data);
                    tx.from = "0x" + sender.substr(2).toLowerCase() as Lowercase<string>
                    tx.to = "0x" + recipient.substr(2).toLowerCase() as Lowercase<string>
                    tx.amountIn = value;
                } else if (method === methods.addLiquidityETH) {
                    const [token, amountTokenDesired, amountTokenMin, amountETHMin, to, deadline] = decodeParams(transaction.data);
                    tx.to = "0x" + to.substr(2).toLowerCase() as Lowercase<string>
                    tx.tokens = ["0x" + token.substr(2).toLowerCase() as Lowercase<string>]
                    tx.amountIn = amountETHMin;
                } else if ([
                    methods.swapExactETHForTokensSupportingFeeOnTransferTokens+'',
                    methods.swapExactTokensForETHSupportingFeeOnTransferTokens+'',
                    methods.swapExactTokensForETH+'',
                    methods.swapExactETHForTokens+'',
                    methods.swapTokensForExactTokens+'',
                    methods.swapExactTokensForTokens+''
                ].includes(method)) {
                    tx.router = transaction.to.toLowerCase() as Lowercase<string>;
                    const res = face.pancakeRouterV2.parseTransaction(transaction)
                    tx.amountIn = res.args.amountIn || res.args.amountInMax || transaction.value;
                    tx.amountOut = res.args.amountOutMin || res.args.amountOut;
                    tx.tokens = res.args.path.map(x=>x.toLowerCase());
                    tx.to = res.args.to.toLowerCase();
                } else if (method === methods.stake) {
                    const [token, amountTokenDesired, amountTokenMin, amountETHMin, to, deadline] = decodeParams(transaction.data);
                    tx.to = "0x" + to.substr(2).toLowerCase() as Lowercase<string>
                    tx.tokens = ["0x" + token.substr(2).toLowerCase() as Lowercase<string>]
                    tx.amountIn = amountETHMin;
                }
            }
        }
    } catch (e) {
        tx.error = "" + e?.message;
    }
    return tx;

}

 


export async function formatTron(net:NET, bc:Blockchain, transaction:BlockTransaction):Promise<TX>{

   
    const tronTx = new TX();
    tronTx.hash = transaction.txID;
    try {
        if (transaction.raw_data?.contract) {
            const contract = transaction.raw_data.contract[0];
            if (contract.type === "TransferContract") {
                tronTx.from = fromHex(contract.parameter?.value?.owner_address).toLowerCase() as Lowercase<string>
                tronTx.to = fromHex(contract.parameter?.value?.to_address).toLowerCase() as Lowercase<string>
                tronTx.amountIn = contract.parameter?.value?.amount;
            } else if (contract.type === "TriggerSmartContract") {
                const data = "0x" + contract.parameter?.value?.data;
                const {owner_address, contract_address} = transaction.raw_data.contract[0].parameter.value;
                tronTx.from = fromHex(owner_address).toLowerCase() as Lowercase<string>
                tronTx.tokens = [fromHex(contract_address).toLowerCase() as Lowercase<string>]
                const method = data.substring(0, 10);

                tronTx.method = methodsDecode[method] || method;
                const arr = data.split("");
                arr.splice(0, 10).join(""); //method 
                
                if (method === methods.transfer) {
                    arr.splice(0, 24); // 000000000000000000000000
                    const to = fromHex("0x" + arr.splice(0, 40).join(""))
                    const amount = Number("0x" + arr.join(""))
                    tronTx.to = to.toLowerCase() as Lowercase<string>
                    tronTx.amountIn = amount;
                } else if (method === methods.transferFrom) {
                    arr.splice(0, 24); // 000000000000000000000000
                    const from = fromHex("0x" + arr.splice(0, 40).join(""))
                    arr.splice(0, 24); // 000000000000000000000000
                    const to = fromHex("0x" + arr.splice(0, 40).join(""))
                    const amount = Number("0x" + arr.join(""))
                    tronTx.from = from.toLowerCase() as Lowercase<string>
                    tronTx.to = to.toLowerCase() as Lowercase<string>
                    tronTx.amountIn = amount;
                } else if (method === methods.approve) {
                    arr.splice(0, 24); // 000000000000000000000000
                    const to = fromHex("0x" + arr.splice(0, 40).join(""))
                    arr.splice(0, 24); // 000000000000000000000000
                    const amount = Number("0x" + arr.join(""))
                    tronTx.to = to.toLowerCase() as Lowercase<string>
                    tronTx.amountIn = amount;
                } else if ([
                    methods.swapExactETHForTokensSupportingFeeOnTransferTokens+'',
                    methods.swapExactTokensForETHSupportingFeeOnTransferTokens+'',
                    methods.swapExactTokensForETH+'',
                    methods.swapExactETHForTokens+'',
                    methods.swapTokensForExactTokens+'',
                    methods.swapExactTokensForTokens+''
                ].includes(method)) {
                    arr.splice(0, 24); // 000000000000000000000000
                    tronTx.router = fromHex(contract_address).toLowerCase() as Lowercase<string>;
                    const decoder = new TronDecoder(net, bc)
                    const decoded = await decoder.decodeInput(transaction);

                    const _amountIn = decoded.inputNames.indexOf("amountIn");
                    const _amountInMax = decoded.inputNames.indexOf("amountInMax");
                    const _amountOut = decoded.inputNames.indexOf("amountOut");
                    const _amountOutMin = decoded.inputNames.indexOf("amountOutMin");
                    const _to = decoded.inputNames.indexOf("to");
                    const _path = decoded.inputNames.indexOf("path");

                    tronTx.amountIn = _amountIn>-1 ? decoded.decodedInput[_amountIn] : _amountInMax>-1 ? decoded.decodedInput[_amountInMax] : Number("0x" + arr.join(""));
                    tronTx.amountOut = _amountOut>-1 ? decoded.decodedInput[_amountOut] : _amountOutMin>-1 ? decoded.decodedInput[_amountOutMin] : 0;
                    tronTx.tokens = _path>-1 ? decoded.decodedInput[_path].map(x=>fromHex(x).toLowerCase() as Lowercase<string>) : []
                    tronTx.to = _to>-1 ? decoded.decodedInput[_to] : ""
                }
                
                else tronTx.error = "unknown data " + data
            } else tronTx.error = "unknown contract.type " + contract.type
        } else tronTx.error = "No tronTransaction.raw_data?.contract"
    
        return tronTx;
    } catch (e) {
        console.error(e)
    }
}

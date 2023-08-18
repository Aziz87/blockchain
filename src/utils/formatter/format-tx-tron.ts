import { utils } from "ethers"
import * as TronWeb from "tronweb";
import { BlockTransaction } from "../../tron/interfaces";
const {AbiCoder, Interface} = utils;
import { TX } from "./TX";

import {Method, methodsNames} from "./method.enum"
import { MethodCode } from "./method-code.enum";

export function fromHex(hexAddress: string): string {
    return TronWeb.address.fromHex(hexAddress);
}


 






 
// export function parseDataAddresses(net:NET, transaction:BlockTransaction | TransactionResponse){

//     if(net.symbol===Symbol.TRX){
//         return (transaction as BlockTransaction).raw_data_hex.substring(10).match(/.{1,64}/g).filter(x=>x.substring(20,30)!=="0000000000").map(x=>fromHex("0x"+x.substring(24,64))) as Lowercase<string>[]
//     }else{
//         return (transaction as TransactionResponse).data.substring(10).match(/.{1,64}/g).filter(x=>x.substring(20,30)!=="0000000000").map(x=>"0x"+x.substring(24,64)) as Lowercase<string>[]

//     }
// }



export function formatTron(transaction:BlockTransaction):TX{

   
    const tronTx = new TX();
    tronTx.hash = transaction.txID;

    tronTx.originalTransaction = transaction;

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
                tronTx.path = [fromHex(contract_address).toLowerCase() as Lowercase<string>]
                const methodCode = data.substring(0, 10);

                tronTx.method = methodsNames[methodCode].split("_")[0] || methodCode;
                const arr = data.split("");
                arr.splice(0, 10).join(""); //method 
                
                if (methodCode === MethodCode.transfer) {
                    arr.splice(0, 24); // 000000000000000000000000
                    const to = fromHex("0x" + arr.splice(0, 40).join(""))
                    const amount = Number("0x" + arr.join(""))
                    tronTx.to = to.toLowerCase() as Lowercase<string>
                    tronTx.amountIn = amount;
                    tronTx.amountOut = amount;
                } else if (methodCode === MethodCode.transferFrom) {
                    arr.splice(0, 24); // 000000000000000000000000
                    const from = fromHex("0x" + arr.splice(0, 40).join(""))
                    arr.splice(0, 24); // 000000000000000000000000
                    const to = fromHex("0x" + arr.splice(0, 40).join(""))
                    const amount = Number("0x" + arr.join(""))
                    tronTx.from = from.toLowerCase() as Lowercase<string>
                    tronTx.to = to.toLowerCase() as Lowercase<string>
                    tronTx.amountIn = amount;
                    tronTx.amountOut = amount;
                } else if (methodCode === MethodCode.approve) {
                    arr.splice(0, 24); // 000000000000000000000000
                    const to = fromHex("0x" + arr.splice(0, 40).join(""))
                    arr.splice(0, 24); // 000000000000000000000000
                    const amount = Number("0x" + arr.join(""))
                    tronTx.to = to.toLowerCase() as Lowercase<string>
                    tronTx.amountIn = amount;
                    tronTx.amountOut = amount;
                } else if ([
                    MethodCode.swapExactETHForTokensSupportingFeeOnTransferTokens+'',
                    MethodCode.swapExactTokensForETHSupportingFeeOnTransferTokens+'',
                    MethodCode.swapExactTokensForETH+'',
                    MethodCode.swapExactETHForTokens+'',
                    MethodCode.swapTokensForExactTokens+'',
                    MethodCode.swapExactTokensForTokens+''
                ].includes(methodCode)) {
                    tronTx.router = fromHex(contract_address).toLowerCase() as Lowercase<string>;
                    tronTx.needDecode = true;
                }
                
                else tronTx.error = "unknown data " + data
            } else tronTx.error = "unknown contract.type " + contract.type
        } else tronTx.error = "No tronTransaction.raw_data?.contract"
    
        return tronTx;
    } catch (e) {
        console.error(e)
    }
}

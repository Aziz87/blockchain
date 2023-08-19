import { AbiCoder, Interface } from "ethers/lib/utils";
import uniswapRouterV3 from "../../abi/uniswap-router-v3";
import { BigNumber, ethers } from "ethers";

const swapCodes = {
    "00": "V3_SWAP_EXACT_IN",
    "01": "V3_SWAP_EXACT_OUT",
    "08": "V2_SWAP_EXACT_IN",
    "09": "V2_SWAP_EXACT_OUT"
};

const v2VersionDictionary = {
    "swapExactETHForTokens": ["V3_SWAP_EXACT_IN", "V2_SWAP_EXACT_IN"],
    "swapETHForExactTokens": ["V3_SWAP_EXACT_OUT", "V2_SWAP_EXACT_OUT"]
}

let universalInteface = new Interface(uniswapRouterV3);

 

// function buildTransactionObject(transactionDetails:ethers.providers.TransactionResponse, decodedFunction) {
//     let methodName:string;
//     if (v2VersionDictionary["swapExactETHForTokens"].includes(decodedFunction.function)) {
//         methodName = "swapExactETHForTokens";
//     } else if (v2VersionDictionary["swapETHForExactTokens"].includes(decodedFunction.function)) {
//         methodName = "swapETHForExactTokens";
//     }

//     let contractCall = {
//         "methodName": methodName,
//         "params": {
//             "amountIn": decodedFunction.amountIn,
//             "amountOut": decodedFunction.amountOut,
//             "path": decodedFunction.path,
//             "deadline": "99999999999"
//         }
//     }


//     if (methodName === undefined) {
//         return undefined;
//     }

//     return {
//         'status': transactionDetails.status,
//         'direction': transactionDetails.direction,
//         'hash': transactionDetails.hash,
//         'value': transactionDetails.value,
//         'contractCall': JSON.stringify(contractCall),
//         'counterparty': transactionDetails.counterparty,
//         'estimatedBlocksUntilConfirmed': transactionDetails.estimatedBlocksUntilConfirmed,
//         'dispatchTimestamp': transactionDetails.dispatchTimestamp,
//         'maxFeePerGas': transactionDetails.maxFeePerGas,
//         'maxPriorityFeePerGas': transactionDetails.maxPriorityFeePerGas,
//         'gas': transactionDetails.gas,
//         'from': transactionDetails.from,
//         'type': transactionDetails.type,
//         'gasPriceGwei': transactionDetails.gasPriceGwei,
//         'gasPrice': transactionDetails.gasPriceGwei
//     }
// }


export interface UniswapV3Swap{
    function:string;
    recipient:string;
    amountIn:BigNumber
    amountOut:BigNumber
    path:string[]
    payerIsUser:string
}



export function uniswapV3Decode(tx: ethers.providers.TransactionResponse):UniswapV3Swap {
    const parsedTx = universalInteface.parseTransaction({data:tx.data});

    console.log(parsedTx)
    let commandsSplit = Number(parsedTx.args[0]).toString(16).substring(2).match(/.{1,2}/g);

    console.log(commandsSplit)

    const abiCoder = new AbiCoder();

    let foundFunction;
    let inputForFunction;
    console.log("commandsSplit")
    commandsSplit.forEach(
        commandCode => {
            const currentIndex = Object.keys(swapCodes).indexOf(commandCode)
            if (currentIndex !== -1) {
                foundFunction = commandCode;
                inputForFunction = parsedTx.args[1][commandsSplit.indexOf(commandCode)];
            }
        }
    )

    let decoded;

    console.log("foundFunction",foundFunction,swapCodes[foundFunction])
    switch (swapCodes[foundFunction]) {
        case "V3_SWAP_EXACT_IN": //"exactInput" FNC 11
            decoded = abiCoder.decode(["address", "uint256", "uint256", "bytes", "bool"], inputForFunction);
            return {
                function: swapCodes[foundFunction],
                recipient: decoded[0],
                amountIn: BigNumber.from(decoded[1].toString()),
                amountOut: BigNumber.from(decoded[2].toString()),
                path: extractPathFromV3(decoded[3]),
                payerIsUser: decoded[4]
            }
        case "V3_SWAP_EXACT_OUT": //exactOutputSingle FNC 9
            decoded = abiCoder.decode(["address", "uint256", "uint256", "bytes", "bool"], inputForFunction);
            return {
                function: swapCodes[foundFunction],
                recipient: decoded[0],
                amountIn: BigNumber.from(decoded[2].toString()),
                amountOut: BigNumber.from(decoded[1].toString()),
                path: extractPathFromV3(decoded[3], true), // because exact output swaps are executed in reverse order, in this case tokenOut is actually tokenIn
                payerIsUser: decoded[4]
            }
        case "V2_SWAP_EXACT_IN":
            decoded = abiCoder.decode(["address", "uint256", "uint256", "address[]", "bool"], inputForFunction);
            return {
                function: swapCodes[foundFunction],
                recipient: decoded[0],
                amountIn: BigNumber.from(decoded[1].toString()),
                amountOut: BigNumber.from(decoded[2].toString()),
                path: decoded[3],
                payerIsUser: decoded[4]
            }
        case "V2_SWAP_EXACT_OUT":
            decoded = abiCoder.decode(["address", "uint256", "uint256", "address[]", "bool"], inputForFunction);
            return {
                function: swapCodes[foundFunction],
                recipient: decoded[0],
                amountIn: BigNumber.from(decoded[2].toString()),
                amountOut: BigNumber.from(decoded[1].toString()),
                path: decoded[3],
                payerIsUser: decoded[4]
            }
        default:
            console.info("No parseable execute function found in input.")
            return undefined;
    }
}

function extractPathFromV3(fullPath, reverse = false) {
    const fullPathWithoutHexSymbol = fullPath.substring(2);
    let path = [];
    let currentAddress = "";
    for (let i = 0; i < fullPathWithoutHexSymbol.length; i++) {
        currentAddress += fullPathWithoutHexSymbol[i];
        if (currentAddress.length === 40) {
            path.push('0x' + currentAddress);
            i = i + 6;
            currentAddress = "";
        }
    }
    if (reverse) {
        return path.reverse();
    }
    return path;
}
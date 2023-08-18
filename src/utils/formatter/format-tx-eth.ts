import { nets } from "../../nets/net";
import { TX } from "./TX";
import { face } from "./faces";
import { BigNumber, constants, providers } from "ethers";
import { SwapRouterVersion } from "../../nets/net.i";
import { AbiCoder } from "ethers/lib/utils";
import { MethodCode } from "./method-code.enum";
import { Method, methodsNames } from "./method.enum";

const uniswapV3RoutersAddresses = nets.map(x=>x.swapRouters.filter(x=>x.version===SwapRouterVersion.UNISWAP_V3)).reduce((a,b)=>[...a,...b],[]).map(x=>x.address);
const metamaskRoutersAddresses = nets.map(x=>x.swapRouters.filter(x=>x.version===SwapRouterVersion.METAMASK_SWAP)).reduce((a,b)=>[...a,...b],[]).map(x=>x.address);


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
    if (output.replace(/^0x/, "").length % 64){
        throw new Error(" The encoded string is not valid. Its length must be a multiple of 64.");
    }
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


export function formatEth(transaction: providers.TransactionResponse): TX {
    let tx = new TX();
    tx.originalTransaction = transaction;
    tx.hash = transaction.hash;
    tx.from = transaction.from.toLowerCase() as Lowercase<string>;
    tx.amountIn = transaction?.value || 0;
    if(transaction.to) tx.to=transaction.to.toLowerCase() as Lowercase<string>;


    let routerFace = face.pancakeRouterV2;
    if(transaction.to && uniswapV3RoutersAddresses.includes(transaction.to.toLowerCase() as Lowercase<string>)){
        routerFace = face.pancakeRouterV3;
    }
    if(transaction.to && metamaskRoutersAddresses.includes(transaction.to.toLowerCase() as Lowercase<string>)){
        routerFace = face.metamaskSwapRouter;
    }

    try {
        if (transaction.data) {
            if (transaction.data === "0x") {
                tx.to = transaction.to.toLowerCase() as Lowercase<string>;
                tx.amountIn = transaction.value;
                tx.amountOut = transaction.value;
                tx.path = [constants.AddressZero]
                tx.method = Method.sendETH;
            } else {
                tx.path = [];
                const methodCode = transaction.data.substring(0, 10);
                tx.method = methodsNames[methodCode].split("_")[0] || methodCode;
                if (methodCode === MethodCode.transfer) {
                    const [hexAddress, value] = decodeParams(transaction.data);
                    tx.to = "0x" + hexAddress.substr(2).toLowerCase() as Lowercase<string>
                    tx.amountIn = value;
                    tx.amountOut = value;
                    tx.path = [transaction.to.toLowerCase() as Lowercase<string>]
                } else if (methodCode === MethodCode.transferFrom) {
                    const [sender, recipient, value] = decodeParams(transaction.data);
                    tx.from = "0x" + sender.substr(2).toLowerCase() as Lowercase<string>
                    tx.to = "0x" + recipient.substr(2).toLowerCase() as Lowercase<string>
                    tx.amountIn = value;
                    tx.amountOut = value;
                    tx.path = [transaction.to.toLowerCase() as Lowercase<string>]
                } else if (methodCode === MethodCode.addLiquidityETH) {
                    const [token, amountTokenDesired, amountTokenMin, amountETHMin, to, deadline] = decodeParams(transaction.data);
                    tx.to = "0x" + to.substr(2).toLowerCase() as Lowercase<string>
                    tx.path = [constants.AddressZero, "0x" + token.substr(2).toLowerCase() as Lowercase<string>]
                    tx.amountIn = amountETHMin;
                    tx.amountOut = amountTokenMin;
                } else if (methodCode === MethodCode.addLiquidity) {
                    const [tokenA,  tokenB,  amountADesired,  amountBDesired,  amountAMin,  amountBMin,  to,  deadline] = decodeParams(transaction.data);
                    tx.to = "0x" + to.substr(2).toLowerCase() as Lowercase<string>
                    tx.path = ["0x" + tokenA.substr(2).toLowerCase() as Lowercase<string>,"0x" + tokenB.substr(2).toLowerCase() as Lowercase<string>]
                    tx.amountIn = amountAMin;
                    tx.amountOut = amountBMin;
                } else if (methodCode === MethodCode.removeLiquidity) {
                    const [ tokenA,  tokenB,  liquidity,  amountAMin,  amountBMin,  to,  deadline] = decodeParams(transaction.data);
                    tx.to = "0x" + to.substr(2).toLowerCase() as Lowercase<string>
                    tx.path = ["0x" + tokenA.substr(2).toLowerCase() as Lowercase<string>,"0x" + tokenB.substr(2).toLowerCase() as Lowercase<string>]
                    tx.amountIn = amountAMin;
                    tx.amountOut = amountBMin;
                    tx.liquidity = liquidity;
                } else if (methodCode === MethodCode.removeLiquidityETH) {
                    const [ token, liquidity, amountTokenMin, amountETHMin, to, deadline] = decodeParams(transaction.data);
                    tx.to = "0x" + to.substr(2).toLowerCase() as Lowercase<string>
                    tx.path = [constants.AddressZero as Lowercase<string>,"0x" + token.substr(2).toLowerCase() as Lowercase<string>]
                    tx.amountIn = amountETHMin;
                    tx.amountOut = amountTokenMin;
                    tx.liquidity=liquidity;
                } else if ([
                    MethodCode.swapExactETHForTokensSupportingFeeOnTransferTokens+'',
                    MethodCode.swapExactTokensForETHSupportingFeeOnTransferTokens+'',
                    MethodCode.swapExactTokensForETH+'',
                    MethodCode.swapExactETHForTokens+'',
                    MethodCode.swapTokensForExactTokens+'',
                    MethodCode.swapExactTokensForTokens+'',
                    MethodCode.swapETHForExactTokens+'',
                    MethodCode.swapExactTokensForTokens_v3,
                    MethodCode.swapTokensForExactTokens_v3,
                ].includes(methodCode)) {
                    tx.router = transaction.to.toLowerCase() as Lowercase<string>;
                    const res = routerFace.parseTransaction(transaction)
                    tx.amountIn = res.args.amountIn || res.args.amountInMax || transaction.value;
                    tx.amountOut = res.args.amountOutMin || res.args.amountOut;
                    tx.path = res.args.path.map(x=>x.toLowerCase());
                    tx.to = res.args.to.toLowerCase();
                } else if ([
                    MethodCode.swapExactETHForTokensSupportingFeeOnTransferTokens+'',
                    MethodCode.swapExactTokensForETHSupportingFeeOnTransferTokens+'',
                    MethodCode.swapExactTokensForETH+'',
                    MethodCode.swapExactETHForTokens+'',
                    MethodCode.swapTokensForExactTokens+'',
                    MethodCode.swapExactTokensForTokens+'',
                    MethodCode.swapETHForExactTokens+'',
                    MethodCode.swapExactTokensForTokens_v3,
                    MethodCode.swapTokensForExactTokens_v3,
                ].includes(methodCode)) {
                    tx.router = transaction.to.toLowerCase() as Lowercase<string>;
                    const res = routerFace.parseTransaction(transaction)
                    tx.amountIn = res.args.amountIn || res.args.amountInMax || transaction.value;
                    tx.amountOut = res.args.amountOutMin || res.args.amountOut;
                    tx.path = res.args.path.map(x=>x.toLowerCase());
                    tx.to = res.args.to.toLowerCase();
                } else if ([
                    MethodCode.multicall_v3_1+'',
                    MethodCode.multicall_v3_2+'',
                    MethodCode.multicall_v3_3+'',
                ].includes(methodCode)) {
                    const res:any = routerFace.parseTransaction(transaction)
                    transaction.data=res.args.data[0]
                    tx = formatEth(transaction)
                    for(let i=1;i<res.args.data.length;i++){
                        transaction.data=res.args.data[i]
                        tx.additionalTxs.push(formatEth(transaction));
                    }                    
                } else if (methodCode === MethodCode.stake) {
                    const [token, amountTokenDesired, amountTokenMin, amountETHMin, to, deadline] = decodeParams(transaction.data);
                    tx.to = "0x" + to.substr(2).toLowerCase() as Lowercase<string>
                    tx.path = ["0x" + token.substr(2).toLowerCase() as Lowercase<string>]
                    tx.amountIn = amountETHMin;

                } else if (methodCode === MethodCode.swap) {
                    const res:any = routerFace.parseTransaction(transaction)
                    tx.amountIn = res.args.amount;
                    tx.amountOut = BigNumber.from("0x"+res.args.data.substring(216,258));
                    let tokenOut = "0x"+res.args.data.substring(90,130).toLowerCase();
                    if(tokenOut.substring(0,20)==="0x000000000000000000") tokenOut = constants.AddressZero;
                    tx.path=[res.args.tokenFrom.toLowerCase(),tokenOut]
                    tx.router = transaction.to.toLowerCase() as Lowercase<string>;
                    tx.to = tx.from;
                    tx.method = res.args.tokenFrom===constants.AddressZero ? Method.swapExactETHForTokens :tokenOut===constants.AddressZero ? Method.swapExactTokensForETH : Method.swapExactTokensForTokens;
                }
            }
        }
    } catch (e) {
        tx.error = "" + e?.message;
    }
    return tx;

}

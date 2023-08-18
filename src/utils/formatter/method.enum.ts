import {MethodCode} from "./method-code.enum"

export enum Method {
    sendETH = "sendETH",
    transfer = "transfer",
    withdrawWETH = "withdraw",
    depositWETH = "deposit",
    transferFrom = "transferFrom",
    addLiquidityETH = "addLiquidityETH",
    addLiquidity = "addLiquidity",
    removeLiquidity = "removeLiquidity",
    removeLiquidityETH = "removeLiquidityETH",
    stake = "stake",
    swap = "swap",
    approve = "approve",
    swapExactTokensForTokens = "swapExactTokensForTokens",
    swapTokensForExactTokens = "swapTokensForExactTokens",
    swapExactETHForTokens = "swapExactETHForTokens",
    swapExactTokensForETH = "swapExactTokensForETH",
    swapETHForExactTokens = "swapETHForExactTokens",
    swapTokensForExactETH = "swapTokensForExactETH",
    swapExactTokensForETHSupportingFeeOnTransferTokens = "swapExactTokensForETHSupportingFeeOnTransferTokens",
    swapExactETHForTokensSupportingFeeOnTransferTokens = "swapExactETHForTokensSupportingFeeOnTransferTokens",
    multicall = "multicall",
}


// @ts-ignore
export const methodsNames = Object.assign(...Object.keys(MethodCode).map(key => ({ [MethodCode[key]]: key })))

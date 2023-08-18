import { TX } from "./TX";
import  { Log} from "@ethersproject/abstract-provider"
import { face } from "./faces";
import { Method } from "./method.enum";



const TransferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
const ApprovalTopic = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925"
const WithdrawWETHTopic = "0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65"
const DepositWETHTopic = "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c"


export function formatLog(log:Log):TX{
    const tx = new TX();
    tx.originalTransaction = log;
    tx.hash = log.transactionHash;
    tx.path = [log.address.toLowerCase() as Lowercase<string>];
    if(log.topics[0]===TransferTopic){
        const d = face.erc20.decodeEventLog("Transfer", log.data, log.topics)
        tx.from = d.from.toLowerCase();
        tx.to=d.to.toLowerCase();
        tx.method=Method.transfer;
        tx.amountIn=tx.amountOut=d.value;
    }else 
    if(log.topics[0]===ApprovalTopic){
        const d = face.erc20.decodeEventLog("Approval", log.data, log.topics)
        tx.from = d.owner;
        tx.to=d.spender;
        tx.amountIn=tx.amountOut=d.value;
        tx.method=Method.approve;
    }else 
    if(log.topics[0]===DepositWETHTopic){
        const d = face.weth.decodeEventLog("Deposit", log.data, log.topics)
        tx.from = d.dst;
        tx.to = d.dst;
        tx.amountIn=tx.amountOut=d.wad;
        tx.method=Method.depositWETH;
    }else 
    if(log.topics[0]===WithdrawWETHTopic){
        const d = face.weth.decodeEventLog("Withdrawal", log.data, log.topics)
        tx.from = d.src;
        tx.to = d.src;
        tx.amountIn=tx.amountOut=d.wad;
        tx.method=Method.withdrawWETH;
    }else tx.error=`Cannot decode log topic ${log.topics[0]}`


    return tx;

}
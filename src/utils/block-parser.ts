import { ethers, providers } from "ethers";
import { EventEmitter } from "stream";
import { Symbol, NET } from "../nets/net.i";
import { BlockTransaction } from "../tron/interfaces";
import { TronMethods } from "../tron/tron-methods";
const {JsonRpcProvider} = providers;
import { events, Blockchain } from "../blockchain";


const TRON_BLOCKS_PARSE_RANGE = 5;

export default class BlockParser extends EventEmitter {
    
    public blockNumber: number = 0;
    // private lastParsedBlock: number = 0;
    private net: NET;
    private blockParseRange: number = 1;
    private bc:Blockchain;
    private logs:boolean=false;
    private lastParsedBlockNumbers:number[] = [];


    constructor(bc:Blockchain, net: NET|number, logs:boolean) {
        super();
        this.bc = bc;
        this.logs=logs;
        if(Number.isInteger(net)) this.net = this.bc.getNet(net as number) as NET;
        else this.net = net as NET;
        if (this.net.symbol === Symbol.TRX) this.blockParseRange = TRON_BLOCKS_PARSE_RANGE;
        
        // setInterval(this.parsePending.bind(this), this.net.miningBlockSeconds * 1000 * 0.95 * this.blockParseRange);
        // this.parsePending();
        this.bc.getProvider<providers.JsonRpcProvider>(this.net).on("block", this.parsePending.bind(this));
        
    }



    private async parsePending(blockNumber?:number){
        try{
            const block = await this.bc.getLimitter(this.net.id).schedule(() =>  this.bc.getProvider<providers.JsonRpcProvider>(this.net).getBlockWithTransactions(blockNumber || "pending"));
            if(block){
                if(this.lastParsedBlockNumbers.length && !this.lastParsedBlockNumbers.includes(block.number-1)){
                    this.parsePending(block.number-1)
                }
                if(this.lastParsedBlockNumbers.includes(block.number)) return// console.log("already parsed",block.number);

                this.emit(events.NEW_TRANSACTIONS, this.net, block.transactions, block.number);
                this.lastParsedBlockNumbers.push(block.number)
                if(this.lastParsedBlockNumbers.length>20)this.lastParsedBlockNumbers.shift();
                // const prevBlockNumber = this.lastParsedBlockNumbers[this.lastParsedBlockNumbers.length-2];
                // if(prevBlockNumber && prevBlockNumber<block.number-1)this.parsePending(block.number-1);
                // console.log(this.lastParsedBlockNumbers.join(', '))

            }
        }catch(err){
            console.log("error parsePending",err?.message)
        }
    }


    // async onNewBlock(blockNumber?:number) {//
    //     try {
         
    //         if(!blockNumber) blockNumber = await this.bc.getBlockNumber(this.net);
    //         if (!blockNumber) return;
    //         this.blockNumber = blockNumber;
    //         if (!this.lastParsedBlock) this.lastParsedBlock = this.blockNumber - 2;
    //         // if (this.lastParsedBlock > this.blockNumber - this.skipBlocks) return;
    //         if (this.blockParseRange > 1 && this.lastParsedBlock >= this.blockNumber - 1) return;
    //         const toBlock = Math.min(this.lastParsedBlock + this.blockParseRange, this.blockNumber)
    //         this.parseBlock(this.lastParsedBlock + 1, toBlock);
    //         if(this.logs) this.parseLogs(this.lastParsedBlock+1, toBlock);
    //         this.lastParsedBlock = toBlock;
    //     } catch (err) {
    //         console.log("error parse new block", err);
    //     }
    // }

    // async parseBlock(blockNumber: number, toBlockNumber?: number, _try:number=1){
    //     try {
    //         if (this.net.symbol === Symbol.TRX) {
    //             const tronMethods:TronMethods = this.bc.getTronMethods[this.net.id];
    //             const blocks = await this.bc.getLimitter(this.net.id).schedule(() => tronMethods.getBlockRange(blockNumber, toBlockNumber))
    //             const transactions: BlockTransaction[] = blocks.map(x => x.transactions || []).reduce((a, b) => [...a, ...b], []);
    //             this.emit(events.NEW_TRANSACTIONS, this.net, transactions, blockNumber, toBlockNumber);
    //         } else {
    //             const block = await this.bc.getLimitter(this.net.id).schedule(() =>  this.bc.getProvider<providers.JsonRpcProvider>(this.net).getBlockWithTransactions(blockNumber+3));
    //             if(!block) {
    //                 if(_try>=3)throw new Error("Block not parsed...");
    //                 await new Promise(r=>setTimeout(r,3000))
    //                 return await this.parseBlock(blockNumber, toBlockNumber, _try+1);
    //             }
    //             else this.emit(events.NEW_TRANSACTIONS, this.net, block.transactions, blockNumber);
    //             console.log("block",block.number)
    //         }
    //     } catch (err) {
    //         console.log(`network ${this.net.id}: error parse block ${blockNumber}`, err)
    //     }
    // }

    async parseLogs(fromBlock: number, toBlock?: number){
        try {
            if (this.net.symbol === Symbol.TRX) {
              
                
            } else {
                const logs = await this.bc.getProvider<providers.JsonRpcProvider>(this.net).getLogs({
                    fromBlock, toBlock
                });
                if(!logs) throw new Error("Logs not parsed...")
                else this.emit(events.NEW_LOGS, this.net, logs);
            }
        } catch (err) {
            console.log(`network ${this.net.id}: error parse logs on block ${fromBlock}`, err)
        }
    }
    
}
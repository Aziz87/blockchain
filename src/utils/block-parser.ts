import { ethers, providers } from "ethers";
import { EventEmitter } from "stream";
import { Symbol, NET } from "../nets/net.i";
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
    private requestedBlockNumbers:number[] = [];
    private completedBlockNumbers:number[] = [];
    private interval = 2900;


    constructor(bc:Blockchain, net: NET|number, logs:boolean) {
        super();
        this.bc = bc;
        this.logs=logs;


        if(Number.isInteger(net)) this.net = this.bc.getNet(net as number) as NET;
        else this.net = net as NET;
        if (this.net.symbol === Symbol.TRX) this.blockParseRange = TRON_BLOCKS_PARSE_RANGE;
        // setInterval(this.parsePending.bind(this), this.net.miningBlockSeconds * 1000 * 0.95 * this.blockParseRange);
        // this.parsePending();
        // this.bc.getProvider<providers.JsonRpcProvider>(this.net).on("block", this.parsePending.bind(this));

        console.log("net parser")
        this.onNewBlock();
    }

    private async onNewBlock(){
        if(!this.blockNumber) this.blockNumber = await this.bc.getBlockNumber(this.net);
        this.blockNumber++;
        this.parsePending(this.blockNumber);
        setTimeout(this.onNewBlock.bind(this),this.interval);
    }

    private async parsePending(blockNumber?:number){

       
        if(this.completedBlockNumbers.includes(blockNumber)) return console.log("already conmplete", blockNumber);
        if(this.requestedBlockNumbers.includes(blockNumber)) return  console.log("already requested", blockNumber);
        this.requestedBlockNumbers.push(blockNumber);
        if(this.requestedBlockNumbers.length>20) this.requestedBlockNumbers.shift();
        // console.log("parsePending",blockNumber)
        // console.log("---",blockNumber);
        try{
            const limitter = this.bc.getLimitter(this.net.id);
            const block = await limitter.schedule({id:`block${blockNumber}`,priority:0},() =>  this.bc.getProvider<providers.JsonRpcProvider>(this.net).getBlockWithTransactions(blockNumber || "pending"));
            if(block){
                // console.log("+++",block.number, this.net.id);
                if(this.completedBlockNumbers.includes(block.number)) return console.log("stop. already complete", block.number);
                this.completedBlockNumbers.push(block.number);
                if(this.completedBlockNumbers.length > 20) this.completedBlockNumbers.shift();
                // this.blockNumber++;
                this.emit(events.NEW_TRANSACTIONS, this.net, block.transactions, block.number, block.timestamp);
            }else{
                // this.blockNumber++;
                this.blockNumber=blockNumber-1;
                // console.log("ERRROR")
            }
        } catch(err) {
            console.log("error parsePending", err?.message)
        }
        this.requestedBlockNumbers.splice(this.requestedBlockNumbers.indexOf(blockNumber), 1);
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
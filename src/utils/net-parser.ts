import Bottleneck from "bottleneck";
import { providers } from "ethers";
import { EventEmitter } from "stream";
import nets from "../nets/net";
import { Symbol, NET } from "../nets/net.i";
import { BlockTransaction } from "../tron/interfaces";
import { TronMethods } from "../tron/tron-methods";
const {JsonRpcProvider} = providers;

const TRON_BLOCKS_PARSE_RANGE = 5;

export default class NetParser extends EventEmitter {

    public static NEW_TRANSACTIONS = "new_transactions";

    public blockNumber: number = 0;
    private lastParsedBlock: number = 0;
    private skipBlocks: number;
    private netId: number;
    private limitter: Bottleneck;
    private tronMethods: TronMethods;
    private blockParseRange: number = 1;

    constructor(limitter: Bottleneck, netId: number, blockIntervalSec: number = 3, skipBlocks: number = 5) {
        super();
        this.limitter = limitter;
        this.netId = netId;
        this.skipBlocks = skipBlocks;
        const config = this.getConfig(netId);
        if (config.symbol === Symbol.TRX) {
            this.tronMethods = new TronMethods(config);
            this.blockParseRange = TRON_BLOCKS_PARSE_RANGE;
        }

        setInterval(this.onNewBlock.bind(this), blockIntervalSec * 1000 * 0.95 * this.blockParseRange);
        this.onNewBlock();
    }

    public getConfig(netId: number): NET {
        return nets.find(x => x.id + '' === netId + '');
    }

    public async getBlockNumber(netId: number): Promise<number | null> {
        try {
            const config = this.getConfig(netId);
            if (config.symbol === Symbol.TRX) {
                return await this.limitter.schedule(() => this.tronMethods.getBlockNumber())
            } else {
                const provider = new JsonRpcProvider(config.rpc.url);
                return await this.limitter.schedule(() => provider.getBlockNumber())
            }
        } catch (err) {
            console.log("err get block number", err?.message)
            return null;
        }
    }

    async onNewBlock() {//
        try {
            const blockNumber = await this.getBlockNumber(this.netId);
            if (!blockNumber) return;
            this.blockNumber = blockNumber;
            if (!this.lastParsedBlock) this.lastParsedBlock = this.blockNumber - 2;
            if (this.lastParsedBlock > this.blockNumber - this.skipBlocks) return;
            if (this.blockParseRange > 1 && this.lastParsedBlock >= this.blockNumber - 1) return;
            const toBlock = Math.min(this.lastParsedBlock + this.blockParseRange, this.blockNumber)
            this.parse(this.lastParsedBlock + 1, toBlock);
            this.lastParsedBlock = toBlock;
        } catch (err) {
            console.log("error parse new block", err);
        }
    }

    async parse(blockNumber: number, toBlockNumber?: number) {
        try {
            const config = this.getConfig(this.netId);
            if (config.symbol === Symbol.TRX) {
                const blocks = await this.limitter.schedule(() => this.tronMethods.getBlockRange(blockNumber, toBlockNumber))
                const transactions: BlockTransaction[] = blocks.map(x => x.transactions || []).reduce((a, b) => [...a, ...b], []);
                // console.log(`${blockNumber} / ${toBlockNumber} [${transactions.length} txs]`)
                this.emit(NetParser.NEW_TRANSACTIONS, config, transactions);
            } else {
                const provider = new JsonRpcProvider(config.rpc.url);
                const block = await provider.getBlockWithTransactions(blockNumber)
                // console.log(`${blockNumber} / ${this.blockNumber} [${block.transactions.length} txs]`)
                if(block.transactions) this.emit(NetParser.NEW_TRANSACTIONS, config, block.transactions);
            }
        } catch (err) {
            console.log(`network ${this.netId}: error parse block`, err)
        }
    }
}
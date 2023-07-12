
export interface TronTokenInfo {
    symbol: string; //	"USDT"
    address: string; //	"TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
    decimals: number; //	6
    name: string; //	"Tether USD"
}

export interface TronHistoryElement {
    transaction_id: string; //	"267853baf8cc3ae2c40abb1889d350f6cad670f39f3055a6cbca71ff0fb72bdd"
    token_info: TronTokenInfo;
    block_timestamp: number; //	1564974891000
    from: string; //	"TB4oXR1T7BQ6yVeVBuESMrLhgL3V4XSCg7"
    to: string; //	"TJmmqjb1DK9TTZbQXzRQ2AuA94z4gKAPFh"
    type: string; //	"Transfer"
    value: string; //	"1"
}

export interface TronTransactionReceipt {
    energy_fee: number;// 64114260,
    energy_usage_total: number;// 152653,
    net_fee: number;// 571000,
    result: string;// "SUCCESS",
    energy_penalty_total: number;// 19281
}


export interface TronLog {
    address: string;// "acb9bd01ca08bafc513c3405eb6e840cf711b127",
    topics: string[]// [
        //"ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        //"000000000000000000000000423d3ccd4dc79d1e30da9e722572fc5eda64e835",
        //"0000000000000000000000002e0336b4fd16b9736e2f1be87c33244e93c41000"
    //],
    data: string;// "0000000000000000000000000000000000000000000002f4e2892dea08474ba2"
}

export interface TronInternalTransaction {
    hash: string;// "ca0fbd19669f3809f0074cd876b5117046818c37a2ec52383d3b1c5f1fb4a95a",
    caller_address: string;// "416e0617948fe030a7e4970f8389d4ad295f249b7e",
    transferTo_address: string;// "412e0336b4fd16b9736e2f1be87c33244e93c41000",
    callValueInfo: any[];// [{}]
    note: string;// "63616c6c"
}
export interface TronTransactionInfo {
    id:string;
    fee:number;
    blockNumber:number;
    blockTimeStamp:number;
    contractResult:string[];
    resMessage:string;
    contract_address:string;
    receipt:TronTransactionReceipt;
    log:TronLog[];
    internal_transactions:TronInternalTransaction[]
}

export interface TronRet{
    contractRet:"SUCCESS"| "FAIL" | string
}


export interface TronTransactionRawDataContractParameterValue{
    data:string;
    owner_address:string;
    contract_address:string;
}

export interface TronTransactionRawDataContractParameter{
    value:TronTransactionRawDataContractParameterValue;
    type_url:string;
}

export interface TronTransactionRawDataContract{
    parameter:TronTransactionRawDataContractParameter;
    type:string;
}

export interface TronTransactionRawData {
    contract: TronTransactionRawDataContract[],
    ref_block_bytes: string;// "51f5",
    ref_block_hash: string;// "1ea2f32e9cc12362",
    expiration: number;// 1689150870000,
    fee_limit: number;// 250000000,
    timestamp: number;// 1689150810692
}

export interface TronTransaction {
    ret:TronRet[],
    signature:string[],
    txID:string;
    raw_data:TronTransactionRawData;
    raw_data_hex:string;
}

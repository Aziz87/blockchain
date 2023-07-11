import { Contract, providers } from 'ethers';
import { NET } from "../nets/net.i";
import ABI from "./multicall-abi";
import { MultiCallItem } from "./multicall.i";

const {JsonRpcProvider} = providers;

export async function multiCall(config: NET, items: MultiCallItem[]): Promise<any> {
    const provider = new JsonRpcProvider(config.rpc.url);
    const contractMulticall = new Contract(config.multicall, ABI, provider);

    const multicallArgs = items.map(item => ({
        target: item.target,
        callData: item.face.encodeFunctionData(item.method, item.arguments),
        returnData: ''
    }));

    let response = null;
    try {
        response = await contractMulticall.aggregate(multicallArgs).catch((err: any) => {
            // console.error('Ups... multicall error...', err)
        });
    } catch (err: any) {
        // console.error('multicall error', err);
    }

    const result: any = {}
    if (response) for (let i = 0; i < items.length; i++) {
        const method = items[i].method;
        const target = items[i].target;
        const key = items[i].key;
        const face = items[i].face;
        if (!result[method]) result[method] = [];
        let val = null;
        try {
            val = response.returnData[i] === "0x" ? null : face.decodeFunctionResult(items[i].method, response.returnData[i]);
        } catch (err) {
            console.error(err);
            console.error("Face Decode error", { target, method, data: response.returnData[i] })//+target+" : "+items[i].method+" "+response,err)
        }

        if (key) {
            result[key] = val;
        } else {
            if (result[method][target]) {
                if (val === null) val = [[null]]

                // @ts-ignore
                if (Array.isArray(result[method][target])) result[method][target] = [...result[method][target], ...val];
                else result[method][target] = [result[method][target], ...val];
            } else {
                result[method][target] = val;
            }
        }

    }
    return result;
}
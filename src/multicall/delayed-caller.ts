import { Blockchain, NET, ethers } from "../blockchain";
import { multiCallLinear } from "./multicall";
import { faces } from "../utils/formatter/faces";

export interface DelayedCall {
    target:string;
    method:string;
    args:any[];
    face:ethers.utils.Interface
    maxDelay:number;
    cb:Function;
}

export interface CustomFace{
    face:any
}

const MAX_PART_CALL_SIZE = 200;

export class DelayedCaller{

    private bc:Blockchain;
    private net:NET;

    private list:DelayedCall[] = [];

    constructor(bc:Blockchain, net:NET){
        this.bc = bc;
        this.net = net;
        setInterval(this.processor.bind(this), 500);
    }

    public call<T>(target:string, method:string, args:any[], _face:"erc20"|"uniswapRouterV2"|"uniswapRouterV3"|"metamaskSwapRouter"|"uniswapPair"|CustomFace, maxDelay:number):Promise<T>{

  
        const face = _face['face'] || faces[_face+''];

    
        return new Promise(resolve=>{
            function cb(result:T){
                resolve(result)
            }
            this.list.push({target, method, args, face, maxDelay ,cb});
        })
    }

    private processor(){
        this.list.sort((a,b)=>a.maxDelay<b.maxDelay?-1:1);
        const part = this.list.splice(0,MAX_PART_CALL_SIZE);
        if(part.length){
            this.bc.getLimitter(this.net).schedule(()=>multiCallLinear(this.net, part.map(item=>({target:item.target, arguments:item.args, face:item.face, method:item.method }))).then(results=>{
                for(let i = 0; i<results.length; i++){
                    part[i].cb(results[i])
                }
            }));
        }

    }

}







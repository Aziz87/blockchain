import ethers from "ethers";

export interface MultiCallItem {
    key?: string;
    target: string;
    face: ethers.utils.Interface
    method: string;
    arguments: any[];
}

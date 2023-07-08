import ethers from "ethers";

export interface MultiCallItem {
    key?: string;
    target: string;
    face: ethers.Interface
    method: string;
    arguments: any[];
}

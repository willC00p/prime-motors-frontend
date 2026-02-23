export interface Model {
    id: number;
    item_no: string;
    brand: string | null;
    model: string | null;
    color: string[];
    srp?: number;
}

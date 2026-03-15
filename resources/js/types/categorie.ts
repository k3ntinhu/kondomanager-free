import { Documento } from "./documenti";

export interface Categoria {
  id: number;
  name: string;
  localized_name?: string;
  description?: string;
  documenti_count: number;
  documenti: Documento[];
}

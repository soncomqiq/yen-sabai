import type { ShopService } from "./interface";
import { MockShopService } from "./mock";
export function createShopService(): ShopService {
  return new MockShopService(window.localStorage);
}

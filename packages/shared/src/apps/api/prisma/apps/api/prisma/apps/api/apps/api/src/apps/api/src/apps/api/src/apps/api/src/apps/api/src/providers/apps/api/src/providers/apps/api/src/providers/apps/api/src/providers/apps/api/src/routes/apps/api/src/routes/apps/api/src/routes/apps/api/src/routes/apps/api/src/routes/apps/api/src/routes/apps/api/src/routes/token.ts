import type { FastifyInstance } from "fastify";
import { env } from "../env.js";

/** Read-only: tidak menandatangani transaksi. */
export default async function (app: FastifyInstance) {
  app.get("/v1/token/stats", async () => {
    const rpc = async (method: string, params: unknown[]) => {
      const r = await fetch(env.BASE_RPC_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
      });
      return r.json();
    };
    try {
      const supply = await rpc("eth_call", [{
        to: env.VVV_ADDRESS, data: "0x18160ddd"   // totalSupply()
      }, "latest"]);
      return {
        vvv: env.VVV_ADDRESS, diem: env.DIEM_ADDRESS,
        totalSupplyWei: supply.result ?? null,
        chain: "base"
      };
    } catch {
      return { vvv: env.VVV_ADDRESS, diem: env.DIEM_ADDRESS, totalSupplyWei: null, chain: "base" };
    }
  });
}

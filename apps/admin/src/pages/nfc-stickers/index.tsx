import { partnerPublicPath, type AdminStickerOrder } from "@loal/api";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@loal/ui/shadcn";
import { useState } from "react";
import { useNfcStickerOrders } from "../../entities/nfc-sticker/api";
import { SITE_URL } from "../../shared/config/env";
import { buildXlsx, downloadBlob } from "../../shared/lib/xlsx";

const base = SITE_URL.replace(/\/$/, "");
const storeUrl = (order: AdminStickerOrder) =>
  `${base}${partnerPublicPath({ id: order.merchantId, name: order.merchantName, category: order.category })}`;

const kindLabel = (kind: string) => (kind === "digital" ? "Цифровой" : "Физический");
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("ru-RU") : "—");

/** Супер-админ: заказы NFC-стикеров. Выгрузка в xlsx со ссылкой магазина — на печать оптом. */
export function NfcStickersPage() {
  const [status, setStatus] = useState<"paid" | "all">("paid");
  const query = useNfcStickerOrders(status);
  const orders = query.data ?? [];

  const exportXlsx = () => {
    const rows = [
      ["Заведение", "Тип стикера", "Статус", "Оплачен", "Ссылка на каталог"],
      ...orders.map((o) => [
        o.merchantName,
        kindLabel(o.kind),
        o.status === "paid" ? "Оплачен" : "Ожидает оплаты",
        when(o.paidAt),
        storeUrl(o),
      ]),
    ];
    downloadBlob(buildXlsx("NFC-стикеры", rows), `nfc-stickers-${status}.xlsx`);
  };

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="NFC-стикеры"
        description="Заказы стикеров заведений. Выгрузите оплаченные в xlsx — со ссылкой магазина для печати QR."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Статус заказов">
          <Button role="tab" aria-selected={status === "paid"} variant={status === "paid" ? "primary" : "outline"} size="sm" onClick={() => setStatus("paid")}>
            Оплаченные
          </Button>
          <Button role="tab" aria-selected={status === "all"} variant={status === "all" ? "primary" : "outline"} size="sm" onClick={() => setStatus("all")}>
            Все
          </Button>
        </div>
        <Button size="sm" onClick={exportXlsx} disabled={orders.length === 0}>
          Скачать xlsx ({orders.length})
        </Button>
      </div>

      {query.isPending ? (
        <Card className="p-6">
          <Loading rows={5} />
        </Card>
      ) : query.isError ? (
        <Card className="p-6">
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        </Card>
      ) : orders.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            title={status === "paid" ? "Оплаченных стикеров пока нет" : "Заказов стикеров пока нет"}
            description="Здесь появятся заказы NFC-стикеров заведений на тарифе «Больше клиентов»."
          />
        </Card>
      ) : (
        <Card className="p-0">
          <Table className="sm:min-w-[720px]">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Заведение</TableHeaderCell>
                <TableHeaderCell>Тип</TableHeaderCell>
                <TableHeaderCell>Статус</TableHeaderCell>
                <TableHeaderCell>Оплачен</TableHeaderCell>
                <TableHeaderCell>Ссылка</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell primary className="font-medium">{o.merchantName}</TableCell>
                  <TableCell label="Тип">{kindLabel(o.kind)}</TableCell>
                  <TableCell label="Статус">
                    {o.status === "paid" ? <Badge tone="good">Оплачен</Badge> : <Badge tone="warn">Ожидает</Badge>}
                  </TableCell>
                  <TableCell label="Оплачен">{when(o.paidAt)}</TableCell>
                  <TableCell label="Ссылка">
                    <a href={storeUrl(o)} target="_blank" rel="noreferrer" className="break-all text-flame-ink underline underline-offset-4">
                      {storeUrl(o).replace(/^https?:\/\//, "")}
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </section>
  );
}

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { StoreEntity } from "@/features/stores/domain";

const ALL_STORES_VALUE = "all";

const storeLabel = (store: StoreEntity) =>
  store.fullname || store.username || store.email || `#${store.id}`;

type StoreScopeSelectProps = {
  stores: StoreEntity[];
  value: number | null;
  onChange: (storeId: number | null) => void;
  allLabel: string;
  placeholder: string;
  id?: string;
  allowAll?: boolean;
};

export const StoreScopeSelect = ({
  stores,
  value,
  onChange,
  allLabel,
  placeholder,
  id,
  allowAll = true,
}: StoreScopeSelectProps) => {
  const handleChange = (next: string) => {
    onChange(next === ALL_STORES_VALUE ? null : Number(next));
  };

  return (
    <Select
      value={value == null ? (allowAll ? ALL_STORES_VALUE : "") : String(value)}
      onValueChange={handleChange}
    >
      <SelectTrigger id={id} aria-label={placeholder} className="max-w-sm">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowAll ? (
          <SelectItem value={ALL_STORES_VALUE}>{allLabel}</SelectItem>
        ) : null}
        {stores.map((store) => (
          <SelectItem key={store.id} value={store.id.toString()}>
            {storeLabel(store)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

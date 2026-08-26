import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export function StateSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { data: states = [], isLoading } = useQuery({
    queryKey: ["states"],
    queryFn: async () => (await api.get("/locations/states")).data,
  });

  if (isLoading) return <Skeleton className="h-10 w-full" />;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione o estado" />
      </SelectTrigger>
      <SelectContent>
        {states.map((s: any) => (
          <SelectItem key={s.sigla} value={s.sigla}>
            {s.sigla} — {s.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CitySelect({
  state,
  value,
  onChange,
}: {
  state?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { data: cities = [], isLoading } = useQuery({
    queryKey: ["cities", state],
    queryFn: async () =>
      state ? (await api.get(`/locations/cities/${state}`)).data : [],
    enabled: !!state,
    staleTime: 5 * 60 * 1000,
  });

  if (!state) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Selecione o estado primeiro" />
        </SelectTrigger>
      </Select>
    );
  }

  if (isLoading) return <Skeleton className="h-10 w-full" />;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione a cidade" />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {cities.map((c: any) => (
          <SelectItem key={c.id} value={c.nome}>
            {c.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
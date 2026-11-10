import { MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LOCATIONS } from "@/lib/locations";

export function LocationSelect({
  value,
  onChange,
  id = "location",
  className,
}: {
  value: string;
  onChange: (id: string) => void;
  id?: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className={className} aria-label="Campus location">
        <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LOCATIONS.map((l) => (
          <SelectItem key={l.id} value={l.id}>
            {l.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

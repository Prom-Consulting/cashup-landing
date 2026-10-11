import { Location01Icon } from "@hugeicons/core-free-icons";
import { Button, Icon } from "@loal/ui/shadcn";
import { SITE_URL } from "../../shared/config/env";

export function PartnersButton() {
  return (
    <Button asChild size="lg">
      <a href={`${SITE_URL.replace(/\/$/, "")}/partners`}>
        <Icon icon={Location01Icon} />
        Где потратить
      </a>
    </Button>
  );
}

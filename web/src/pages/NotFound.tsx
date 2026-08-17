import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { EmptyState, Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="animate-fade-in pt-10">
      <EmptyState
        icon={Compass}
        title="Seite nicht gefunden"
        description="Diese Route gehört zu keinem Modul der Control Plane."
        action={
          <Link to="/">
            <Button variant="primary" size="sm">
              Zur Übersicht
            </Button>
          </Link>
        }
      />
    </div>
  );
}

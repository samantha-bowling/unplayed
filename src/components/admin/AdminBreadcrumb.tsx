import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface AdminBreadcrumbProps {
  currentPage: string;
}

const AdminBreadcrumb = ({ currentPage }: AdminBreadcrumbProps) => (
  <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
    <Link
      to="/admin/dashboard"
      className="hover:text-foreground transition-colors"
    >
      Admin Dashboard
    </Link>
    <ChevronRight className="h-3.5 w-3.5" />
    <span className="text-foreground">{currentPage}</span>
  </nav>
);

export default AdminBreadcrumb;

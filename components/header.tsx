import Link from "next/link";
import NavItems from "./NavItems";
import { TrendingUp } from "lucide-react";
import UserDropdown from "./UserDropdown";

const Header = () => {
  return (
    <header className="sticky top-0 header">
      <div className="container header-wrapper">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-yellow-500/10 p-1.5 rounded-lg transition-colors group-hover:bg-yellow-500/20">
            <TrendingUp className="h-6 w-6 text-yellow-500" />
          </div>
          <span className="text-xl font-bold text-gray-100 tracking-tight">
            Indices
          </span>
        </Link>
        <nav className="hidden sm:block">
          <NavItems />
        </nav>
        <UserDropdown />
      </div>
    </header>
  );
};

export default Header;

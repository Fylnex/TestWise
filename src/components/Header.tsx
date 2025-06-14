import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="bg-slate-900 text-white py-3 px-6">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo and Site Name */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold">Название сайта</h1>
        </div>

        {/* Navigation Menu */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            to="/"
            className="text-sm hover:text-purple-300 transition-colors"
          >
            Home
          </Link>
          <Link
            to="/task"
            className="text-sm hover:text-purple-300 transition-colors"
          >
            Task
          </Link>
          <Link
            to="/rating"
            className="text-sm hover:text-purple-300 transition-colors"
          >
            Rating
          </Link>
          <Link
            to="/events"
            className="text-sm hover:text-purple-300 transition-colors"
          >
            Events
          </Link>
          <Link
            to="/about"
            className="text-sm hover:text-purple-300 transition-colors"
          >
            About Us
          </Link>
        </nav>

        {/* User Avatar */}
        <div className="flex items-center">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg" alt="User avatar" />
            <AvatarFallback className="bg-purple-600 text-white text-xs">
              U
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Mobile Menu Button (for future implementation) */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden text-white hover:bg-slate-800"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </Button>
      </div>
    </header>
  );
};

export default Header;

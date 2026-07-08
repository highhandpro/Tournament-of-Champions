"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NotFound = () => {
  const location = usePathname();


  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <Link href="/" className="text-[#cc2616] underline hover:text-[#cc2616]/90">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

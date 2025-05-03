import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
      <p className="mb-6 text-muted-foreground">
        We couldn&apos;t find the page you were looking for.
      </p>
      <Button asChild>
        <Link href="/en/dashboard">Go back home</Link>
      </Button>
    </div>
  );
}

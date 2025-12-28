import { Link } from "react-router-dom";
import { Home, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-muted mb-8">
          <Leaf className="w-12 h-12 text-muted-foreground" />
        </div>
        <h1 className="font-display text-6xl md:text-8xl font-bold bg-gradient-to-r from-[hsl(174,72%,45%)] to-[hsl(200,80%,50%)] bg-clip-text text-transparent mb-4">
          404
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          This path doesn't exist... yet.
        </p>
        <Link to="/">
          <Button variant="gradient" size="lg">
            <Home className="w-5 h-5" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

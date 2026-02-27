import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface LegalPageProps {
  title: string;
  children: React.ReactNode;
}

export default function LegalPage({ title, children }: LegalPageProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="flex items-center px-4 pt-4 pb-2 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border/30">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ms-2 text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </button>
        <h1 className="text-lg font-extrabold ms-2">{title}</h1>
      </div>

      <div className="px-6 py-6 legal-content">
        {children}
      </div>
    </div>
  );
}

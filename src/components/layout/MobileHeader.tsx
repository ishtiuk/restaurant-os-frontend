import React from "react";
import { Menu, Bell, Search, Utensils, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30 lg:hidden">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onMenuClick}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center">
              <Utensils className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold gradient-text">RysTRO</span>
          </div>
        </div>


      </div>
    </header>
  );
}

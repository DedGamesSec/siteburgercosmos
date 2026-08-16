import React from "react";
import { ChevronRight, Home } from "lucide-react";
import { useNavigation, PageId } from "../navigation/NavigationContext";
import { useTranslation } from "../i18n/LanguageContext";
import { ORDERED_PAGES } from "../navigation/pages.config";

interface BreadcrumbsProps {
  currentPage: PageId;
}

export default function Breadcrumbs({ currentPage }: BreadcrumbsProps) {
  const { navigateTo } = useNavigation();
  const { t } = useTranslation();

  const labels = t.pageNames;
  const currentLabel = labels[currentPage] || currentPage;
  const isConfiguredPage = ORDERED_PAGES.some((page) => page.id === currentPage);

  if (currentPage === "home" || !isConfiguredPage) return null;

  return (
    <div className="w-full bg-[#0A0A0B]/80 backdrop-blur-md border-b border-[#3C404A]/30 pt-5 pb-3 px-4 z-40">
      <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs font-mono">
        <button
          onClick={() => navigateTo("home")}
          className="flex items-center gap-1.5 text-gray-400 hover:text-[#3B82F6] transition-colors cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          <span>{labels.home}</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
        <span className="text-[#3B82F6] font-semibold">{currentLabel}</span>
      </div>
    </div>
  );
}

"use client";

import { FOYPageTransition } from "../_components/FOYPageTransition";
import { FOYAppLayoutRouter } from "../_components/FOYAppLayoutRouter";

export default function FocusedOnYouLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="focusedonyou-no-zoom min-h-screen">
      <FOYPageTransition>
        <FOYAppLayoutRouter>{children}</FOYAppLayoutRouter>
      </FOYPageTransition>
    </div>
  );
}

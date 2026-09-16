"use client";

import { motion } from "framer-motion";
import { CategoryCard } from "@/components/CategoryCard";
import { categories } from "@/lib/data";
import { easeExpo } from "@/lib/motion";

export function CategoryGrid() {
  return (
    <section className="pb-10 pt-2 sm:pb-14 sm:pt-4">
      <div className="container-page">
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {categories.map((card, i) => (
            <motion.div
              key={card.href}
              className="h-full"
              initial={{ opacity: 0, y: 48 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -8% 0px", amount: 0.15 }}
              transition={{
                duration: 0.85,
                delay: i * 0.12,
                ease: easeExpo,
              }}
            >
              <CategoryCard card={card} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

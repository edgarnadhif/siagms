"use client";

import { useState } from "react";
import { Reorder, AnimatePresence } from "framer-motion";
import ProjectCard, { type ProjectCardProject } from "./ProjectCard";

interface ProjectGridProps {
  initialProjects: ProjectCardProject[];
}

export default function ProjectGrid({ initialProjects }: ProjectGridProps) {
  const [projects, setProjects] = useState(initialProjects);

  return (
    <Reorder.Group
      axis="y"
      values={projects}
      onReorder={setProjects}
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-3"
    >
      <AnimatePresence mode="popLayout">
        {projects.map((project) => {
          return (
            <Reorder.Item
              key={project.id}
              value={project}
              id={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="cursor-grab active:cursor-grabbing outline-none h-full"
              whileDrag={{ 
                scale: 1,
                zIndex: 50,
                boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)"
              }}
            >
              <ProjectCard 
                project={project} 
                transactionCount={project.transactionCount}
                totalIncome={project.totalIncome}
                totalExpense={project.totalExpense}
              />
            </Reorder.Item>
          );
        })}
      </AnimatePresence>
    </Reorder.Group>
  );
}

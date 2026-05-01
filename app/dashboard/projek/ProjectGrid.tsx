"use client";
import ProjectCard, { type ProjectCardProject } from "./ProjectCard";

interface ProjectGridProps {
  initialProjects: ProjectCardProject[];
}

export default function ProjectGrid({ initialProjects }: ProjectGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-3">
      {initialProjects.map((project) => (
        <div key={project.id} className="h-full">
          <ProjectCard
            project={project}
            transactionCount={project.transactionCount}
            totalIncome={project.totalIncome}
            totalExpense={project.totalExpense}
          />
        </div>
      ))}
    </div>
  );
}

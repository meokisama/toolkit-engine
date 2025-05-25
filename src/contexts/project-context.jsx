import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

const ProjectContext = createContext();

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load projects from database
  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const projectsData = await window.electronAPI.projects.getAll();
      setProjects(projectsData);
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('Failed to load projects');
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Create new project
  const createProject = async (projectData) => {
    try {
      const newProject = await window.electronAPI.projects.create(projectData);
      setProjects(prev => [newProject, ...prev]);
      toast.success('Project created successfully');
      return newProject;
    } catch (err) {
      console.error('Failed to create project:', err);
      toast.error('Failed to create project');
      throw err;
    }
  };

  // Update project
  const updateProject = async (id, projectData) => {
    try {
      const updatedProject = await window.electronAPI.projects.update(id, projectData);
      setProjects(prev => 
        prev.map(project => 
          project.id === id ? updatedProject : project
        )
      );
      toast.success('Project updated successfully');
      return updatedProject;
    } catch (err) {
      console.error('Failed to update project:', err);
      toast.error('Failed to update project');
      throw err;
    }
  };

  // Delete project
  const deleteProject = async (id) => {
    try {
      await window.electronAPI.projects.delete(id);
      setProjects(prev => prev.filter(project => project.id !== id));
      toast.success('Project deleted successfully');
    } catch (err) {
      console.error('Failed to delete project:', err);
      toast.error('Failed to delete project');
      throw err;
    }
  };

  // Duplicate project
  const duplicateProject = async (id) => {
    try {
      const duplicatedProject = await window.electronAPI.projects.duplicate(id);
      setProjects(prev => [duplicatedProject, ...prev]);
      toast.success('Project duplicated successfully');
      return duplicatedProject;
    } catch (err) {
      console.error('Failed to duplicate project:', err);
      toast.error('Failed to duplicate project');
      throw err;
    }
  };

  // Get project by ID
  const getProjectById = (id) => {
    return projects.find(project => project.id === id);
  };

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const value = {
    projects,
    loading,
    error,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    getProjectById,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

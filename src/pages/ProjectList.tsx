import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { projectService } from '../services/api';
import { Loader2 } from 'lucide-react';

interface Project {
  _id: string;
  title: string;
  description: string;
  category: string;
}

// Cache object to store projects by category
const projectsCache: Record<string, { data: Project[], timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const ProjectList = () => {
  const { category } = useParams<{ category: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getCategoryTitle = useCallback(() => {
    switch (category) {
      case 'btech':
        return 'B.Tech Projects';
      case 'mtech':
        return 'M.Tech Projects';
      case 'mca':
        return 'MCA Projects';
      case 'degree':
        return 'Degree Projects';
      default:
        return 'Projects';
    }
  }, [category]);

  // Update document title for SEO
  useEffect(() => {
    document.title = `${getCategoryTitle()} - IRSDL Projects`;
  }, [getCategoryTitle]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!category) return;

      try {
        setLoading(true);
        setError('');

        // Check cache first
        const cached = projectsCache[category];
        const now = Date.now();

        if (cached && now - cached.timestamp < CACHE_DURATION) {
          setProjects(cached.data);
          setLoading(false);
          return;
        }

        const response = await projectService.getProjects(category);
        
        // Update cache
        projectsCache[category] = {
          data: response.data,
          timestamp: now
        };

        setProjects(response.data);
      } catch (err) {
        setError('Failed to load projects');
        // Show cached data if available, even if expired
        if (projectsCache[category]) {
          setProjects(projectsCache[category].data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [category]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">{getCategoryTitle()}</h1>
        <div className="space-y-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">{getCategoryTitle()}</h1>
      
      {error && projects.length === 0 && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {projects.length === 0 && !error ? (
        <p className="text-gray-600 text-center py-8">No projects available in this category.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {projects.map((project) => (
            <div
              key={project._id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-3 text-gray-800">{project.title}</h3>
              <p className="text-gray-600">{project.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectList;
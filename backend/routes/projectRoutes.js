import express from 'express';
import Project from '../models/Project.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Cache middleware
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const cacheMiddleware = (req, res, next) => {
  const key = req.params.category;
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return res.json(cached.data);
  }
  
  next();
};

// Get all projects by category
router.get('/:category', cacheMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ category: req.params.category })
      .select('title description category')
      .lean()
      .exec();

    // Update cache
    cache.set(req.params.category, {
      data: projects,
      timestamp: Date.now()
    });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new project (admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    const project = new Project(req.body);
    const savedProject = await project.save();
    // Clear cache for the affected category
    cache.delete(req.body.category);
    res.status(201).json(savedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update project (admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    // Clear cache for the affected categories
    cache.clear(); // Clear all cache since category might have changed
    res.json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete project (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (project) {
      await Project.deleteOne({ _id: req.params.id });
      // Clear cache for the affected category
      cache.delete(project.category);
      res.json({ message: 'Project deleted successfully' });
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
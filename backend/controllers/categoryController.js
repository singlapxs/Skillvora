const Category = require('../models/Category');

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
exports.getCategories = async (req, res, next) => {
  try {
    // If no categories exist, bootstrap a few common ones out of the box
    let categories = await Category.find({});
    
    if (categories.length === 0) {
      const defaultCats = [
        { name: 'MERN Stack', slug: 'mern-stack' },
        { name: 'AI/ML', slug: 'ai-ml' },
        { name: 'Frontend Engineering', slug: 'frontend-engineering' },
        { name: 'Backend Engineering', slug: 'backend-engineering' },
        { name: 'Data Structures & Algorithms', slug: 'dsa' }
      ];
      await Category.insertMany(defaultCats);
      categories = await Category.find({});
    }

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Private/Admin
 */
exports.createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Please provide a category name' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const categoryExists = await Category.findOne({ slug });
    
    if (categoryExists) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const category = await Category.create({ name, slug });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

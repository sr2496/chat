const User = require('../models/User');

// @desc    Get all users with pagination and search
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    try {
        const query = {
            _id: { $ne: req.user._id } // Exclude self
        };

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const users = await User.find(query)
            .select('-password') // Exclude password
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(query);

        res.status(200).json({
            users,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getUsers
};

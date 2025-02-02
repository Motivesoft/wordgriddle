const { db, dbAll, dbGet } = require('./database');

class UserOperations {
    constructor() {
        // Insert some hard-wired entries
        db.run(`INSERT OR IGNORE INTO users (id, name) VALUES (1, "Ian" )`);
        db.run(`INSERT OR IGNORE INTO users (id, name) VALUES (2, "Catherine" )`);
        db.run(`INSERT OR IGNORE INTO users (id, name) VALUES (3, "Squaredle" )`);
    }

    // Endpoints

    async getUserList(req, res) {
        try {
            console.log(this);
            const users = await this.getUsers();
            res.status(200).json({ userCount: users.length, users: users });
        } catch (error) {
            console.error("Failed to get user list:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    // Other methods

    async getUsers() {
        console.debug(`Getting all users`);

        return await dbAll(`SELECT id, name FROM users ORDER BY name ASC`);
    }
}

// Declare the instance
const userOperations = new UserOperations();

module.exports = { userOperations };
// Internal requires
const { dbAll, dbGet, dbRun } = require('./database');

// Doing this allows us to read version info etc.
var packageInfo = require('./package.json');

class AdminOperations {
    constructor() {
    }

    // Endpoints

    async getVersionInfoEndpoint(req, res) {
        try {
            const [name, version] = await this.getVersionInfo();
            res.status(200).json({ name: name, version: version, label: `${name} ${version}` });
        } catch (error) {
            console.error("Failed getting version info:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    // Run a database
    async vacuumEndpoint(req, res) {
        try {
            await this.vacuum();
            res.status(200).json({ status: 'completed' });
        } catch (error) {
            console.error("Failed during vacuum:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    };

    // Issue a process shutdown
    async shutdownEndpoint(req, res) {
        console.log('Shutting down');
        process.exit(1);
    }

    async getUserEndpoint(req, res) {
        const id = req.params.id;
        try {
            const user = await this.getUser(id);
            res.status(200).json(user);
        } catch (error) {
            console.error("Failed to get user:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    async getUsersEndpoint(req, res) {
        try {
            const users = await this.getUsers();
            res.status(200).json({ userCount: users.length, users: users });
        } catch (error) {
            console.error("Failed to get user list:", error.message);
            res.status(500).json({ message: 'An error occurred', error: error.message });
        }
    }

    // Other methods

    async getVersionInfo() {
        return [packageInfo.name,packageInfo.version];
    }

    async getUser(id) {
        console.debug(`Getting user with ID: ${id}`);

        return await dbGet(`SELECT id, name FROM users WHERE id = ? ORDER BY name ASC`,[id]);
    }

    async getUsers() {
        console.debug(`Getting all users`);

        return await dbAll(`SELECT id, name FROM users ORDER BY name ASC`);
    }

    async vacuum() {
        console.debug(`Running vacuum`);

        return await dbRun(`VACUUM`);
    }
}

// Declare the instance
const adminOperations = new AdminOperations();

module.exports = { adminOperations };
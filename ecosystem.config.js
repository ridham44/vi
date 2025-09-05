require('dotenv').config();

module.exports = {
    apps: [
        {
            name: 'MyCo-CRM',
            script: 'server.js', // replace with your actual script
            node_args: '--max-old-space-size=4096',
            instances: 1, // or "max" for cluster mode
            autorestart: true,
            watch: false,
            max_memory_restart: '4G', // optional: auto-restart if it exceeds this
            env: {
                NODE_ENV: process.env.NODE_ENV,
            },
        },
    ],
};
